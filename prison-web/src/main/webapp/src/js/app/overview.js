/* 首页全局视图 */
define([
	'global', 
	'areaMap', 
	'fullTextSearch', 
	'activityLocus',
	'areaFlat',
	'criminalManagement',
	'wave',
	'mainLoop',
	'areaLinkpage',
	'tripleNumberLink'
], function(
	Global, 
	AreaMap, 
	FullTextSearch,
	ActivityLocus,
	AreaFlat,
	CriminalManagement,
	Wave,
	MainLoop,
	AreaLinkpage,
	TripleNumberLink
){

	var tests = [
           
			{
                "count": {
                    "allCount": 285,
                    "importantCount": 77,
                    "count": 277,
                    "generalCount": 200,
                    "generalAllCount": 200,
                    "importantAllCount": 77
                },
                "pco_name": "一监区",
                "pco_no": "1"
            },
			{
                "count": {
                    "allCount": 248,
                    "importantCount": 44,
                    "count": 244,
                    "generalCount": 200,
                    "generalAllCount": 200,
                    "importantAllCount": 44
                },
                "pco_name": "二监区",
                "pco_no": "1"
            },
			{
                "count": {
                    "allCount": 241,
                    "importantCount": 35,
                    "count": 235,
                    "generalCount": 200,
                    "generalAllCount": 200,
                    "importantAllCount": 35
                },
                "pco_name": "三监区",
                "pco_no": "1"
            },
			{
                "count": {
                    "allCount": 240,
                    "importantCount": 40,
                    "count": 238,
                    "generalCount": 198,
                    "generalAllCount": 198,
                    "importantAllCount": 40
                },
                "pco_name": "四监区",
                "pco_no": "1"
            },
			 {
                "count": {
                    "allCount": 98,
                    "importantCount": 8,
                    "count": 98,
                    "generalCount": 90,
                    "generalAllCount": 90,
                    "importantAllCount": 8
                },
                "pco_name": "五监区",
                "pco_no": "1"
            },
			{
                "count": {
                    "allCount": 288,
                    "importantCount": 86,
                    "count": 286,
                    "generalCount": 200,
                    "generalAllCount": 200,
                    "importantAllCount": 86
                },
                "pco_name": "六监区",
                "pco_no": "1"
            },
			{
                "count": {
                    "allCount": 197,
                    "importantCount": 36,
                    "count": 196,
                    "generalCount": 160,
                    "generalAllCount": 160,
                    "importantAllCount": 36
                },
                "pco_name": "七监区",
                "pco_no": "1"
            }
        ]

	var overview = { },
		// 是否刷新
		_isRefresh = false,
		// 是否加载完毕
		isLoad = false,
		// 图片原始大小与画布之间的差距
		_orgDifX, _orgDifY,
		// 鼠标当前相对右上角的位置
		_cenX, _cenY,
		// 鼠标落下初始位置
		_intX, _intY,
		// 鼠标移动了距离
		_disX, _disY,
		// 图片是否加载
		isMapLoad = false,
		// 地图实例化
		_image = new Image(),
		//canvas地图
		_canvas = document.createElement('canvas'),
		// 地图上的元素点位
		_canvasElement = document.createElement('canvas'),
		// 车辆轨迹canvas
		_canvasCar = document.createElement('canvas'),
		// canvas上下文
		_context = _canvas.getContext('2d'),
		_contextElement = _canvasElement.getContext('2d'),
		_contextCar = _canvasCar.getContext('2d'),
		// canvas与图片的差值
		_difX, _difY,
		// 图片点位数据缓存是否缓存过
		_isCache = false,
		// 水滴动画计数器,水滴动画是否循环过一轮
		_count = 0, _ifLoop = true,
		// 车辆报警图片
		_imageCar = new Image(),
		// 报警数据
		_warCache = [],
		// 报警数据缓存
		_carPosCache = {
			'1': {
				pos: [{"x":1216,"y":844},{"x":1213,"y":842},{"x":1211,"y":842},{"x":1209,"y":842},{"x":1201,"y":843},{"x":1189,"y":843},{"x":1179,"y":844},{"x":1170,"y":843},{"x":1168,"y":842},{"x":1158,"y":842},{"x":1158,"y":824},{"x":1158,"y":810},{"x":1154,"y":799},{"x":1154,"y":790},{"x":1154,"y":781},{"x":1154,"y":770},{"x":1154,"y":764},{"x":1155,"y":754},{"x":1155,"y":747},{"x":1155,"y":731},{"x":1152,"y":719},{"x":1143,"y":712},{"x":1133,"y":713},{"x":1121,"y":713},{"x":1110,"y":714},{"x":1103,"y":711},{"x":1091,"y":711},{"x":1076,"y":712},{"x":1062,"y":712},{"x":1047,"y":714},{"x":1032,"y":712},{"x":1013,"y":712},{"x":1005,"y":712},{"x":988,"y":712},{"x":982,"y":717},{"x":978,"y":719},{"x":975,"y":733},{"x":974,"y":742},{"x":975,"y":753},{"x":982,"y":760},{"x":979,"y":764},{"x":973,"y":776},{"x":979,"y":781},{"x":977,"y":773}]
			}
		},
		_carDisCache = [],
		_carIdcache = [],
		// 上一次人车的距离
		lastDis = null,
		// 报警是否已经加载过
		_isWarLoad = false;
		// 建筑物id缓存
		_cooIdCache = [],
		// 建筑物对象缓存
		_cooStoreCache = {},
		// 是否是夜间模式
		_isNightMode = false;
	// 临时计数器
	var _e = 0;
	// 建立首页推送
	try {
		var _wsIndex = $.websocket('ws://'+ Global.host + Global.path +'/allLoccoorCount.do');
	} catch(e) {
		window.location.reload();
	}
	
	// 首页与楼层楼层推送
	var _indexOptions =  {	
		name: 'main',
		param: JSON.stringify( { method: 'main' } ),
		func: _wsIndex.send,
		times: 3000,
		context: _wsIndex
	};
	// 建立车辆与报警推送
	var _wsCarWar = $.websocket('ws://'+ Global.host + Global.path +'/vheicleState.do');
	// 车辆与报警推送
	var _carWarOptions = {
		name: 'carWar',
		param: JSON.stringify( { method: 'car' } ),
		func: _wsCarWar.send,
		times: 1000,
		context: _wsCarWar
	};
	// 缓存人员数据
	var _statisticsData = {};
	// 全局中央地图视图
	var centralView = Backbone.View.extend({
		el: '#overview',
		events: {
			// 查看罪犯
			'click.criminalView [data-event=criminalView]': 'criminalView',
			// 定位建筑
			'click.position [data-event=position]': 'position',
			// 打开历史搜索
			'click.appear [data-event=appear]': 'appear',
			// 打开重犯查看
			'click [data-event=vipCheck]': 'vipCheck',
			// 移动地图
			'mousedown [data-event=map]': 'mapHandle',
			// 释放移动地图
			'mouseup [data-event=map]': 'mapHandle',
			// 鼠标滚轮移动地图
			'mousewheel [data-event=map]': 'mapHandle',
			// 鼠标点击选定区域
			'click [data-event=map]': 'mapHandle',
			// 每层详细
			'mouseenter [data-event=countFloor]': 'countFloor',
			// 总共数据统计
			'mouseleave [data-event=countAll]': 'countAll',
			// 双击进入
			'dblclick [data-event=show]': 'enterFloor' ,
			'mousedown [data-event=unmove]': 'unmove',
		},
		initialize: function() {
			this.handleUserAgent();

			var self = this;
			// 地图总览视图
			self.$el = $(this.el);
			// 地图图片所在容器
			self.$map = this.$el.find('#overviewBox');
			// 实例化头部通知视图
			noticeView.ins = new noticeView;
			// 实例化头部报警
			topWarView.ins = new topWarView;
			// 实例化右侧信息视图
			rigthView.ins = new rigthView;
			// 实例化报表统计
			chartView.ins = new chartView;
			// 实例化左侧历史轨迹
			ActivityLocus.history.ins = new ActivityLocus.history;
			// 楼层的socket推送
			AreaFlat._wsIndex = _wsIndex;
			// 添加监听
			Layout.addResizeHandler( self.mapHandle, self );
		},
		/**
		 * 判断用户代理是否正确
		 * @return {[type]} [description]
		 */
		handleUserAgent: function() {
			var agent = navigator.userAgent.toLowerCase();
			var bool = false;
			if (agent.indexOf('firefox') > -1) {
				var ver = parseInt(agent.match(/rv\:([\d.]+)/)[1]);
				if (ver > 54) {
					bool = true;
				}

				var status = WebVideoCtrl.I_CheckPluginInstall();
				// 初始化视频窗口
				if ( status == -1 || status == -2 ) {
					bool = true;
				}
			} else { 
				bool = true;
			};
			if (bool) {
				var html = '<div>';
					html += '<p>您的浏览器版本过低或视频控件未安装，为了保证正常使用，请 ';
					html += '<a id="compoentDownload" href="'+ Global.path +'/upload/firefox.rar">点击下载控件</a></p>'
					html += '</div>';
				UI.alert({ message: html, type: 'warning', close: false});

				$('#compoentDownload').on('click', function(e){
					$(this).closest('.layer').remove();
				});
			}
		},
		/**
		 * 计算地图容器大小
		 * @return {[type]} [description]
		 */
		mapCalculate: function() {
			var self = this,
				winHeight = $(window).height(),
				winWidth = $(window).width(),
				// 容器以及canvas的大小
				width = winWidth - 70,
				height = winHeight - 75 ;
			self.$el.css({
				width: width,
				height: height
			});
			// 设置地图容器大小
			self.$map.css({
				width: width,
				height: height
			})
			// 获取图片的实际大小
			var realWidth = _image.width,
				realHeight = _image.height;
			_difX = (width - realWidth) / 2;
			_difY = (height - realHeight) / 2;
			_orgDifX = width - realWidth ;
			_orgDifY = height - realHeight; 
			// 设置地图canvas大小以及样式
			_canvas.style.position = 'absolute';
			_canvas.style.left = _difX + 'px';
			_canvas.style.top = _difY + 'px';
			_canvas.width = _image.width;
			_canvas.height = _image.height;
			self.$map.append( _canvas );
			_canvasElement.width = width;
			_canvasElement.height = height;
			_canvasElement.style.position = 'absolute';
			self.$map.append( _canvasElement );
			_canvasCar.style.position = 'absolute';
			_canvasCar.width = width;
			_canvasCar.height = height;
			self.$map.append( _canvasCar );
			// 将图片写入canvas中
			_context.drawImage(_image, 0, 0 );
		},
		/**
		 * websocket 实时推送数据
		 * @return {undefined} 无返回
		 */
		monitorStart: function() {
			var self = this;
			if ( isMapLoad ) { // 图片已加载
				// 监听首页与楼层
				MainLoop.set( _indexOptions );

				// 监听楼层
				_wsIndex.onmessage = function() {
					self.response.apply(self, arguments);
				};
				// 监听水滴变化
				setTimeout(function(){
					MainLoop.set({
						name: 'water',
						context: self,
						func: self.createWater,
						times: 100,
					});
				}, 2000);
			} else { // 图片未加载过
				$.http({
					url: Global.path + '/picture/loadIndexPicture.do',
					dataType: 'json',
					type: 'post'
				}).done(function(data){
					var path = data.data.data.list[0].picPath;
					// 地图全局变量设置
					window.MAP_URI = Global.path + path;
					// 历史轨迹缩略图
					$('#overview-thumb').attr('src', window.MAP_URI);
					// 监听地图加载完毕
					_image.onload = function() {
						// 计算地图大小
						self.mapCalculate();
						// 监听首页与楼层
						MainLoop.set( _indexOptions );
						// 监听首页
						_wsIndex.onmessage = function() {
							self.response.apply(self, arguments);
						};
						// 先发送一次
						// _wsIndex.send( _indexOptions.param );
						// 监听车辆与报警
						// 3秒后在监听车辆
						setTimeout(function(){
							MainLoop.set( _carWarOptions );
							_wsCarWar.onmessage = function() {
								self.carWarResponse.apply(self, arguments);
							}
						}, 5000);
						// 监听水滴变化
						MainLoop.set({
							name: 'water',
							context: self,
							func: self.createWater,
							times: 100,
						});
						// 地图已加载
						isMapLoad = true;
					}
					_image.src = window.MAP_URI;
				});
				// 车载图片加载
				_imageCar.src = Global.path + '/src/img/car.png';
			}

			// 刷新头部通知视图
			noticeView.ins.render();
		},
		destory: function() {
			MainLoop.unset('main', 'water');
			ActivityLocus.history.ins.destory();			
			// wscar.close();
			// wscar = null;
		},
		/**
		 * 响应websocket广播
		 * @param {String} responese 响应的JSON字符串数据
		 * @return {[type]} [description]
		 */
		response: function( response ) {
	  		var self = this;
	  		var resJson =
	  		response && (self.data = JSON.parse(response.data));
	  		// 每层人数数据
	  		self.pictures = {};
	  		// 头部数据统计
	  		self.statistics();
	  		// 地图上每幢建筑的人数统计以及显示
	  		self.distributed();
	  		// 水滴动画
//	  		self.createWater();
	  		// 组织建构处理
	  		rigthView.ins.renderCoos( self.data.data );
	  		// 报表民警配比
	  		chartView.ins.handleScale( false, self.data.data );
	  		// 是否是夜间模式
	  		self.isNight();
		},
		isNight: function() {
			var bool = this.data.nightMode;
			if( bool !== _isNightMode) {
				 if (bool === '0') {
				 	$('#nightMode').removeClass('night');
				 } else {
				 	$('#nightMode').addClass('night');
				 }
				 this.data.nightMode = _isNightMode;
			}
		},
		/**
		 * 地图头部相关人员总计数目显示
		 * @return {undefined} 无返回
		 */
		statistics: function( data ) {
			
			var $view = $('#overview-statistics'),
				data = this.data.codes;
			// 只有变化过才重新渲染
			if (_statisticsData.total !== data.total) {
				_statisticsData.total = data.total;
				$view.find('[data-value=total]').html( data.total );
			}
			if (_statisticsData.important !== data.important) {
				_statisticsData.important = data.important;
				$view.find('[data-value=important]').html( data.important );
			}
			if (_statisticsData.general !== data.general) {
				_statisticsData.general = data.general;
				$view.find('[data-value=general]').html( data.general );
			}
			if (_statisticsData.important !== data.important) {
				_statisticsData.important = data.important;
				$view.find('[data-value=important]').html( data.important );
			}
			if (_statisticsData.police !== data.police) {
				_statisticsData.police = data.police;
				$view.find('[data-value=police]').html( data.police );
			}
			/*if (_statisticsData.other !== data.other) {
				_statisticsData.other = data.other;
				$view.find('[data-value=other]').html( data.other );
			}
			if (_statisticsData.lost !== data.lost || _statisticsData.locBreak !== data.locBreak) {
				_statisticsData.lost = data.lost;
				_statisticsData.locBreak = data.locBreak;
				$view.find('[data-value=offline]').html( data.lost + data.locBreak );
			}*/
			if (_statisticsData.lost !== data.lost || _statisticsData.locBreak !== data.locBreak || _statisticsData.other !== data.other) {
				_statisticsData.lost = data.lost;
				_statisticsData.locBreak = data.locBreak;
				_statisticsData.other = data.other;
				$view.find('[data-value=publicData]').html( data.lost + data.locBreak +data.other );
			}
		},
		/**
		 * 水滴波浪特效
		 * @return {[type]} [description]
		 */
		createWater: function() {
			if ( !this.data ) return;

			var self = this,
				// 建筑数据
				data = this.data.data,
				// 水滴的宽与高
				w = 26, h = 60;
			// 计算动态值
			_count === 0 ? _ifLoop = true : '';
			var dynA = _count - 10,
				dynB = 10 - _count;
			// 清除画布
			_contextElement.clearRect(0, 0, _canvasElement.width, _canvasElement.height);
			// 遍历建筑数据
			data.forEach(function(item, i){
				// 判断是否有楼层,无楼层则跳过渲染
				if (item.pictures.length === 0) return;
				// 计算出水滴的左上角与右下角坐标
				var cx = item.cex = item.cooMainx + _difX,
					cy = item.cey = item.cooMainy + _difY,
					x = item.lfx = item.cex - w / 2,
					y = item.lfy = item.cey - h / 2;
				item.rbx = item.cex + w / 2;
				item.rby = item.cey + h / 2;
				// 水滴正方形边框颜色
				_contextElement.strokeStyle = 'rgba(255, 255, 255, 0)';
				// 创建水滴正方形
				_contextElement.strokeRect(x, y, w, h);
				// 保存
				_contextElement.save();
				// 创建底座椭圆盘
				_contextElement.fillStyle = 'rgba(175, 170, 158, .7)';
				// 椭圆的长轴长与短轴长以及半径
				var a = 12, b = 3, r = 12,
					// 起点x,y
					sx = cx, sy = cy + 24,
					// 圆心
					ratioX = a / r,
					ratioY = b / r;
				// 设置缩放比例
				_contextElement.scale(ratioX, ratioY);
				// 开始绘制
				_contextElement.beginPath();
				_contextElement.arc( sx / ratioX, sy / ratioY, r, 0, Math.PI * 2, false );
				_contextElement.fill();
				_contextElement.closePath();
				_contextElement.restore();
				// 绘制向上的水点
				if ( _ifLoop && dynB > 0 ) {
					var opacity = dynB / 10;
					_contextElement.fillStyle = 'rgba(153, 212, 244, '+ opacity +')';
					_contextElement.beginPath();
					_contextElement.arc(cx, cy - 8 + dynB, 2, Math.PI * 2, 0);
					_contextElement.fill();
					_contextElement.beginPath();
					_contextElement.arc(cx, cy - 16 + dynB, 2, Math.PI * 2, 0);
					_contextElement.fill();
					_contextElement.beginPath();
					_contextElement.arc(cx, cy - 24 + dynB, 2, Math.PI * 2, 0);
					_contextElement.fill();
				}
				
				// 绘制水滴轮廓
				// 颜色填充值
				_contextElement.strokeStyle = '#1163dd';
				// 开始画轮廓
				_contextElement.beginPath();
				var satrtAngle = Math.PI * .9,
					endAngle = Math.PI * .1,
					cr = 12;
				_contextElement.arc(cx, cy, cr, satrtAngle, endAngle);
				var	dx = Math.cos(18 * Math.PI / 180) * cr,
					dy = Math.sin(18 * Math.PI / 180) * cr;
				_contextElement.lineTo( cx, cy + dy + 20 );
				_contextElement.lineTo( cx - dx, cy + dy );
				_contextElement.stroke();
				_contextElement.closePath();
				// 绘制水滴波浪
				var grd  = _contextElement.createRadialGradient(cx, cy + 5, 0, cx, cy + 5, 40); // 创建径向渐变
				// 添加渐变范围
				grd.addColorStop(0, '#122eff');
				grd.addColorStop(1, 'rgb(51, 133, 255)');
				_contextElement.fillStyle = grd;
				// 绘制水滴波浪
				var bezfx = cx - dx, // 二次贝塞尔曲线控制点1
					bezfy = cy + dy + dynA,
					bezsx = cx - dx + 16, // 二次贝塞尔曲线控制点2
					bessy = cy + dy + dynB,
					bezEndx = cx + dx, // 二次贝塞尔曲线终点
					bezEndy = cy + dy;
				// 开始画波浪
				_contextElement.beginPath();
				_contextElement.moveTo(cx - dx, cy + dy);
				_contextElement.bezierCurveTo( bezfx, bezfy, bezsx, bessy, bezEndx, bezEndy )
				_contextElement.lineTo(cx - dx + cr, cy + dy + 20);
				_contextElement.lineTo(cx - dx, cy + dy);
				_contextElement.fill();
				_contextElement.stroke();
				_contextElement.closePath();
			});
			// 没循环一次就改变增减
			_ifLoop ? ++_count : --_count;
			_count === 20 ? _ifLoop = false : '';
		},
		/**
		 * 建筑物在地上的分布详情
		 * @return {undefined} 无返回
		 */
		distributed: function() {
			if (!this.data) return;
			var self = this,
				// 建筑数据
				data = this.data.data,
				// 元素前缀
				prefix = 'overview-building',
				// 建筑容器
				$building;
			// 遍历
			data.forEach(function(item, i){
				// 判断是否有楼层,无楼层则跳过渲染
				if (item.pictures.length === 0) return;
				
				$building = $('#' + prefix + '-' + item.id);
				// 判断当前建筑是否存在
				if ( $building.length === 0 ) {
					$building = $('<div>').attr({
						'class': prefix,
						'id': prefix + '-' + item.id
					}).appendTo( self.$map );
					// 创建data-hover与layer元素
					var $head = $('<a>'), $body = $('<div>');
					$head.attr({
						'data-hover': 'layer',
						'data-event': 'show',
					})
					.addClass('on')
					.appendTo( $building );

					$body.attr({
						'data-layer': 'hover'
					})
					.addClass( 'layer default' )
					.appendTo( $building );
					$head.html( template('overviewBuildingHeadTpl', item) );
					$body.html( template('overviewBuildingBodyTpl', item) );
					
					_cooIdCache.push(item.id);
				} else {
					var $head = $building.find('[data-hover=layer]'),
						$body = $building.find('[data-layer=hover]');
					// 遍历楼层把楼层中的数据放入集合中
					item.pictures.forEach(function(pic){
						self.pictures[ pic.id ] = pic.picCountMap;
					});
					$head.html( template('overviewBuildingHeadTpl', item) );
					$body.html( template('overviewBuildingBodyTpl', item) );
					// 添加滚动
					UI.iscroll( $building.find('.iscroll') );
					// svg图表
					$svg = $building.find('[data-elem=svg]').html('');
					// 调用echart绘图
					self.drawFloor( $svg[0], item.cooCountMap);
				}
				// 创建楼层
				$building.css({
					left: item.cooMainx + _difX - 60,
					top: item.cooMainy + _difY - 40
				})
			});
		},
		/**
		 * 地图移动缩放相关操作
		 * @param {Object} event 时间对象
		 * @return {[type]} [description]
		 */
		mapHandle: function( event ) {
			var self = this,
				$doc = $(document), 
				type = event ? event.type : 0,
				con = event ? event.target : 0;
			if ( type === 'mousedown' ) {
				if (con && con.target && con.target.getAttribute('class') === 'title') return;
				_intX = event.pageX;
				_intY = event.pageY; 
				//添加样式
				self.$map.addClass('on');
				$(document).on('mousemove.map', function(e){
					// 鼠标当前所在的位置
					_cenX = e.clientX;
					_cenY = e.clientY;
					// 计算移动的距离
					_disX = _cenX - _intX;
					_disY = _cenY - _intY;
					// 移动地图
					$(_canvas).css({
						left: '+=' + _disX * 1,
						top: '+=' + _disY * 1
					})
					// 重置初始距离
					_intX = _cenX;
					_intY = _cenY;
				});
			} else if ( type === 'mouseup' || type === 'mouseleave' ) {
				// 解绑移动事件
				$(document).off('mousemove.map');
				// 地图元素
				$canvas = $(_canvas);
				// 移除鼠标样式添加过渡样式
				self.$map.removeClass('on');
				$canvas.addClass('transition');
				// 计算是否超出限制
				var left = parseFloat( $canvas.css('left') ),
					top = parseFloat( $canvas.css('top') );
				// 判断是否超出限制
				left > 0 ? left = 0 : '';
				left < _orgDifX ? left = _orgDifX : '';
				top > 0 ? top = 0 : '';
				top < _orgDifY ? top = _orgDifY : ''
				// 设置地图位置
				$canvas.css({left: left, top: top});
				//  移除样式
				setTimeout(function(){
					$canvas.removeClass('transition');
					// 重新计算difx与dify
					_difX = left;
					_difY = top;
					// 重新计算位置
					self.distributed();
					self.mapWarDisplay();
				}, 601)
			} else if ( type === 'mousewheel' ) {

			} else if ( type === 'click' ) {
				if ( !self.data ) return;

				var x = event.clientX - 75, 
					y = event.clientY - 70;
				self.data.data.forEach(function(item, i){
					if ( x < item.rbx && x > item.lfx && y < item.rby && y > item.lfy ) {
						$('#overview-building-' + item.id).find('>a').trigger('click');
					}
				});
			} else {
				var	winHeight = $(window).height(),
					winWidth = $(window).width(),
					// 容器以及canvas的大小
					width = winWidth - 70,
					height = winHeight - 75 ;
				self.$el.css({
					width: width,
					height: height
				});
				// 设置地图容器大小
				self.$map.css({
					width: width,
					height: height
				})
				// 获取图片的实际大小
				var realWidth = _image.width,
					realHeight = _image.height;
				_difX = (width - realWidth) / 2;
				_difY = (height - realHeight) / 2;
				_orgDifX = width - realWidth ;
				_orgDifY = height - realHeight; 
				// 设置地图canvas大小以及样式
				_canvas.style.position = 'absolute';
				_canvas.style.left = _difX + 'px';
				_canvas.style.top = _difY + 'px';
				_canvas.width = _image.width;
				_canvas.height = _image.height;
				// 水滴
				_canvasElement.width = width;
				_canvasElement.height = height;
				_canvasElement.style.position = 'absolute';
				// 车载
				_canvasCar.style.position = 'absolute';
				_canvasCar.width = width;
				_canvasCar.height = height;
				// 将图片写入canvas中
				_context.drawImage(_image, 0, 0 );
			}
		},
		/**
		 * 每层数据统计
		 * @return {[type]} [description]
		 */
		countFloor: function(event) {
			var $con = $(event.currentTarget),
				chart = $con.closest('.layer-body').find('[data-elem=svg]')[0],
				data = $con.attr('data-value');
			// 修正
			if ( typeof data !== 'object' ) {
				data = this.pictures[ data ];
			}
			// 获取数据
			this.drawFloor( chart, data );
		},
		/**
		 * 总数据统计
		 * @return {[type]} [description]
		 */
		countAll: function( event ){
			var $con = $(event.currentTarget),
				id = $con.attr('data-id'),
				chart = $con.closest('.layer-body').find('[data-elem=svg]')[0];
			// 获取数据
			var rs = this.data.data.filter(function(item){
				return item.id == id;
			});
			this.drawFloor( chart, rs[0].cooCountMap );
		},
		/**
		 * 双击进入楼层
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		enterFloor: function( event ) {
			var hash = event.currentTarget.getAttribute('data-hash');
			// 路由
			location.hash = hash;
		},
		/**
		 * 调用echart绘制统计圈图
		 * @param  {[type]} chart [description]
		 * @param  {[type]} data  [description]
		 * @return {[type]}       [description]
		 */
		drawFloor: function(chart, data) {
			if ( !data ) return;
			var datas = [
                { 
                	value: data.important || 0.1 , 
                	name: '重犯',
                	itemStyle: {
                		normal: { color: 'red' },
						emphasis: { color: 'red' }
                	}
                },
                { 
                	value: data.general || 0.1 , 
                	name: '普犯',
                	itemStyle: {
                		normal: { color: 'green' },
						emphasis: { color: 'green' }
                	}
                },
                { 
                	value: data.police ||  0.1 , 
                	name: '民警',
                	itemStyle: {
                		normal: { color: '#3385ff' },
						emphasis: { color: '#3385ff' }
                	}
                }
            ]

			var option = {
				    tooltip: {
				        trigger: 'item',
				        formatter: "{b}: {c} ({d}%)",
				        textStyle: {
				        	fontSize: 12
				        },
				        padding: 1,
				        position: [10, 80]
				    },
				    legend: {
				        orient: 'vertical',
				        x: 'left',
				        data:['重点罪犯','普通罪犯','民警人数']
				    },
				    series: [
				        {
				            name:'楼层数据统计',
				            hoverAnimation: false,
				            type:'pie',
				            radius: ['45%', '80%'],
				            center: ['50%', '48%'],
				            avoidLabelOverlap: false,
				            label: {
				                normal: {
				                    show: false,
				                    position: 'center'
				                },
				                emphasis: {
				                    show: true,
				                    textStyle: {
				                        fontSize: '12'
				                    }
				                }
				            },
				            labelLine: {
				                normal: {
				                    show: false
				                }
				            },
				            data: datas
				        }
				    ]
				};
			// 绘图
			var mychart = echarts.init( chart );
			mychart.setOption( option );
		},
		/**
		 * 监听报警信息与车辆监控
		 * @return {[type]} [description]
		 */
		carWarResponse: function( response ) {
			var self = this,
				data = JSON.parse( response.data ),
				cars = data.car,
				warsData = self.warsData = data.data;
			//console.log('warsData',warsData);
			// _e++;
			// var pos = _carPosCache['1'].pos;
			// // if ( _e < 50 ) {
			// // 	var x = 1190 - 5 * _e + Math.random() * 10,
			// // 		y = 590 + 2 * _e + Math.random() * 10;
			// // 	// 比较前一次与后一次的偏移量
			// // 	// pos.push({x: x, y: y});
			// // 	var last = pos[ pos.length - 1 ];
			// // 	if ( !((last.x - x < 10) && (last.x - x > 0) && (last.y - y < 7) && (last.y - y > 0)) ) {
			// // 		pos.push({x: x, y: y});
			// // 	}
			// // } 
			// var len = pos.length,
			// 	lastPos = pos[ pos.length - 1 ];
			// // 遍历车辆
			// cars.forEach(function(car){
			// 	// 绘制轨迹
			// 	_contextCar.clearRect(0, 0, _canvasCar.width, _canvasCar.height);
			// 	pos.forEach(function(item, i){
			// 		var x = item.x + 5, 
			// 			y = item.y + 5;
			// 		if ( i === 0 ) {
			// 			//-- 
			// 			_contextCar.beginPath();
			// 			_contextCar.strokeStyle = 'rgba(15, 137, 245, 1)';
			// 			_contextCar.fillStyle = 'rgba(15, 137, 245, .3)';
			// 			_contextCar.arc(x + _difX, y + _difY, 25, Math.PI * 2, 0);
			// 			_contextCar.stroke();
			// 			_contextCar.fill();
			// 			//--
			// 			_contextCar.beginPath();
			// 			_contextCar.strokeStyle = 'rgba(125, 125, 125, 1)';
			// 			_contextCar.fillStyle = '#ffffff';
			// 			_contextCar.arc(x + _difX, y + _difY, 9, Math.PI * 2, 0);
			// 			_contextCar.stroke();
			// 			_contextCar.fill();
			// 			//---
			// 			_contextCar.fillStyle = 'rgba(15, 137, 245, 1)'; //'#4187ee';
			// 			_contextCar.beginPath();
			// 			_contextCar.arc(x + _difX, y + _difY, 7, Math.PI * 2, 0);
			// 			_contextCar.fill();
			// 			//---
			// 			_contextCar.moveTo(x + _difX, y + _difY);
			// 			_contextCar.beginPath();
			// 			_contextCar.lineCap = 'round';
			// 			_contextCar.lineJoin = 'round';
			// 			_contextCar.strokeStyle = 'rgba(15, 137, 245, 1)';// '#5298ff';
			// 			_contextCar.shadowBlur = 4;
			// 			_contextCar.shadowColor = "blue";
			// 			_contextCar.shadowOffsetY = 2;
			// 			_contextCar.lineWidth = 3;					
			// 		} else {
			// 			_contextCar.lineTo( x + _difX, y + _difY );
			// 			if ( i + 1 === len ) {
			// 				_contextCar.stroke();
			// 				_contextCar.closePath();
			// 				// 清除样式
			// 				_contextCar.shadowBlur = 0;
			// 				_contextCar.shadowColor = 'rgba(255, 255, 255, 0)';
			// 				_contextCar.shadowOffsetY = 0;
			// 				_contextCar.lineWidth = 1;
			// 				// 绘制车辆
			// 				_contextCar.drawImage(_imageCar, x - _imageCar.width + _difX, y - _imageCar.height + _difY);
			// 				// 创建车辆信息
			// 				var x = x - 50 - _imageCar.width / 2 + _difX,
			// 					y = y - 25 - _imageCar.height + _difY;
			// 				_contextCar.fillStyle = 'rgba(51, 133, 255, 1)';
			// 				_contextCar.fillRect( x, y, 100, 20);
			// 				_contextCar.font = 'bold 14px/0px tahoma';
			// 				_contextCar.fillStyle = 'rgba(255, 255, 255, 1)';
			// 				_contextCar.fillText(car.vheNum, x + 16, y + 16);
			// 			}
			// 		}
			// 	});
			// 	// 创建车辆报警
			// 	self.createCarWarning( car, lastPos );
			// });
			// // 执行在监车辆渲染
			// chartView.ins.handleCar( cars );
			// 渲染头部报警
			topWarView.ins.render( warsData );
			// 渲染地图报警
			self.mapWarDisplay( );
			// 报警已经加载过一次
			_isWarLoad = true;
		},
		/**
		 * 创建车辆报警
		 * @return {[type]} [description]
		 */
		createCarWarning: function( car, lastPos ) {
			if ( !car.vheEquipment ) return;

			var self = this,
				$car;
			if ( ($car = self.$map.find('[data-carid='+ car.id +']')).length === 0 ) {
				$car = $('<div>').attr('data-carid', car.id)
	  						 	.html( template('carWarningTpl', car) )
	  						 	.appendTo( self.$map )
	  						 	.css({
		  						 	position: 'absolute',
				  					left: 977 + _difX - 40,
				  					top: 773 + _difY - 50
		  						 });
			}
			// console.log( $car )
	  		var dis = parseFloat( car.vheEquipment.equPerDistance );
	  		// 帮助硬件屏蔽错误数据
	  		_carDisCache.push(dis);
	  		if ( _carDisCache.length === 6 ) {
	  			_carDisCache.shift();
	  		}
	  		// console.log( dis, dis > 10, dis < 50, dis > 10 && dis < 50 );
	  		if ( dis > 10 && dis < 50) {
	  			$car.find('>a').show();
	  			$car.find('>i').css({color: 'red'});
	  			window.location.hash = 'overview';
	  			if ( _.indexOf( _carIdcache, car.id ) === -1 ) {
	  				document.getElementById('carwarning').play();
	  				_carIdcache.push( car.id );
	  			} 
	  		} else {
	  			var pos = _.indexOf( _carIdcache, car.id ),
	  				len = _carDisCache.length, bool = true;
	  			while( len-- ) {
	  				if ( _carDisCache[len] > 10 ) bool = false;
	  			}
	  			// console.log( typeof dis, dis, dis === 99 || dis === 66 );
	  			// 处理丢包与误报
	  			if( (dis === 99 || dis === 66) && !(lastDis > 10 && lastDis < 50)  ) bool = true;

	  			if ( bool ) {
	  				if( pos > -1 ) {
	  					_carIdcache = [];
	  				}

	  				$car.find('>a').hide();
	  				$car.find('>i').css({color: 'blue'});
	  			}
  			}
	  		lastDis = dis;
		},
		/**
		 * 历史搜索记录框显示
		 * @return {undefined} 无返回
		 */
		appear: function() {
			ActivityLocus.history.ins.appear();
		},
		/**
		 * 重犯查看
		 * @return {[type]} [description]
		 */
		vipCheck: function() {
			!vipCheckView.ins ? vipCheckView.ins = new vipCheckView : '';
			vipCheckView.ins.show();
		},
		mapWarDisplay: function( ) {
			var self = this,
				// 模板集合
				wars = {};
			// 如果无数据不渲染
			if ( !self.warsData || self.warsData.length === 0 ) {
				$('.overview-warning').remove();
				return;
			};
			// 遍历渲染
			self.warsData.forEach(function(war){
				if ( war.cooId
				/*	&& war.warRuleType !== '12' 
//					&& war.warRuleType !== '13'
					&& war.warRuleType !== '11'
					&& war.warRuleType !== '10'
					&& war.warRuleType !== '0'*/
				) {
					if ( !wars[war.cooId] ) {
						wars[war.cooId] = {
							num: 0,
							warList: [],
							id: war.cooId
						};
					}
					wars[war.cooId].warList.push( war );
					wars[war.cooId].num++;
				}
			});
			if (_.isEmpty(wars)) {
				_cooIdCache.forEach(function(id){
					$('#overview-warning-' + id).hide()
				});
				return;
			} 
			_.each(wars, function(item, cooId){
				var $coo = $('#overview-building-' + item.id),
					$warning = $('#overview-warning-' + item.id).show(),
					$header = $('#warning-header-' + item.id),
					$bodyer = $('#warning-bodyer-' + item.id);

				if ( item.warList.length === 0 ) {
					$warning.remove();
				} else {
					var left = parseInt( $coo.css('left') ),
						top = parseInt( $coo.css('top') );
					// 如果已经渲染过报警
					if ( $warning.length === 0 ) {
						$warning = $('<div>').attr({
							'id': 'overview-warning-' + item.id,
							'class': 'overview-warning'
						}).css({
							'position': 'absolute'
						}).appendTo( self.$map );
						// 渲染内容
						$warning.prepend( template('overviewWarningHeaderTpl', item) );
						// 将报警内容插入
						$bodyer = $('<div>').attr({
							'data-layer': 'hover',
							'class': 'layer red',
							'id': 'warning-bodyer-' + item.id
						}).css({
							width: '350px',
							left: '-57px',
							top: '-170px'
						}).appendTo( $warning );
						$bodyer.html( template('overviewWarningBodyTpl', item) );
					}
					// 重新计算报警点的位置
					$warning.css({
						'left': left + 30,
						'top': top + 30
					})
				}
				// 添加滚动条
				UI.iscroll( $bodyer.find('.layer-body') );
			});
		}
	});

	var _warIdsCache = false;
		_informNum = 0;
		_advanceNum = 0;
	var topWarView = Backbone.View.extend({
		el: '#topWarView',
		events: {
			// 唯一窗口
			'click [data-event=unique]': 'unique',
			// 查看损坏的手环报警
			'click [data-event=breakEvent]': 'breakEvent',
			//查看全部预警
			'click [data-event=checkall]': 'checkall',
			'click [data-event=closeBox]': 'closeBox',
		},
		initialize: function() {
			this.$el = $(this.el);
			// 告警与预警容器
			this.$inform = this.$el.find('#informWarList');
			this.$advance = this.$el.find('#advanceWarList');
			this.$advanceNum = this.$el.find('[data-name=advance]');
			this.$informNum = this.$el.find('[data-name=inform]');
		},
		/**
		 * 渲染报警与告警
		 * @param {Object} data 报警数据
		 * @return {[type]} [description]
		 */
		render: function( data ) {
			var self = this,
				informContent = '',
				advanceContent = '',
				informNum = 0,
				advanceNum = 0;

			this.data = data;
			// 遍历渲染
			if(!_warIdsCache) {
				_warIdsCache = [];
				data && data.forEach(function(war){
					_warIdsCache.push(war.id);
					if (true
						/*&& war.warRuleType !== '12' 
//						&& war.warRuleType !== '13'
						&& war.warRuleType !== '11'
						&& war.warRuleType !== '10'
						&& war.warRuleType !== '0'*/
					) {
						
						war.time = new Date( war.warTime ).Format('yyyy-MM-dd hh:mm:ss');
						if ( war.warType == 1 ) { // 告警
							war.cl = 'inform';
							informContent += template('topWarViewTpl', war);
							informNum++;
						} else if ( war.warType == 0 ) { // 预警
							war.cl = 'previously';
							advanceContent += template('topWarViewTpl', war);
							advanceNum++;
						}
					}
				});
				_informNum = informNum;
				_advanceNum = advanceNum;
				// 插入
				self.$inform.html( informContent );
				self.$advance.html( advanceContent );
				self.$informNum.html( informNum );
				self.$advanceNum.html( advanceNum );
			} else {
				var warIds = [];
				data && data.forEach(function(war){
					if (
						true
						/*&& war.warRuleType !== '12' 
//						&& war.warRuleType !== '13'
						&& war.warRuleType !== '11'
						&& war.warRuleType !== '10'
						&& war.warRuleType !== '0'*/
					) {
						warIds.push(war.id);
						if ( war.warType == 1 ) { // 告警
							if (_warIdsCache.indexOf(war.id) === -1) {
								war.time = new Date( war.warTime ).Format('yyyy-MM-dd hh:mm:ss');
								war.cl = 'inform';
								var content = template('topWarViewTpl', war);
								self.$inform.prepend(content);
							}
							informNum++;
						} else if ( war.warType == 0 ) { // 预警
							if (_warIdsCache.indexOf(war.id) === -1) {
								war.time = new Date( war.warTime ).Format('yyyy-MM-dd hh:mm:ss');
								war.cl = 'previously';
								var content = template('topWarViewTpl', war);
								self.$advance.prepend(content);
							}
							advanceNum++;
						}
					}
					
				});
				// 比较差集
				var diff = _.difference(_warIdsCache, warIds);
				diff.forEach(function(id){
					$('#' + id).remove();
				});
				// 重置缓存
				_warIdsCache = warIds;
				// 判断变更
				if (_informNum !== informNum) {
					self.$informNum.html( _informNum = informNum );
				}
				
				if (_advanceNum !== advanceNum) {
					self.$advanceNum.html( _advanceNum = advanceNum );
				}
			}			
			// 触发报警
			if ( informNum > 0 ) {
				this.$informNum
					.addClass('icon-animated-vertical')
					.prev()
					.addClass('icon-animated-bell');
			} else {
				this.$informNum
					.removeClass('icon-animated-vertical')
					.prev()
					.removeClass('icon-animated-bell');
			}

			if ( advanceNum > 0 ) {
				this.$advanceNum
					.addClass('icon-animated-vertical')
					.prev()
					.addClass('icon-animated-bell');
			} else {
				this.$advanceNum
					.removeClass('icon-animated-vertical')
					.prev()
					.removeClass('icon-animated-bell');
			}
			// 如果是第一次加载这需要加上滚动条
			if (!_isWarLoad) {
				UI.iscroll( this.$inform.closest('.layer-body') );
				UI.iscroll( this.$advance.closest('.layer-body') );
			}
		},
		/**
		 * 只有唯一窗口显示
		 * @return {[type]} [description]
		 */
		unique: function( event ) {
			var con = event.currentTarget;
			$(con).closest('li').siblings().find('.layer').removeClass('show');
		},
		/**
		 * 查看损坏的手环
		 * @param {Objecct} event 事件对象
		 * @return {[type]} [description]
		 */
		breakEvent: function(event) {
			var self = this,
				// dom元素
				$con = $(event.currentTarget),
				// 获取数据id
				id = $con.attr('data-id'),
				// 弹窗容器
				$container = $('#topWarBreak');
			
			var war = self.data.filter(function(item){
				return item.id === id;
			})[0];
			// 获取人员详情
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				data: {watNum: war.watNum},
				type: 'post'
			}).done(function(data){		
				war.warTime= new Date( war.warTime ).Format('yyyy-MM-dd hh:mm:ss');
				data.data.war = war;
				// 渲染
				$container.html(template('topWarBreakTpl', data.data)).addClass('enter show');
			});
			// 消除报警
			$.post(Global.path + '/rule/warSimpleResult/getWarSimpleResultById', {id: id}, function(data){
				
			}, 'json');
			$("#topWarView").find('.layer').removeClass('show');
			// enter show
		},
		closeBox: function(event){
			$("#topWarView").find('.layer').removeClass('show');
		},
		checkall: function(event){
			$('.page-menu-list > li:nth-child(3) .items-list > li:nth-child(2) > a').show().trigger('click');
			$("#topWarView").find('.layer').removeClass('show');
		}
	});
	// 右侧组织与区域信息
	var rigthView = Backbone.View.extend({
		el: '#rightView',
		events: {
			'click [data-event=renderGroups]': 'renderGroups',
			// 根据楼层获取楼层中的人
			'click [data-event=fetchAreaPerson]': 'fetchAreaPerson',
			// 根据监区与分监区获取人员
			'click [data-event=fetchGroupPerson]': 'fetchGroupPerson',
			// 定位建筑
			'click [data-event=areaLocate]': 'areaLocate',
			// 查看人物详细
			'click [data-event=detail]': 'detail',
			// 关闭
			'click [data-event=closed]': 'closed',
			// // 点击分监区或小组计算人员分布
			// 'click [data-event=distribute]': 'distribute',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 建筑物容器
			this.$building = this.$el.find('[data-view=building]');
			// this.buildingTpl = _.template( $('#rigthViewBuildingTpl').html() );
			// this.areaPersonTpl = _.template( $('#fetchAreaPersonTpl').html() );
			// 监区容器
			this.$groups = this.$el.find('[data-view=groups]');
		},
		/**
		 * [render description]
		 * @param  {Object} coos   建筑物信息
		 * @return {undefined}          无返回
		 */
		renderCoos: function( coos ) {
		
			var self = this,
				content = '';
			// 判断是否刷新
			if ( _isRefresh ) return;
			// 遍历建筑物
			coos.forEach(function(coo, i){
				coo.index = i;
				content += template( 'rigthViewBuildingTpl', coo );
			});
			this.$building.html( content );
			// 默认展开第一项
			this.$building.find('#first').trigger('click', true);
			// 重置内容
			content = '';
			// 自适应
			Global.handleAuto();
			// 只加载一次
			_isRefresh = true;
			$('#rightView [data-name=refresh] > i').removeClass('fa-spin');
		   // console.log('ssss',$('#rightView [data-name=refresh] > i').attr('class'));
		},
		renderGroups: function() {
			var self = this,
				content = '';
			// 请求获取数据
			$.http({
				url: Global.path + '/main/loadGroupAndpeoInfo.do',
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				data.data.forEach(function(pco, i){
					pco.index = i;
					content += template('rigthViewGroupsTpl', pco);
				});
				self.$groups.html( content );
			});
		},
		/**
		 * 通过楼层获取人员相关信息
		 * @event  {object} event 事件对象
		 * @return {undefined} 无返回
		 */
		fetchAreaPerson: function( event ) {
			var self = this,
				$con = $(event.currentTarget),
				picId = $con.attr('data-picId'),
				// 渲染容器
				$bodyer = $con.parent().next(),
				$container = $bodyer.find('>ul'),
				content = '';
			if ( !$con.hasClass('open') ) {
				$.http({
					url: Global.path + '/main/loadLocAndPeoInfo.do',
					type: 'post',
					dataType: 'json',
					data: {id: picId}
				}).done(function(data){
					var len = 0;
					data.data.forEach(function(loc){
						loc.peoList && loc.peoList.forEach(function(peo){
							len++;
							content += template('fetchAreaPersonTpl', peo);
						});
					});
					// 插入
					if ( len > 0 ) {
						var h1 = parseInt( $bodyer.find('>ul').css('maxHeight') ),
						h2 = len * 22;
						$container.html( content );
						$bodyer.height( h1 > h2 ? h2 : h1 );
					}
				});
			}
		},
		/**
		 * 通过监区与分监区获取人员相关信息
		 * @event  {object} event 事件对象
		 * @return {undefined} 无返回
		 */
		areaLocate: function( event, bool  ) {
			if ( !bool ) {
				var self = this,
					$con = $(event.currentTarget),
					cooId = $con.attr('data-id'),
					$building = $('#overview-building-' + cooId).find('[data-hover=layer]');
				// 找到建筑并显示
				$building.trigger('click');
			}
		},
		/**
		 * 查看人物详情
		 * @param  {object} event 事件对象
		 * @return {bool}    	  false
		 */
		detail: function( event ) {
			var id = event.currentTarget.getAttribute('data-id');
			// 调用搜索
			FullTextSearch.view.ins.fetch( id );
		},
		/**
		 * 显示与隐藏组织结构
		 * @return {undefined} 无返回
		 */
		show: function() {
			if ( this.$el.hasClass('show') ) {
				this.$el.removeClass('show');
			} else {
				this.$el.addClass('show');
			}
		},
		/**
		 * 关闭
		 * @return {undefined} 无返回
		 */
		closed: function() {
			this.show();
		},
		/**
		 * 刷新
		 * @return {undefined} 无返回
		 */
		refresh: function( event ){
			_isRefresh = false;
			// 加载中
			$(event.currentTarget).find('>i').addClass('fa-spin');
		}
	});

	
	var _formatter = function(value, index) {
    	return '';
    };
	

	var _option =  {
		title: {
			text: '',
			show: false
		},
	    tooltip: {
	        trigger: 'axis',
	        axisPointer: {
	            type: 'shadow'
	        }
	    },
	    grid: {
	    	top: '5%',
	        left: '8%',
	        right: '15%',
	        bottom: '0%',
	        containLabel: true
	    },
	    xAxis: {
	        type: 'value',
	        splitLine: { show: false },
	        axisLine: { show: false },
	        axisLabel: { show: false },
	        axisTick: {show: false}
	    },
	    yAxis: {
	        type: 'category',
	        data: [],
	        splitLine: {
	        	show: false
	        },
	        axisLine: {
            	lineStyle: {
                	color: '#d2d2d2'
            	}
       		},
       		axisTick: {
       			lineStyle: {
                	color: '#d2d2d2'
            	}
       		}
	    },
	    series: [
	        {	name: '',
	            type: 'bar',
	            data: [],
	            barWidth: 10,
	            label: {
	            	normal: {
	            		show: true,
	            		position: 'right',
	            		formatter: '{c}次'
	            	}
	            }
	        }
	    ]
	};

	var getRandomColor = function(){    
	  return  '#' +    
	    (function(color){    
	    	return (color +=  '0123456789abcdef'[Math.floor(Math.random()*16)])    
	      	&& (color.length == 6) ?  color : arguments.callee(color);    
	  	})('');    
	} 

	// 民警配比度缓存
	var _policeScale = {};
	// 右侧统计报表
	var chartView = Backbone.View.extend({
		el: '#chartView',
		events: {
			// 显示与隐藏统计报表
			'click.show [data-event=show]': 'show',
			// 罪犯数量显示
			'click [data-event=handleCriminal]': 'handleCriminal',
			// 罪犯详情显示
			'mouseenter [data-event=handleCriminalShow]': 'handleCriminalShow',
			'mouseleave [data-event=handleCriminalShow]': 'handleCriminalShow',
			// 民警配比度
			'click [data-event=handleScale]': 'handleScale',
			// 事件数量
			'click [data-event=handleEvent]': 'handleEvent',
			// 改变日期选择
			'click [data-event=changeDay]': 'changeDay'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 报表框
			this.$container = this.$el.find('#container');
			// 默认显示罪犯信息
			this.handleCriminal();
		},
		/**
		 * 首页报表统计数据的显示与隐藏
		 * @return {[type]} [description]
		 */
		show: function() {
			if ( this.$container.hasClass('none') ) {
				this.$container.removeClass('none');
			} else {
				this.$container.addClass('none');
			}
			$('#rightView').removeClass('show');
		},
		/**
		 * 显示罪犯统计详情
		 * @return {[type]} [description]
		 */
		handleCriminalShow: function( event ) {
			var type = event.type,
				con = event.currentTarget;
		},
		/**
		 * 显示统计罪犯
		 * @return {[type]} [description]
		 */
		handleCriminal: function() {
			var self = this,
				// 图标容器
				$view = this.$el.find('[data-view=handleCriminal]'),
				// 图表
				$chart = $view.find('.body>ul'),
				// 遍历统计人数
				content = '',
				// 总数
				allCount = 0,
				// 在线数
				nowCount = 0,
				importCount = 0,
				generalCount = 0;
			// 请求数据
			$.http({
				url: Global.path + '/report/criminalStatisticsCount',
				type: 'post',
				dataType: 'json'
			}).done(function(data){
				data.data.forEach(function(item){
					item.peoAllCount = item.impPeoAllCount + item.nomPeoAllCount;
					item.peoNowCount = item.impPeoNowCount + item.nomPeoNowCount;
					item.imAll = (item.impPeoAllCount * 1 / item.peoAllCount  * 100).toFixed(2) + '%';
					item.geAll = (item.nomPeoAllCount * 1 / item.peoAllCount * 100).toFixed(2) + '%';
					allCount += item.peoAllCount;
					nowCount += item.peoNowCount;
					importCount += item.impPeoNowCount;
					generalCount += item.nomPeoNowCount;
					content += template('handleCriminalTpl', item);
				});
				$chart.html( content );
				$view.find('[data-value=allCount]').html(nowCount);
				$view.find('[data-value=generalCount]').html(generalCount);
				$view.find('[data-value=importCount]').html(importCount);
				// 增加滚动条
				// UI.iscroll($chart);
			});
		},
		/**
		 * 处理事件统计
		 * @param {object || int} event event对象可能需要修正
		 * @return {[type]} [description]
		 */
		handleEvent: function( event ) {
			var self = this,
				// X轴与Y轴的值
				yAxis = [], series = [];

			if ( _.isObject( event ) ) {
				type = 1;
			} else {
				type = event;
			}
			$.http({
				url: Global.path + '/report/eventStatisticsCount.do',
				type: 'post',
				data: {type: type},
				dataType: 'json'
			}).done(function(data){
				var collection = data.data.data;
				_.each(collection, function(model, i){
					yAxis.unshift( model.pco_name );
					series.unshift({
						value: model.count,
						name: model.pco_name,
						normal: { color: getRandomColor() }
					});
				});
				_option.yAxis.data = yAxis;
				_option.series[0].data = series;

				var box = document.getElementById('handleEvent');
				box.style.height = '210px';
				// 绘图
				var mychart = echarts.init( box );
				mychart.setOption( _option );
			});
		},
		/**
		 * 在监车辆推送
		 * @param {Object} cars 在监车辆数据
		 * @return {[type]} [description]
		 */
		handleCar: function( cars ) {
			var self = this,
				// 车辆统计报容器
				$container = self.$el.find('#handleCar'),
				content = '';
			// 遍历
			cars.forEach(function(car){
				// 处理持续时间
				car.lastTime = ((new Date().getTime() - new Date(car.vheStatDate).getTime()) / 3600000).toFixed(1)
				content += template('handleCarTpl', car);
			});
			$container.html( content );
		},
		/**
		 * 时间改变日期
		 * @return {[type]} [description]
		 */
		changeDay: function( event ) {
			var type = event.currentTarget.getAttribute('data-value'),
				con = event.currentTarget;
			$(con).addClass('active').parent().siblings().find('.active').removeClass('active');
			this.handleEvent( type );
		},
		/**
		 * 民警配比
		 * @return {[type]} [description]
		 */
		handleScale: function( event, data ) {
			if ( !event ) {
				var content = '',
					id,
					police,
					$container = this.$el.find('#handleScale'),
					total;
				// 渲染diff算法
				var	diffRender = function(model) {
					_policeScale[id] = {
							police: police,
							total: total
						}
						
						if ( total == 0 ) {
							model.scale = '0:0';
						} else {
							if ( police == 0 ) {
								model.scale = '0:' + total;
							} else {
								model.scale = '1:' + (total / police).toFixed(1);
							}
						}
						model.total = total;
						model.police = police;
						content = template( 'handleScaleTpl', model );
						
						// 当前tr
						var $tr = $container.find('[key='+id+']');
						if ($tr.length > 0) {
							$tr.prop('outerHTML', content);
						} else {
							$container.append(content);
						}
					}
				
				_.each(data, function(model, i){
					model.index = ++i;
					id = model.id;
					police = model.cooCountMap.police;
					total = model.cooCountMap.important + model.cooCountMap.general;
					
					// 判断数据是否缓存过
					if (!_policeScale[id]) {
						diffRender(model);
					}
					// diff对比，只有变化过才更新
					if (
						_policeScale[id].police !== police || 
						_policeScale[id].total  !== total
					) {
						diffRender(model);
					}
				});
//				this.$el.find('#handleScale').html( content );
			}
		}
	});
	

	var noticeView = Backbone.View.extend({
		el: '#noticeView',
		events: {
			'click [data-event=ignore]': 'ignore',
			'click [data-event=bindWatch]': 'bindWatch',
			'click [data-event=bindBed]': 'bindBed',
			'click [data-event=bindWrk]': 'bindWrk',
			'click [data-event=bindGroup]': 'bindGroup',
			'click [data-event=bindSet]': 'bindSet',
			'click [data-event=unique]': 'render',
			'click [data-event=checkall]': 'checkall',
		},
		initialize: function() {
			var self = this;
			this.$el = $(this.el);

			var $watchBtn = $('#noticeWatchSubmit');
			$watchBtn.closest('form').on('submit', function(){
				var $form = $(this);
				$.http({
					url: Global.path + '/watch/bindWatchId.do',
					data: $form.serializeArray(),
					dataType: 'json',
					type: 'post'
				}).done(function(data){
					if (data.status === 0) {
						UI.alert({ message: data.msg });
						$watchBtn.next().trigger('click');
						self.render();
						$('#noticeManagement').find('[data-event=refresh]').trigger('click');
					} else {
						UI.alert({ message: data.msg, type: 'danger', container: $form });
					}
				});
			});

			var $bedBtn = $('#noticeBedSubmit');
			$bedBtn.closest('form').on('submit', function(){
				var $form = $(this);
				$.http({
					url: Global.path + '/a/per/admPeopleInfo/bindBedId',
					data: $form.serializeArray(),
					dataType: 'json',
					type: 'post'
				}).done(function(data){
					if (data.status === 0) {
						UI.alert({ message: data.msg });
						$bedBtn.next().trigger('click');
						setTimeout(function(){
							self.render();
							$('#noticeManagement').find('[data-event=refresh]').trigger('click');
						},500);
						
						//console.log('waiting....');
						
						var $container = $('#noticeBedSet');
					} else {
						UI.alert({ message: data.msg, type: 'danger', container: $form });
					}
				});
			});

			var $wrkBtn = $('#noticeWrkSubmit');
			$wrkBtn.closest('form').on('submit', function(){
				var $form = $(this);
				$.http({
					url: Global.path + '/a/per/admPeopleInfo/bindWorkerId',
					data: $form.serializeArray(),
					dataType: 'json',
					type: 'post'
				}).done(function(data){
					if (data.status === 0) {
						UI.alert({ message: data.msg });
						$wrkBtn.next().trigger('click');
						self.render();
						$('#noticeManagement').find('[data-event=refresh]').trigger('click');
					} else {
						UI.alert({ message: data.msg, type: 'danger', container: $form });
					}
				});
			});

			var $groupBtn = $('#noticeGroupSubmit');
			$groupBtn.closest('form').on('submit', function(){
				var $form = $(this);
				$.http({
					url: Global.path + '/a/per/admPeopleInfo/updatePloAndDorm',
					data: $form.serializeArray(),
					dataType: 'json',
					type: 'post'
				}).done(function(data){
					if (data.status === 0) {
						UI.alert({ message: data.msg });
						$groupBtn.next().trigger('click');
						self.render();
						$('#noticeManagement').find('[data-event=refresh]').trigger('click');
					} else {
						UI.alert({ message: data.msg, type: 'danger', container: $form });
					}
				});
			});

			var $setBtn = $('#noticeSetSubmit');
			$setBtn.closest('form').on('submit', function(){
				var $form = $(this);
				$.http({
					url: Global.path + '/a/per/admPeopleInfo/bindBedId',
					data: $form.serializeArray(),
					dataType: 'json',
					type: 'post'
				}).done(function(d1){
					if (d1.status === 0) {
						UI.alert({ message: d1.msg });
						$setBtn.next().trigger('click');
						self.render();
						$('#noticeManagement').find('[data-event=refresh]').trigger('click');
					} else {
						UI.alert({ message: data.msg, type: 'danger', container: $form });
					}
				});
				setTimeout(function(){
					$.http({
						url: Global.path + '/a/per/admPeopleInfo/updatePloAndDorm',
						data: $form.serializeArray(),
						dataType: 'json',
						type: 'post'
					}).done(function(rsp){
					});
				},500);
			});
		},
		bindWatch: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeWatchBind');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[data-name=peoId]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
			$("#topWarView").find('.layer').removeClass('show');
		},
		bindGroup: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeGroupSet');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
		
			TripleNumberLink.init({
				$pco: $container.find('[data-name=pcoId]'),
				$plo: $container.find('[data-name=ploId]'),
				pcoId: con.getAttribute('data-pcoId'),
				ploId: 'null',
				handlezIndex: 10099
			});
			$("#topWarView").find('.layer').removeClass('show');
		},
		bindBed: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeBedSet');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
		  
			var arr = con.getAttribute('data-bedInfo');
			if (arr) {
				arr = arr.split('-');
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					cooId: arr[3],
					picId: arr[2],
					locId: arr[1],
					bedId: arr[0],
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					cooId: "",
					picId: "",
					locId: "",
					bedId: "",
					handlezIndex: true
				});
			}
			$("#topWarView").find('.layer').removeClass('show');			
		},
		bindWrk: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeWrkSet');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
		
			var arr = con.getAttribute('data-wrkInfo').split('-');

			if (arr) {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$wrk: $container.find('[name=workerId]'),
					cooId: arr[3],
					picId: arr[2],
					locId: arr[1],
					wrkId: arr[0],
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$wrk: $container.find('[name=workerId]'),
					cooId: "",
					picId: "",
					locId: "",
					wrkId: "",
					handlezIndex: true
				});
			}
			$("#topWarView").find('.layer').removeClass('show');
		},
		bindSet: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeSet');
			UI.dialog($container);
			
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
			$container.find('[data-name=dorm]').val(con.getAttribute('data-dorm'));
			var arr = con.getAttribute('data-bedInfo');
			if (arr) {
				
				arr = arr.split('-');
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					cooId: arr[3],
					picId: arr[2],
					locId: arr[1],
					bedId: arr[0],
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					handlezIndex: true
				});
			}

			TripleNumberLink.init({
				$pco: $container.find('[data-name=pcoId]'),
				$plo: $container.find('[data-name=ploId]'),
				pcoId: con.getAttribute('data-pcoId'),
				ploId:  con.getAttribute('data-ploId'),
				handlezIndex: 10099
			});
			$("#topWarView").find('.layer').removeClass('show');

		},
		ignore: function(e) {
			var con = e.currentTarget;
			var self = this;
			$.http({
				url: Global.path + '/a/per/admCriminalChange/save',
				type: 'post',
				dataType: 'json',
				data: {id: con.id, state: 1}
			}).done(function(data){
				if(data.status === 0) {
					self.render();
				}
			});
		},
		render: function() {
			var self = this;
			$.http({
				url: Global.path + '/a/per/admCriminalChange/listAll',
				type: 'post',
				data: {state: 0},
				dataType: 'json'
			}).done(function(data){
				var content = '',
					$notice = self.$el.find('[data-name=notice]'),
					len = 0;

				if (data.data) {
					len = data.data.length;
					// 遍历组装数据
					data.data.forEach(function(item){
						//item.bedInfo = item.peo && item.peo.bedId ? item.peo.bedId : '' + '-' + (item.bedLoc ? item.bedLoc.id : '');
						item.bedInfo = (item.peo && item.peo.bedId ? item.peo.bedId : '') + '-' + (item.bedLoc ? item.bedLoc.id : '') + '-' +( item.bedPic ? item.bedPic.id : '') + '-' + (item.bedCoo ? item.bedCoo.id : '');
						item.wrkInfo = (item.peo && item.peo.workerId ? item.peo.workerId : '') + '-' +( item.wrkLoc ? item.wrkLoc.id : '')+ '-' + (item.wrkPic ? item.wrkPic.id : '') + '-' +( item.wrkCoo ? item.wrkCoo.id : '');
						content += template('noticeListTpl', item);
					});
				}
				// 触发报警
				$notice.html(len);

				if ( len > 0 ) {
					$notice.addClass('icon-animated-vertical')
						.prev()
						.addClass('icon-animated-bell');
				} else {
					$notice.removeClass('icon-animated-vertical')
						.prev()
						.removeClass('icon-animated-bell');
				}
				$('#noticeList').html(content).closest('.layer-body');

				UI.iscroll( $('#topWarView .iscroll') );
				
			});
		},
		checkall: function(event){
			$('.page-menu-list > li:nth-child(3) .items-list > li:nth-child(2) > a').show().trigger('click');	
			$("#topWarView").find('.layer').removeClass('show');
		}

	});

	var vipCheckView = Backbone.View.extend({
		el: '#vipCheckView',
		events: {
			'click [data-event=close]': 'close'
		},
		initialize: function() {
			this.$el = $(this.el);
		},
		/**
		 * 渲染查看数据
		 * @return {[type]} [description]
		 */
		render: function() {
			var self = this;
			$.http({
				url: Global.path + '/a/per/admCriminalList/findAll.do',
				type: 'post',
				dataType: 'json'
			}).done(function(data){
				var models = data.data.data,
					areas = {};
				// 处理数据
				_.each(models, function(model, i){
					var temp = {};
					!areas[ model.pco.id ] ? areas[ model.pco.id ] = [] : '';
					areas[ model.pco.id ].push( model );
				});
				var dataItem = {
					leftPers: areas,
					rightPers: models
				}
				console.log('dataItem',dataItem,models);
				self.$el.find('.modal-body').html( template( 'vipCheckTpl', dataItem ) );
			});
		},
		/**
		 * 显示重犯查看
		 * @return {[type]} [description]
		 */
		show: function() {
			this.render();
			UI.dialog( this.$el );
		},
		/**
		 * 关闭对话框
		 * @type {[type]}
		 */
		close: function() {
			$('.page-menu-list > li:nth-child(2) > a').trigger('click');		
			this.$el.find('.close').trigger('click');
		},/**
		 * 防止冒泡
		 * @return {[type]} [description]
		 */
		unmove: function(e) {
			console.log('sssss');
			var e = e || window.e;
			e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
		},
	});
	
	overview.view 		= centralView;
	overview.topWarView = topWarView;
	overview.rigthView 	= rigthView;
	overview.chartView  = chartView;

	return overview;
})