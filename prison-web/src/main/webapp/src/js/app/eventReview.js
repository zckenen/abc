// 历史事件回顾
/* eventReview */
define(['global', 'activityLocus', 'createPerson', 'videoControl'], function(Global, ActivityLocus, CreatePerson, VideoControl){
	var eventReview = {};
	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id'
	});

	// 数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data'
	}))();


	var // 是否已经加载过一次
		_isRefresh = false,
		// 渲染是否准备好
		_isReady = false,
		// 图片是否缓存
		_imageCache = {},
		// 当前图片
		_image,
		// 地图实际的宽高
		_realWidth, _realHeight,
		// 地图偏移量
		_left, _top,
		// 区域缓存
		_locsCache = {},
		// 地图svg
		_svgMap,
		// 实际地图图片
		_imgMap,
		// 区域容器
		_gLoc,
		// svg标准
		_svgNS = 'http://www.w3.org/2000/svg',
		// 地图位移值
		_transX = _transY = 0,
		// 地图缩放比例
		_scale = 1;

	var view = Backbone.View.extend({
		el: '#eventReview',
		events: {
			// 报警人物的详细
			'click.detail [data-event=detail]': 'detail',
			// 显示与报警
			'click.show [data-event=show]': 'show',
			// 区域列表中的人
			'click.list [data-event=list]': 'list',
			// 人员详细信息
			'click.info [data-event=info]': 'info',
			// 关闭人物详细
			'click.closed [data-event=closed]': 'closed',
			'click.close [data-event=close]': 'close',
			// 人物详情下拉
			'click.slide [data-event=slide]': 'slide',
			// 视频回放
			'click [data-event=playback]': 'playback',
			// 退回
			'click [data-event=goBack]': 'goBack'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 主容器
			this.$container = this.$el.find('>div');
			// 头部容器以及模板
			this.$head = this.$el.find('#head');
			// this.personTpl = _.template( $('#eventPersonTpl').html() );
			// 报警信息容器与模板
			this.$info = this.$el.find('#info');
			// 区域人物列表
			this.$detailList = this.$el.find('#detailList');
			// this.personListTpl = _.template( $('#eventPersonListTpl').html() );
			// 人物详细容器与模板
			this.$detail = this.$el.find('#detail');
			this.detailTpl = _.template( $('#personnelInfoTpl').html() );
			this.$infoDetail = this.$el.find('#infoDetail');
			// this.infoDetail = _.template( $('#personnelDetailTpl').html() );
			// 计算模板容器
			this.$mapContainer = this.$el.find('#map-container');
			_realWidth = $(window).width() - 75;
			_realHeight = $(window).height() - 106;
			this.$mapContainer.css({
				width: _realWidth,
				height: _realHeight
			})
			// svg 地图
			_svgMap = document.getElementById('eventMap');
			// 设置svg宽高
			$(_svgMap).css({
				position: 'absolute',
				zIndex: 1000
			}).attr({
				width: _realWidth,
				height: _realHeight
			})
			// 所有的摄像头数据
			this.cameras = {};
		},
		/**
		 * 回退
		 */
		goBack: function() {
			window.history.go(-1);
		},
		/**
		 * 区域人物中的列表
		 * @return {[type]} [description]
		 */
		list: function( event ) {
			var self = this,
				$con = $(event.currentTarget),
				// 获取楼层与区域id
				locId = $con.attr('data-id'),
				// 人员列表
				content;
			// 获取区域中的人员
			var loc = self.picture.locareas.filter(function(loc){
				return loc.id === locId;
			})[ 0 ];
			//console.log('报警数据ss',loc,self.picture.locareas);
			// 判断是否有人员
			if ( loc.peoList && loc.peoList.length > 0 ) {
				content = template('eventPersonListTpl', loc);
				
				self.$detailList.css({
					left: loc.locMainx * _scale,
					top: loc.locMainy * _scale,
				}).html( content ).removeClass('leave').addClass('enter show');
				self.$detailList.draggable({
	                  handle: ".layer-header"
	            });
			} else {
				UI.alert({ message: Global.lang.m22, type: 'info'});
			}
		},
		/**
		 * 人物详细
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		info: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id'),
				// 列表的left与bottom值
				left = parseFloat( self.$detailList.css('left') ),
				bottom = parseFloat( self.$detailList.css('bottom') ),
				// 详细的left与bottom
				lt, bt;
			// 获取数据
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				data: {id: id},
				dataType: 'json',
				type: 'post'
			},{
				url: Global.path + '/main/selEventByPeoId.do',
				dataType: 'json',
				type: 'post',
				data: { id: id }
			}).done(function(d1, d2){
				// 设置type
				var data = d1[0].data;
				data.type = false;
				// 处理数据
				data.cri.criBrithday = (new Date( data.cri.criBrithday )).Format('yyyy-MM-dd');
				data.cri.criMonitoringtime = (new Date( data.cri.criMonitoringtime )).Format('yyyy-MM-dd');
				
				self.$detail.html( template( 'personnelInfoTpl', data ) )
							.css({ 
								left: (left > 1200 ? 1200 : left) + 'px',
								top: top + 'px'
							}).show();
				self.$detail.draggable({
	                handle: ".bubble-header"
	            });
				// 设置处遇信息与详情信息
				self.criEvents = d2[0].data[0];
			});
			return false;
		},
		/**
		 * [slide description]
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		slide: function( event ){
			// 渲染
			this.$infoDetail.find('.layer-body').html( template( 'personnelDetailTpl', this.criEvents) );
			this.$infoDetail.addClass('enter show');
			// 设置位置
			this.$infoDetail.css({
				left: this.$detail.css('left'),
				bottom: parseInt( this.$detail.css('bottom') ) - 220
			});
		},
		/**
		 * 关闭人物详细
		 * @return {undefined} 无返回
		 */
		closed: function() {
			this.$detailList.hide();
			this.$detail.hide();
			this.$infoDetail.removeClass('enter show');
		},
		/**
		 * 关闭人物详细
		 * @return {[type]} [description]
		 */
		close: function() {
			this.$detail.hide();
			this.$infoDetail.removeClass('enter show');
		},
		/**
		 * 显示报警
		 * @return {[type]} [description]
		 */
		show: function() {
			this.$info.addClass('enter show');
			return false;
		},
		/**
		 * 渲染地图容器等信息
		 * @return {undefined} 无返回
		 */
		render: function() {
			var self = this,
				// 数据
				model = collection.get( view.ins.id ).toJSON(),
				// 罪犯报警区域相关信息
				picture, locs;
			// 渲染头部信息
			self.$head.html( template('eventReviewHeaderTpl', model) );
			// 处理数据
			model.coo&&model.coo.pictures.forEach(function(pic){
				if ( pic.locareas ) {
					locs = pic.locareas.filter(function(loc){
						if ( loc.id === model.locId ) {
							picture = pic;
							return true;
						}
					});
				}
			});
			// 设置楼层与区域
			self.picture = picture;
			model.loc = locs[0];
			// 遍历筛选人员
			var peos = model.loc.peoList.filter(function(peo){
				return peo.wat.watNum === model.watNum;
			});
			model.warPeo = peos;
			// 报警信息弹出框列表
			self.$info.html( template( 'eventInfoTpl', model ) );
			// 清空地图内容
			$(_svgMap).find('image').remove();
			$(_svgMap).find('g').remove();
			// 渲染地图
			var render = function() {
				// 地图的偏移量
				_left = (_realWidth - _image.width) / 2;
				_top = (_realHeight - _image.height) / 2;
				// 创建地图
				_svgMap.setAttribute('viewBox', '0, 0,'+ _image.width +',' + _image.height);
				// 计算比例
				//_scale = _realHeight / _image.height;
				if(_realHeight > _image.height){
					//console.log(_realWidth,_realHeight, _image.width,_image.height,_scale);
					_scale = _realWidth / _image.width;
					console.log('width:',_scale);
					
				}else{
					//console.log(_realWidth-_image.width);	
					_scale = _realHeight / _image.height;
					console.log('height:',_scale);
				}
				//_scaleX = _realWidth / _image.width;
				//_scaleY = _realHeight / _image.height;
				// 创建地图图片
				_imgMap = document.createElementNS(_svgNS, 'image');
				$(_imgMap).attr({
					'xlink:href':  Global.path + picture.picPath,
					'width': _image.width,
					'height': _image.height,
					'data-ref': 'svg'
				});
				// 解决火狐下svg图片无法显示
				_imgMap.href.baseVal = Global.path + picture.picPath;
				// 插入
				_svgMap.appendChild( _imgMap );
				// 创建区域父容器
				_gLoc = document.createElementNS(_svgNS, 'g');
				// 插入地图中
				_svgMap.appendChild( _gLoc );
				// 创建区域
				picture.locareas.forEach(function(loc, i){
					// 区域坐标计算
					loc.ltx = loc.locMainx - loc.locSizex / 2;
					loc.lty = loc.locMainy - loc.locSizey / 2;
					loc.rbx = loc.locMainx + loc.locSizex / 2;
					loc.rby = loc.locMainy + loc.locSizey / 2;
					// 创建svg元素
					var g = document.createElementNS(_svgNS, 'g');
					// 设置属性
					$(g).attr({
						'data-event': 'list',
						'data-picid': picture.id,
						'data-id': loc.id,
						'class': 'g-region',
						'y': _top,
						'data-ref': 'svg'
					});
					// 创建区域形状容器
					var locSvg = document.createElementNS(_svgNS, 'rect');
					// 创建区域
					$(locSvg).attr({
						id: 'event-floor-' + loc.id,
						'data-id': loc.id,
						'class': 'region',
						'x': loc.ltx,
						'y': loc.lty,
						'width': loc.locSizex,
						'height': loc.locSizey,
						'data-ref': 'svg'
					});
					// 插入g元素中
					g.appendChild( locSvg );
					// 区域插入svg文档
					_gLoc.appendChild( g );
					// 创建区域中的人员
					self.createPeople( g, loc );
					// 创建摄像头
					self.createCamera(g, loc);
				});
				// 创建报警人员
				self.createWarPeople( model.loc, model.warPeo );
			};
			// 判断图片是否已经加载过
			_image = _imageCache[ picture.id ];
			if( !_image ) {
				_image = _imageCache[ picture.id ] = new Image();
				_image.onload = function() {
					render();
				}
				_image.src = Global.path + picture.picPath;
			} else {
				render();
			}
			// 关闭进度
			progress.end();
			// 自动播放视频
			self.playAuto( model );
		},
		/**
		 * 创建人员
		 * @param  {Object} locSvg 区域节点
		 * @param  {Object} loc 区域信息 LIST
		 * @return undefined
		 */
		createPeople: function(locSvg, loc) {
			var test = new Date().getTime();
			//console.log(test)
			if ( loc.peoList ) {
				var	// 计算区域容纳能力
					len = loc.peoList.length,
					// 区域面基
					measure = (loc.locSizex - 20) * (loc.locSizey - 20),
					// 计算单个人物所占的面积
					size = Math.ceil( measure / len ),
					// 开平方计算单个人物的长宽(iconfont的字体大小)
					font = Math.round( Math.sqrt( size ) ),
					// 循环中折行了多少次
					n = 0,
					// 取余结果
					remainder;
					// 字体大小控制
					font > 24 ? font = 24 : '';
					font < 12 ? font = 12 : '';
						// 计算每行能放下多少人,多少人需要进行换行
					var	rowNum = Math.round( (loc.locSizex - 10) / font );
				loc.peoList.forEach(function(peo, i){
					if ( peo ) {
						var peoSvg = document.createElementNS(_svgNS, 'text'),
							className;
						// 判断类型
						if ( peo.peoType === '1' ) {
							className = 'iconfont color-green person';
						} else if ( peo.peoType === '2' ) {
							className = 'iconfont color-red person';
						} else if ( peo.peoType === '3' ) {
							className = 'iconfont color-blue person';
						}
						// 设置属性id
						$(peoSvg).attr({
							id: 'event-person-' + peo.id,
							'class': className,
							'data-id': peo.id,
							'data-ref': 'svg'
						}).html( '&#xe6ba;' );
						// 设置字体
						peoSvg.style.fontSize = font + 'px';
						// 取余
						remainder = i % rowNum;
						// 如果刚好是0进行折行
						remainder === 0 ? n++ : '';
						// 设置人物的位置
						peoSvg.setAttribute('x', loc.ltx + 5 + remainder * font);
						peoSvg.setAttribute('y', loc.lty + 5 + n * font);
						// 人员插入文档
						locSvg.appendChild( peoSvg );	
						
					}
				});
			}
			//console.log((test - new Date().getTime()) / 1000);
		},
		/**
		 * 创建报警人员
		 * @param  {Object} warLoc 报警区域
		 * @param {Object} warPeo 报警人员
		 * @return {[type]}     [description]
		 */
		createWarPeople: function( warLoc, warPeo ) {
			var self = this;
			// 移除所有报警点
			self.$el.find('.war-person').remove();
			// 遍历插入报警点
			var test = new Date().getTime();
			warPeo.forEach(function(peo, i){
				// 插入报警点
				self.$mapContainer.append( template('eventPersonTpl', peo) );
				// 获取报警人员
				var scaleImageWidth = _realHeight > _image.height ?  _realWidth : _realHeight / _image.height * _image.width;
				var scaleImageHeight = _realHeight > _image.height ?  _top : 0;
				console.log(_realWidth,_realHeight, _image.width,_image.height,_scale,scaleImageWidth);
				var $a = self.$el.find('#war-person-' + peo.id ).css({
					position: 'absolute',
				/*	left: warLoc.locMainx * _scale - (_realWidth - scaleImageWidth)/2,
					top: warLoc.locMainy * _scale - ( _realHeight - scaleImageHeight )/2 - 40,*/
					left: warLoc.locMainx * _scale + (_realWidth - scaleImageWidth -75)/2,
					top: warLoc.locMainy * _scale + scaleImageHeight  - 40,
					zIndex: 5000
				}).addClass('war-person')
				  .find('img')
				  .attr('src', self.criPicpath);
				// 提示人员
				UI.tooltips($a);
			});
		},
		/**
		 * 处理摄像头显示
		 * @param {Object} locSvg区域DOM元素
		 * @param {Object} loc 区域数据
		 * @return {[type]} [description]
		 */
		createCamera: function( locSvg, loc ) {
			var	self = this,
				// 获取区域右上角点位
				reLeft = loc.ltx, 
				reTop = loc.lty;
			// 遍历计算
			loc.camera && loc.camera.forEach(function(camera, i){
				left = camera.camMainx - reLeft;
				top = camera.camMainy - reTop;
				// 插入区域中
				var camSvg = document.createElementNS(_svgNS, 'text');
				// 设置属性
				$(camSvg).attr({
					'data-event': 'playback',
					'data-id': camera.id,
					'title': camera.camName,
					'class': 'video iconfont',
					'x': camera.camMainx,
					'y': camera.camMainy * 1 + 10,
					'data-ref': 'svg'
				}).html( '&#xe633;' );
				// 将摄像头插入svg中
				locSvg.appendChild( camSvg );
				// 数据插入集合
				self.cameras[ camera.id ] = camera;
			});
		},
		/**
		 * 初始化播放容器
		 * @return {[type]} [description]
		 */
		initPlayBox: function() {
			this.$video = this.$el.find('[data-view=video]');
			this.DOMid = 'vid-frame-container' ;
			// 计算播放窗口的高度
			var height = 200;
			// 设置video
			this.$video.css({
				height: (height + 60) + 'px'
			});
			// 创建播放容器
			var $frame = $('<div>');
			// 设置容器
			$frame.appendTo( this.$video )
				  .addClass('video-body')
				  .attr({
				  	id: this.DOMid
				  })
				  .css({
				    height: height+ + 'px'
				  });
		},
		/**
		 * [自动播放视频插件]
		 * @param {object}  model 数据模型
		 * @return {[type]} [description]
		 */
		playAuto: function( model ) {
			var self = this,
				warTimeStamp = new Date( model.warTime ).getTime(),
				startTime = new Date( warTimeStamp - 10000 ).Format("yyyy-MM-dd hh:mm:ss"),
				endTime = new Date( warTimeStamp + 1000000 ).Format("yyyy-MM-dd hh:mm:ss"),
				loc = model.loc;
//			// 显示播放容器
//			self.$video.show().parent().show();
//			// 开始时间与结束时间
			self.startTime = startTime;
			self.endTime = endTime;

//			if ( loc.camera && loc.camera.length === 0 ) {
//				UI.alert({ message: Global.lang.m26, type: 'warning'});
//				return;
//			}
//			if ( !self.videoControlIns ) {
//				self.videoControlIns = VideoControl.init( self.DOMid );
//			}
//			self.videoControlIns.playlive( loc.camera, 2, startTime, endTime );
		},
		/**
		 * 视频回放
		 * @return {[type]} [description]
		 */
		playback: function( event ) {
			var self = this,
				// id
				id = event.currentTarget.getAttribute('data-id'),
				// 摄像头
				camera = self.cameras[ id ];
		
			// 播放实例化
			if ( !self.videoControlIns ) {
				self.videoControlIns = VideoControl.init( self.DOMid );
			}
			
			if (self.videoControlIns.status) {
				//显示视频窗口
				self.$video.show().parent().show();
				self.videoControlIns.playlive( [camera], 2, self.startTime, self.endTime );
			} else {
				var html = '<div>';
				html += '<p>您的浏览器版本过低或视频控件未安装，为了保证正常使用，请 ';
				html += '<a id="compoentDownload" href="'+ Global.path +'/upload/firefox.rar">点击下载控件</a></p>'
				html += '</div>';
				UI.alert({ message: html, type: 'warning', close: false});
			}
			

			return false;
		},
		/**
		 * 销毁回收各变量
		 * @return {[type]} [description]
		 */
		destory: function() {
			$('#vid-frame-container').remove();
			this.videoControlIns ? this.videoControlIns = null : '';
		}
	});

	var init = function( id ) {
		!view.ins ? view.ins = new view(): false;
		// 报警数据id
		view.ins.id = id;
		// 获取数据
		// 开启进度
		progress.start('L');
		// 获取数据
		collection.url = Global.path + '/rule/warSimpleResult/getWarSimpleResultById';
		collection.fetch({
			data: {id: id},
			type: 'post',
			success: function(collection, data, xhr) {
				// 获取人物详细
				$.http({
					url: Global.path + '/main/loadInfoByCondition.do',
					type: 'post',
					dataType: 'json',
					data: {watNum: data.data.watNum}
				}).done(function(data){
					view.ins.criPicpath = data.data.cri.criPicpath;
					// 执行渲染
					view.ins.render();
				});
			}
		});
		view.ins.destory();
		view.ins.initPlayBox();
		// 关闭列表弹窗
		$('#topView').find('.layer').removeClass('show enter');
		$('#topViewLeft').find('.layer').removeClass('show enter');
	};

	eventReview.model 		= model;
	eventReview.collection 	= collection;
	eventReview.view 		= view;
	eventReview.init 		= init;

	return eventReview;
});