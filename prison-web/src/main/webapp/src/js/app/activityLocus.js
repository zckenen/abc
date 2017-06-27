define(['router', 'global', 'areaLinkpage', 'videoControl'], function(Router, Global, AreaLinkpage, VideoControl){
	var activityLocus = { };
    
	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			cri_picpath: ''
		}
	});
	
	// 数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		url: Global.path + '/loadHistoryInfo.do'
	}))();

	// 轨迹搜索相关变量
	var // 搜索定时器
		timer,
		// 是否处于请求中
		isRequest = false,
		// 上一次输入的完毕时搜索框中的值
		lastkey = '',
		// 选定时间内的轨迹数量
		length = 0,
		// 当前播放到的帧数
		frame = 0,
		// 播放是否就绪
		isReady = false,
		// 是否处于暂停中
		isPause = false,
		// 是否处于播放中
		isPlay = false,
		// 是否播放完毕
		isOver = true,
		// 播放定时器
		playTimer,
		// 轨迹地图容器高度
		_height,
		// 上一楼层id
		_lastPicId,
		// svg命名空间
		_svgNS = 'http://www.w3.org/2000/svg',
		// svg地图
		_svgMap,
		// 地图图片
		_imgMap,
		// 当前图片
		_image,
		// 图片缓存
		_imageCache = {},
		// 人物svg
		_peoSvg,
		// 轨迹path路径
		_svgPath,
		// 路径属性集合
		_pathArray = [],
		// 路径属性
		_path,
		// 是否需要重新创建地图
		_isRefresh = true,
		// 区域信息
		_locinfos;
	// 清除播放计时器
	var clearPlayTimer = function() {
		clearInterval( playTimer );
		playTimer = null;
	};
	// 人员模型
	var person = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			cri_picpath: '',
			name: '',
			cri_charge: '',
			cri_startdate: '',
			peo_groupid: '',
			cri_sex: 0
		}
	});
	// 人员数据集合
	var persons = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		url: Global.path + '/main/findPeopleInfoByIdOrName.do'
	}))();

	// 弹出轨迹选择
	var history = Backbone.View.extend({
		el: '#historyRange',
		events: {
			// 定时器搜索人员
			'focus.focus [data-event=lookfor]': 'focus',
			// 解除定时器
			'blur.blur [data-event=lookfor]': 'blur',
			// 获取人物详情
			'click.find [data-event=find]': 'find',
			// 关闭列表并清除记录
			'click.closed [data-event=closed]': 'closed',
			// 搜索轨迹记录
			'click.search [data-event=search]': 'search',
			// 播放轨迹
			'click.play [data-event=play]': 'play',
			// 暂停播放
			'click.pause [data-event=pause]': 'pause',
			// 停止播放
			'click.stop [data-event=stop]': 'stop',
			// 上一条
			'click.prev [data-event=prev]': 'prev',
			// 下一条
			'click.next [data-event=next]': 'next',
			// 禁止冒泡
			'click.unbubble [data-event=unbubble]': 'unbubble',
			// 点击返回隐藏
			'click.hide [data-event=hide]': 'hide',
			// 缩略图伸缩
			'click.slide [data-event=slide]': 'slide',
			// 右边详细小地图显示与隐藏
			'click.hide [data-event=rightHide]': 'rightHide',
			// 开启视频
			'click.videoPlay [data-event=videoPlay]': 'videoPlay',
			// 开启音频
			// 'click.playAudio [data-event=playAudio]': 'playAudio',
			// 关闭视频
			// 'click.closeVideo [data-event=closeVideo]': 'closeVideo',
			// 关闭音频
			'click.closeAudio [data-event=closeAudio]': 'closeAudio',
		},
		initialize: function() {
			var self = this;
			this.$el = $(this.el);
			// this.template = _.template( $('#historyRangeTpl').html() );
			// 摄像头信息集合
			this.cameras = {};
			// 个人信息模板与容器以及人员搜索框
			// this.personTpl 		= _.template( $('#historyPersonTpl').html() );
			this.$person 		= this.$el.find('#historyPerson');
			this.$condition 	= this.$el.find('[name=condition]'); // 搜索条件
			// this.personListTpl 	= _.template( $('#historyPersonListTpl').html() ); // 人员下拉模板
			var $personlist = this.$personList   = this.$condition.next(); // 搜索结果列表容器
			// 活动范围内容区
			this.$container = this.$el.find('#container');
			// 时间选择
			UI.datetimepicker( this.$el.find('.datetimepicker') );
			// 开始与结束时间
			this.$start = this.$el.find('[name=startTime]');
			this.$end 	= this.$el.find('[name=endTime]');
			// 小地图容器与容器上的定位点
			this.$thumb = $('#overview-thumb').parent();
			this.$point = $('#overview-thumb-point');
			// 播放与停止按钮
			this.$play = this.$el.find('[data-event=play]');
			this.$stop = this.$el.find('[data-event=stop]');
			// 右侧楼层地图容器
			var $floor = this.$floor = $('#historyFloor');
			_height = $(window).height() - 110;
			this.$floorMap = $('#historyMaps').css({
				width: $(window).width() - 400,
				height: _height,
				overflow: 'auto'
			});
			this.$region = $('#history-loc');
			// 根据屏幕计算内容区的高度
			this.$historyNoresult = $('#historyNoresult');
			var handleHeight = function() {
				var winHeight = $(window).height(),
					winWidth = $(window).width();
				self.$el.height( winHeight - 75 );
				// 当高度小于800的时候
				if ( winHeight > 800 ) {
					self.$historyNoresult.css('height', winHeight - 640);
				} else {
					self.$historyNoresult.css('height', winHeight - 330);
					self.$el.find('[data-event=slide]').trigger('click', true);
				}
				// 楼层图
				$floor.css({
					'height': winWidth - 75,
					'width': winWidth - 400
				});
			};
			// 执行计算
			handleHeight();
			// 处理隐藏
			Layout.addClickHandler(function(){
				$personlist.hide();
			});
			// 加入resize
			Layout.addResizeHandler(handleHeight, self);
			// 页面初始化缓存
			this.cache = {
				person: this.$person.html(),
				result: self.$historyNoresult.attr('outerHTML'),
				personlist: this.$personList.html()
			};
			// 进度
			this.$progress = this.$el.find('.partial-loading');
			// 视频框
			this.$video = this.$el.find('#videoPlay');
			// svg地图
			_svgMap = document.getElementById('historyLocMap');
			// 创建svg人物
			_peoSvg = document.createElementNS(_svgNS, 'text');
			$(_peoSvg).attr({
				'class': 'iconfont'
			}).css({
				'fill': 'blue',
				'color': 'blue',
				'fontSize': '30px'
			}).html('&#xe69c;');
			// 创建svg路径
			_svgPath = document.createElementNS(_svgNS, 'path');
			// 设置路径属性
			_svgPath.setAttribute('class', 'locus-svg-path');
			_svgPath.setAttribute('filter', 'url(#pathShadow)');
		},
		initPlaybox: function() {
			this.$video = this.$el.find('[data-view=video]');
			this.DOMid = 'vid-frame-container' ;
			// 计算播放窗口的高度
			var height = 200;
			// 设置video
			this.$video.css({
				height: (height + 50) + 'px'
			})
			// 创建播放容器
			var $frame = $('<div>');
			// 设置容器
			$frame.appendTo( this.$video )
				  .addClass('video-body')
				  .attr({
				  	id: this.DOMid
				  })
				  .css({
				    height: height + 'px'
				  });
		},
		/**
		 * 视频播放
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		videoPlay: function( event ) {
			var self = this,
				// 当前点击摄像头元素
				$con = $(event.currentTarget),
				// 当前的index
				index = $con.attr('data-index'),
				// 摄像头id
				locId = $con.attr('data-locid'),
				// 摄像头
				cameras,
				// 开始结束时间
				startTime, endTime;
			// 遍历数据
			self.source.filter(function(item, i){
				if ( locId == item.locInfo.id && i == index ){
					cameras = item.locInfo.camera;
					startTime = item.alarmLoc.allTimestamp;
					endTime = self.$end.val();
				}
			});
			// 显示层地图
			self.$floor.show();
			

			if ( !self.videoControlIns ) {
				self.videoControlIns = VideoControl.init( self.DOMid );
			}
			if (self.videoControlIns.status) {
				// 显示播放容器
				self.$video.show().parent().show();
				self.videoControlIns.playlive( cameras, 2, startTime, endTime);
			} else {
				var html = '<div>';
				html += '<p>您的浏览器版本过低或视频控件未安装，为了保证正常使用，请 ';
				html += '<a id="compoentDownload" href="'+ Global.path +'/upload/firefox.rar">点击下载控件</a></p>'
				html += '</div>';
				UI.alert({ message: html, type: 'warning', close: false});
			}
		},
		/**
		 * 当前input输入框获得焦点时,生成一个定时器,定时检测input中的值
		 * 每隔一秒钟将检测到的值向后台请求搜索数据
		 * @param  {object} event [事件对象]
		 * @return {false}    	  [禁止冒泡]
		 */
		focus: function( event ) {
			var self = this;
			// 如果定时器不存在新建定时器
			if ( !timer ) {
				timer = setInterval(function(){
					// 如果处于请求中那么不再次执行请求
					if ( !isRequest ) {
						var key = $.trim( self.$condition.val() );
						if ( key && key != lastkey ) {
							// 执行搜索
							self.lookfor({condition: key});
							// 更换lastkey
							lastkey = key;
						}
					};
				}, 1000);
			}
			// 显示结果
			self.$personList.show();

			return false;
		},
		lookfor: function( param ) {
			var self = this,
				content = self.cache.personlist,
				model;
			// 请求
			isRequest = true;
			persons.fetch({
				data: param,
				type: 'post',
				success: function( collection, data, xhr ) {
					if ( data.data ) {
						content = '';
						// 遍历
						$.each(persons.models, function(){
							model = this.toJSON();
							// 模板的拼接
							content += template( 'historyPersonListTpl', model );
						});
					}
					// 渲染
					self.$personList.show().html( content )
					// 请求结束可以进行下一次请求
					isRequest = false;
				},
				error: function() {
					// 请求结束可以进行下一次请求
					isRequest = false;
				}
			});
		},
		/**
		 * 搜索框失去焦点后清除定时器
		 * @param  {object} event [事件对象]
		 * @return {false}    [禁止冒泡]
		 */
		blur: function( event ) {
			clearInterval( timer );
			timer = null;
			return false;
		},
		/**
		 * 获取人物详情信息
		 * @param {object} event 事件对象
		 * @return {undefined}   无返回
		 */
		find: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			// 请求并渲染
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				data: {id: id},
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				var model = data.data;
				// 渲染人物信息
				self.$person.html( template('historyPersonTpl', model) ); 
				// 人物的名字放入搜索框
				self.$condition.val( model.peoName );
				// 隐藏
				self.$personList.hide();
				// 作为属性
				self.personModel = model;
			});
		},
		/**
		 * 关闭列表并清除关键字
		 * @return {undefined} 无返回
		 */
		closed: function() {
			this.$personList.hide();
			this.$condition.val('');
		},
		/**
		 * [禁止冒泡]
		 * @return {[type]} [description]
		 */
		unbubble: function() {
			return false;
		},
		/**
		 * 轨迹搜索
		 * @return {undefined} 无返回
		 */
		search: function() {
			var self = this,
				startTime = this.$start.val(),
				endTime = this.$end.val(),
				watNum = this.$el.find('[name=watNum]').val();
			// 验证
			if ( !watNum || watNum == '' ) {
				UI.alert({ message: Global.lang.m23, type: 'danger', close: false });
				return;
			}

			if ( startTime == '' || endTime == ''  ){
				UI.alert({ message: Global.lang.m21, type: 'danger', close: false });
				return;
			}

			if ( startTime > endTime ){
				UI.alert({ message: Global.lang.m20, type: 'danger', close: false });
				return;
			}

			var stampEnd = new Date(endTime).getTime();
			var stampStart = new Date(startTime).getTime();
			if (stampEnd - stampStart > 86400 * 1000) {
				UI.alert({ message: Global.lang.m30, type: 'danger', close: false });
				return;
			}
			
			// 参数
			var param = {
				startTime: startTime,
				endTime: endTime,
				watNum: watNum
			},
			
			// 内容字符串
			content = '';
			// 如果存在人员编号
			if ( param.watNum ) {
				// 开启进度
				progress.partial( true, this.$container );
				self.$historyNoresult.css('opacity', 0);
				// 请求数据
				$.http({
					url: Global.path + '/main/loadHistoryInfo.do',
					data: param,
					dataType: 'json', 
					type: 'post'
				}).done(function(data){
					if ( data.data ) {
						/*var x, y;
						data.data.sort(function(a, b){
							x = new Date( a.alarmLoc.allTimestamp ).getTime();
							y = new Date( b.alarmLoc.allTimestamp ).getTime();
							return  x - y;
						});*/
						if (!_locinfos) {
							_locinfos = {};
							data.codes.forEach(function(item){
								_locinfos[item.id] = item;
							});
						}
						
						// 过滤后的数据
						var list = {data: [], length: 0};
						
						
						data.data.forEach(function(item, i){
							if(item.alarmLoc && (item.locInfo = _locinfos[item.alarmLoc.allLocid])) {
								list.data.push(item);
								list.length++;
							}
						});
						console.log('list',list,_locinfos,_locinfos['b2a14118dbfc49b881186b25b199fc35']);
						// 播放数据源
						self.source = list.data;
//						// 数据长度
						length = list.length;
						// 渲染
						content += template( 'historyRangeTpl', list);
						self.$container.html( content );
						// 计算高度
						self.$result = $('#historyResult');
						self.$result.css('height', $(window).height() - 350);
						// 添加虚拟滚动条
						UI.iscroll( self.$result, {alwaysVisible: true, size: '5px'} );
						// 如果有轨迹数据
						if ( list.length > 0 ) {
							//console.log('data.data[0] ',list.data[0] );
							// 地图定位
							self.locate( list.data[0] );
							// 准备就绪可以播放
							isReady = true;
							// 激活播放与停止按钮
							self.$play.addClass('active');
						}
					} else {
						UI.alert({ message: Global.lang.m24, type: 'danger', close: false });
						// 显示无结果
						self.$historyNoresult.css('opacity', 1);
					}
					
				}).always(function(){
					// 关闭进度
					progress.partial( false );
				});
			}
		},
		/**
		 * 在地图上播放历史轨迹
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		play: function( event ) {
			// 判断是否准备就绪
			if ( !isReady ) return false;

			var self = this,
				$con = $(event.currentTarget);
			// 显示层地图
			self.$floor.show();
			// 开始与暂停按钮转换
			$con.hide().next().show();
			// 停止按钮激活
			self.$stop.addClass('active');
			// 处于播放中
			isPlay = true; 
			// 处于非暂停状态
			isPause = false;
			// 定时器每3秒播放一次
			playTimer = setInterval(function(){
				// 如果处于暂停状态
				if ( !isPause ) {
				// console.log( 'self.source[ frame ]',self.source[ frame ],self.source.length ,frame);
					self.locate( self.source[ frame ] );
					// +1
					frame++;
					// 如果播放完毕清除定时器
					if ( frame == self.source.length ) {
						clearPlayTimer();
						// 播放完毕
						isOver = true;
						isPlay = false;
						frame = 0;
						// 开始与暂停按钮转换
						$con.show().next().hide();
						// 停止按钮失去效果
						self.$stop.removeClass('active');
					}
					
				} else {
					clearPlayTimer();
				}
				
			}, 2000);
			
		},
		/**
		 * 暂停播放
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		pause: function( event ) {
			var self = this,
				$con = $(event.currentTarget);
			// 状态变换
			isPause = true;
			// 开始与暂停按钮转换
			$con.hide().prev().show();
		},
		/**
		 * 停止播放
		 * @return {[type]} [description]
		 */
		stop: function() {
			// 只有处于播放中才可以停止
			if ( isPlay ) {
				clearPlayTimer();
				// 改变状态
				isOver = true;
				isPlay = false;
				isPause = false;
				frame = 0;
				// 还原到第一个位置
				this.locate( this.source[ frame ] );
				// 停止按钮灰化
				this.$stop.removeClass('active');
				// 还原开始按钮
				this.$play.show().next().hide();
				// 清除轨迹线
				$(_svgPath).remove();
				// 更新状态
				_isRefresh = true;
			};

		},
		/**
		 * 上一个区域
		 * @return {[type]} [description]
		 */
		prev: function(){
			// 帧数减一并执行
			if ( frame > 0 && isReady ) {
				//console.log('frame',frame,length);
				// 先暂停
				this.$el.find('[data-event=pause]').trigger('click');
				// 减一帧轨迹线
				_pathArray.pop();
				_pathArray.pop();
				// 上一个区域
				this.locate( this.source[ --frame ]);
			}
		},
		/**
		 * 下一个区域
		 * @return {Function} [description]
		 */
		next: function() {
			// 帧数加一并执行
			if ( frame < length-1 && isReady ) {
				//console.log('frame',frame,length);
				var loc = this.source[ ++frame ];
				// 先暂停
				this.$el.find('[data-event=pause]').trigger('click');
				// 下一个区域
				this.locate( loc );
			}
		},
		/**
		 * 定位人物所在建筑处于地图上的位置
		 * @param {object} data 位置信息
		 * @return {undefined} 无返回
		 */
		locate: function( data ) {
			//console.log('locatedata--',data);
			var self = this,
				// 区域信息
				locInfo = data.locInfo,
				// 幢层信息
				coo = locInfo.coo, pic = locInfo.pic;
			// 缩略地图位移
			this.$thumb.css({
				left: -coo.cooMainx + 156,
				top: -coo.cooMainy + 125
			});
			// 在缩略地图上的点位显示
			this.$point.css({
				opacity: 1,
				left: coo.cooMainx - 27,
				top: coo.cooMainy - 27
			}).find('>div').html( coo.cooName );
			// 更新楼层信息
			this.$floor.find('[data-name=cooName]').html( coo.cooName );
			this.$floor.find('[data-name=picName]').html( pic.picName );
			// 渲染地图
			var render = function() {
				// 判断是否需要渲染楼层
				if ( _lastPicId !== undefined && _lastPicId !== pic.id ) _isRefresh = true;
				// 判断是否更换地图
				if ( _isRefresh ) {
					// 清除所有元素
					$(_svgMap).find('image').remove();
					$(_svgMap).find('g').remove();
					// 设置地图viewBox比例
					_svgMap.setAttribute('viewBox', '0, 0,'+ _image.width +',' + _image.height);
					// 设置位置
//					console.log(_height, _image.height)
					$(_svgMap).css({
						position: 'absolute',
						top: Math.abs((_height - _image.height) / 2)
					})
					// 设置地图
					_imgMap = document.createElementNS(_svgNS, 'image');
					$(_imgMap).attr({
						'xlink:href':  Global.path + pic.picPath,
						'width': _image.width,
						'height': _image.height,
						'data-ref': 'svg'
					});
					_imgMap.href.baseVal = Global.path + pic.picPath;
					_svgMap.appendChild( _imgMap );
					// 更新
					_isRefresh = false;
					// 设置上一次楼层id
					_lastPicId = pic.id;
					// 清空路径集合
					_pathArray = [];
					// 设置路径起点
					_path = '';
					_path = 'M ' + locInfo.locMainx + ' ' + locInfo.locMainy + ' ' + 'L ';
					// path节点插入文档
					_svgMap.appendChild( _svgPath );
				}
				// 计算区域信息
				locInfo.ltx = locInfo.locMainx - locInfo.locSizex / 2;
				locInfo.lty = locInfo.locMainy - locInfo.locSizey / 2;
				locInfo.rbx = locInfo.locMainx + locInfo.locSizex / 2;
				locInfo.rby = locInfo.locMainy + locInfo.locSizey / 2;
				// 判断区域是否已经创建
				var locSvg = $(_svgMap).find('[data-id='+ locInfo.id +']')[0];
				if ( !locSvg ) {
					// 创建区域包裹容器
					var g = document.createElementNS(_svgNS, 'g');
					// 设置属性
					$(g).attr({
						'data-id': locInfo.id,
						'class': 'his-g-region'
					});
					// 创建区域
					var locSvg = document.createElementNS(_svgNS, 'rect');
					// 设置区域信息
					$(locSvg).attr({
						id: 'history-loc' + locInfo.id,
						'data-id': locInfo.id,
						'class': 'region',
						'x': locInfo.ltx,
						'y': locInfo.lty,
						'width': locInfo.locSizex,
						'height': locInfo.locSizey,
						'data-ref': 'svg'
					});
					// 插入g元素中
					g.appendChild( locSvg );
					// 插入地图中
					_svgMap.appendChild( g );
				}
				// 创建人物svg
				_svgMap.appendChild( _peoSvg );
				// 设置人的位置
				_peoSvg.setAttribute('x', locInfo.locMainx);
				_peoSvg.setAttribute('y', locInfo.locMainy);
				// 将路径集合放入
				_pathArray.push({
					x: locInfo.locMainx + 10 - Math.random() * 20,
					y: locInfo.locMainy + 10 - Math.random() * 20
				});
				var path = '';
				// 设置线条
				_pathArray.forEach(function(item){
					path += item.x + ' ' + item.y + ' ';
				});
				// 设置路径位置
				_svgPath.setAttribute('d', _path + path);
			};
			// 判断地图是否已经缓存加载过
			_image = _imageCache[ pic.id ];
			if ( !_image ) {
				_image = _imageCache[ pic.id ] = new Image();
				_image.onload = function() {
					render();
				}
				_image.src = Global.path + pic.picPath;
			} else {
				render();
			}
		// 处理轨迹列表滚动
		self.$result.scrollTop( frame * 60 );
		self.$result.find('>li:eq('+ frame +')')
					.addClass('active')
					.siblings('.active')
					.removeClass('active');
		},
		/**
		 * 创建摄像头位置与信息
		 * @param {object} cameras 区域摄像头
		 * @param {object} region 区域数据
		 * @return {[type]} [description]
		 */
		createCamera: function(cameras, region) {
			var self = this,
				// 区域
				$region = $('#history-loc-' + region.loc_id),
				// 摄像头
				$camera,
				// 获取区域右上角点位
				reLeft = parseFloat( $region.css('left') ), 
				reTop = parseFloat( $region.css('top') ),
				// 摄像头left与top
				left, top,
				// 反三角函数的两条直角边
				vEdge, lEdge,
				// 两条直角边正切值以及角度以及象限角度补值
				num, angle, horn = 0;
			// 遍历摄像头
			_.each(cameras, function(camera, i){
				left = camera.cam_mainx - reLeft;
				top = camera.cam_mainy - reTop;
				// 计算偏角
				vEdge = region.loc_centx - camera.cam_mainx;
				lEdge = region.loc_centy - camera.cam_mainy;
				num = vEdge / lEdge;
				// 反正切计算角度
				angle = (180 * Math.atan( num ) / Math.PI).toFixed( 2 ) * 1;
				// 判断象限计算增补值
				if ( (vEdge > 0) && (lEdge > 0) ) { // 第二象限
					horn = 0;
				} else if ( (vEdge < 0) && (lEdge < 0) ) { // 第四象限
					horn = 180;
				} else if ( (vEdge < 0) && (lEdge > 0) ) { // 第一象限
					horn = 180;
				} else if ( (vEdge > 0) && (lEdge < 0) ) { // 第三象限
					horn = 0;
				}
				// console.log( camera.cam_name, angle, horn, angle * 1 + horn )
				// 插入区域中
				$camera = $('<a>');
				$camera.append('<i class="iconfont">&#xe633;</i>')
					   .addClass('video')
				       .attr({
							'data-event': 'videoPlay',
							'data-id': camera.id,
							'title': camera.cam_name
					   })
				       .css({
							position: 'absolute',
							left: left + 'px',
							top: top + 'px',
							transform: 'rotate('+ (angle + horn) +'deg)'
					   })
					   .appendTo( $region );
				// 数据插入集合
				self.cameras[ camera.id ] = camera;
			});
		},
		/**
		 * 渲染人物信息
		 * @param  {object} model 人物信息数据模型
		 * @return {undefined}       无返回
		 */
		load: function( model ) {
			// 渲染人物信息
			this.$person.html( template('historyPersonTpl', model) );
			// 显示
			this.$el.addClass('show');
		},
		/**
		 * 右侧侧轨迹侧滑栏隐藏
		 * @return {undefined} 无返回
		 */
		hide: function() {
			this.$floor.hide();
			this.$el.removeClass('show');
			this.destory();
		},
		/**
		 * 缩略图伸缩
		 * @param  {object} event 事件对象
		 * @bool   {bool}   bool 用于判断是否是trigger触发
		 * @return {undefined}    无返回
		 */
		slide: function( event, bool ) {
			var $con = $(event.currentTarget),
				$header = $con.parent(),
				$box = $header.next();
			// 判断
			if ( !$box.hasClass('hide') || bool ) {
				$header.css('bottom', '0');
				$box.css('bottom', '-250px');
				$box.addClass('hide');
				$con.find('>i').html('&#xe652;');
			} else {
				$header.css('bottom', '262px');
				$box.css('bottom', '6px');
				$box.removeClass('hide');
				$con.find('>i').html('&#xe653;');
			}
		},
		/**
		 * 供外部调用
		 * 用于显示历史记录容器并还原未搜索初始状态
		 * @return {undefined} 无返回
		 */
		appear: function(){
			this.$el.addClass('show');
			this.initPlaybox();
			// 默认为当前前一天
			var day = new Date();
			var today = day.Format('yyyy-MM-dd hh:mm:ss');
			var yestoday = (new Date(day.getTime() - 86400 * 1000)).Format('yyyy-MM-dd hh:mm:ss');
			this.$el.find('[name=startTime]').val(yestoday);
			this.$el.find('[name=endTime]').val(today);
			// 还原初始状态
			/*this.$person.html( this.cache.person );
			this.$container.html( this.cache.result );*/
		},
		/**
		 * 销毁
		 * @return {[type]} [description]
		 */
		destory: function() {
			var self = this;
			$('#vid-frame-container').remove();
			if ( self.videoControlIns ) {
				self.videoControlIns = null;
			}
		},
		/**
		 * 隐藏
		 * @return {[type]} [description]
		 */
		rightHide: function() {
			this.$floor.hide( 300 );
		}
	});

	activityLocus.model = model;
	activityLocus.collection = collection;
	// activityLocus.view = view;
	activityLocus.history = history;

	return activityLocus;
})

