/*****					
	区域(监舍楼)楼层平面图 start
*****/
/* 首页全局视图 */
define(['global', 'createPerson', 'activityLocus', 'videoControl', 'mainLoop'], function(Global, CreatePerson, ActivityLocus, VideoControl, MainLoop){
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
		// 地图遮罩
		_imgMask,
		// 区域容器
		_gLoc,
		// svg标准
		_svgNS = 'http://www.w3.org/2000/svg',
		// 地图位移值
		_transX = _transY = 0,
		// 地图缩放比例
		_scale = 1,
		// 是否拖拽标志位
		_ifDrag,
		// 当前楼层是否是工厂
		_isFactory = false,
		// 区域中的所有人元集合
		_allPeopleColl = {},
		// socket推送
		_wsIndex;
	// 模块返回值
	var AreaFlat = { };
	// 视图 
	var view = Backbone.View.extend({
		el: '#areaFlat',
		events: {
			// 在幢内搜索人员
			'click.search [data-event=search]': 'search',
			// 防止冒泡
			'click.unbubble [data-event=unbubble]': 'unbubble',
			'mousedown [data-event=unmove]': 'unmove',
			// 区域列表中的人
			'click.list [data-event=list]': 'list',
			// 人员详细信息
			'click.info [data-event=info]': 'info',
			// 关闭人物详细
			'click.closed [data-event=closed]': 'closed',
			'click.close [data-event=close]': 'close',
			// 人物详情下拉
			'click.slide [data-event=slide]': 'slide',
			// 人物历史范围
			'click.history [data-event=history]': 'history',
			// 切换楼层
			'click.change [data-event=change]': 'change',
			// 上一层
			'click.prev [data-event=prev]': 'prev',
			// 下一层
			'click.next [data-event=next]': 'next',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 播放视频
			'click.play [data-event=videoPlay]': 'videoPlay',
			// 重犯提交
			'click [data-event=vipCriSub]': 'vipCriSub',
			// 获取相应监区下的人员
			'click [data-event=handleGroups]': 'handleGroups',
			// 区域对应
			'mouseenter.areaLocate [data-event=areaLocate]': 'areaLocate',
			'mouseleave.areaLocate [data-event=areaLocate]': 'areaLocate',
			'click.areaLocate [data-event=areaLocate]': 'areaLocate',
			// 地图移动等操作
			'mousedown [data-event=map]': 'mapHandle',
			'mouseup [data-event=map]': 'mapHandle',
			'mousewheel [data-event=map]': 'mapHandle',
			'click [data-event=map]': 'mapHandle',
			// 鼠标移上去显示人头
			'mouseenter [data-event=showPeople]': 'showPeople',
			'mouseleave [data-event=showPeople]': 'showPeople',
			// 退回
			'click [data-event=goBack]': 'goBack'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			self.$el = $(self.el);
			// 楼层列表模板与容器
			self.$floor = this.$el.find('[data-view=floor]');
			self.$floorList = this.$el.find('#floorList');
			// 组关系容器与模板,监区分监区小组
			self.$organ = this.$el.find('[data-view=organ]');
			// 全局缩略图容器与显示点
			self.$thumb = $('#area-thumb');
			self.$point = $('#area-thumb-point');
			// 右侧人物详细模板与容器
			self.$detailList = this.$el.find('#detailList');
			self.$detailList.draggable({
                  handle: ".layer-header"
            });
			self.$detail = this.$el.find('#detail');
			self.$detail.draggable({
                handle: ".bubble-header"
            });
			self.$infoDetail = this.$el.find('#infoDetail');
			// 视频播放容器与绑定容器移动
			self.$video = this.$el.find('[data-view=video]');
			self.$video.draggable({
                  handle: ".header"
            });
			// 设置高度
			Global.handleContainer();
			// 处理隐藏
			Layout.addClickHandler(function(){
				$('[name=condition]').nextAll('ul').hide();
			});
			// 地图容器高度
			self.$mapContainer = self.$el.find('#map-container');
			// 获取相对左上角的偏移量
			var offset = self.$mapContainer.offset();
			_realWidth = $(window).width() - offset.left;
			_realHeight = $(window).height() - offset.top;
			// 设置地图容器实际高度
			self.$mapContainer.css({
				width: _realWidth,
				height: _realHeight
			});
			// 地图svg
			_svgMap = document.getElementById('locMap');
			$(_svgMap).css({
				position: 'absolute',
				zIndex: 1000
			}).attr({
				width: _realWidth,
				height: _realHeight
			})
			// 定义摄像头集合
			self.cameras = {};
		},
		/**
		 * 防止冒泡
		 * @return {[type]} [description]
		 */
		unbubble: function( e ) {
			var e = e || window.e;
			e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
		},
		/**
		 * 防止冒泡
		 * @return {[type]} [description]
		 */
		unmove: function(e) {
			var e = e || window.e;
			e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
		},
		// 开始监听
		monitorStart: function( ids ) {
			var self = this,
				ids = ids.split('-');
			// 关闭人员详情
			self.$detail.hide();
			// 获取人员ID
			self.cooId =  ids[ 0 ],
			self.picId = ids[ 1 ];
			self.peoId = ids[ 2 ];
			// 销毁释放播放器
			self.destory();
			// 初始化实时视频播放容器
			self.initPlayBox();
			// 关闭loading
			progress.start('L');
			// 移除原有所有区域
			// 清空地图
			$(_svgMap).find('>g').remove();
			$(_svgMap).find('>image').remove();
			// 清空区域缓存
			_locsCache = {};
			_isRefresh = false;
			// 推送
			_wsIndex = AreaFlat._wsIndex;
			// 监听后台推送
			_wsIndex.onmessage = function() {
				self.response.apply(self, arguments);
			}
			// 序列化推送参数
			var param = JSON.stringify( { method: 'floor', cooId: self.cooId, picId: self.picId } );
			// 获取一次数据
			_wsIndex.send(param);
			// 加入主循环监听
			MainLoop.set({
				name: 'main',
				param: param,
				func: _wsIndex.send,
				times: 2000,
				context: _wsIndex
			});
		},
		response: function( response ) {
			var self = this;
			// try{
				// var t1 = (new Date()).getTime() / 1000;p
				self.model = JSON.parse( response.data ).data;
				// 处理层
				self.handleFloor();
				// 渲染层中地图上的区域
				self.renderFloor();
				// 处理左侧下面全局缩略图
				self.handleThumb();
				// 停止加载
				self.$el.find('.fa-spin').removeClass('fa-spin');
				// 关闭进度
				progress.end();
				// 处理高度
				UI.iscroll( self.$el.find('.panel-body.atuo').css({maxHeight: $(window).height() - 555, height: 'auto'}) );
				self.$el.find('.panel-body.atuo').parent().css({height: 'auto'});
				// console.log( (new Date()).getTime() / 1000 - t1 )
			// } catch( e ) {
			// 	throw e;
			// }
		},
		/**
		 * 地图相关操作
		 * @param  {Object} event 事件对象
		 * @return {[type]}       [description]
		 */
		mapHandle: function ( event ) {
			var self = this,
				con = event.currentTarget,
				type = event.type;
			if ( type === 'mousedown' ) {
				// 更改样式
				con.style.cursor = 'move';
				var // 鼠标当前位置
					cenX = event.clientX,
					cenY = event.clientY,
					// 鼠标移动过的距离
					disX = disY = 0,
					// 当前鼠标所在的位置
					posX = posY = 0;
				self.$mapContainer.on('mousemove.map', function(e){
					// 位置
					posX = e.clientX;
					posY = e.clientY;
					// 移动过的距离
					disX = posX - cenX,
					disY = posY - cenY;
					// 移动地图
					_transX += disX;
					_transY += disY;
					// 地图位移
					$(_imgMap).attr({
						'x': _transX,
						'y': _transY
					});
					$(_imgMask).attr({
						'x': _transX,
						'y': _transY
					})
					$(_gLoc).css({
						transform: 'translate('+ _transX +'px, '+ _transY +'px)'
					});
					// 重置鼠标初始值
					cenX = posX;
					cenY = posY;
				});
			} else if ( type === 'mouseup' ) {
				_ifDrag = false;
				self.$mapContainer.css('cursor', 'default').off('mousemove.map');
			} else if ( type === 'mousewheel' ) {
				var type = event.target.getAttribute('data-ref');
				if ( type === 'svg' ) {
					// 比例
					_scale -= .05 * event.deltaY;
					// 重新设置地图viewBox
					_svgMap.setAttribute('viewBox', '0, 0,' + _image.width * _scale + ',' + _image.height * _scale);
				}
			}
		},
		/**
		 * 处理左侧菜单楼层分布
		 * @return {[type]} [description]
		 */
		handleFloor: function() {
			if ( _isRefresh ) return;
			var self = this,
				data = self.model,
				content = "",
				contentList = '';
			// 遍历渲染
			_.each(data.pictures, function(pic, i){
				pic.index = i;
				pic.picId = self.picId;
				content += template('areaFlatFloorTpl', pic);
				contentList += template('areaFlatFloorListTpl', pic);
			});
			// 渲染
			self.$floor.html( content );
			self.$floorList.find('>div').html( contentList );
			// 展开第一层
			var $row = $('#accordion-floor .accordion-toggle[data-id='+ self.id +']');
			$row.trigger('click.none');
			$row.find('[data-id]:first').prev().trigger('click');
			// 如果需要定位人员那么打开备选项
			if ( self.peoId ) {
				var $a = self.$floor.find('[data-id='+ self.peoId +']');
				// 加上选中激活
				$a.addClass('active');
				// 模拟点击展开
				$a.closest('.bodyer').prev().find('a:first').trigger('click');
			}
			
		},
		/**
		 * 渲染右侧楼层楼层地图中的区域
		 * @return {undefined} 无返回
		 */
		renderFloor: function( ) {
			var self = this,
				prefix = 'area-floor-';
			// 帅选出对应楼层数据
			var pictures = self.model.pictures.filter(function(pic){
				return pic.id == self.picId;
			});
			var picture = pictures[0];
			// 当前层人数统计
			self.$el.find('[data-value=total]').html( picture.picCountMap.total );
			self.$el.find('[data-value=important]').html( picture.picCountMap.important );
			self.$el.find('[data-value=general]').html( picture.picCountMap.general );
			self.$el.find('[data-value=police]').html( picture.picCountMap.police );
			self.$el.find('[data-value=offline]').html( picture.picCountMap.lost );
			// 渲染人物以及地图
			var render = function( img ) {
				// 容器大小设置
				var left = 0, top = 0,
					// 区域html数据
					regionContent = '';
				// 判断是否需要创建地图
				if ( !_isRefresh ) {
					// 清空地图
					$(_svgMap).find('>g').remove();
					$(_svgMap).find('>image').remove();
					// 清空区域缓存
					_locsCache = {};
					// 地图偏移量
					_left = (_realWidth - _image.width) / 2;
					_top = (_realHeight - _image.height) / 2;
					// 设置svg地图
					_svgMap.setAttribute('viewBox', '0, 0,'+ _image.width * _scale +',' + _image.height * _scale);
					// 地图图片设置
					_imgMap = document.createElementNS(_svgNS, 'image');
					$(_imgMap).attr({
						'xlink:href':  Global.path + picture.picPath,
						'width': _image.width,
						'height': _image.height
					})
					_imgMap.href.baseVal = Global.path + picture.picPath;
					_svgMap.appendChild( _imgMap );
					// 创建遮罩层
					_imgMask = document.createElementNS(_svgNS, 'rect');
					$(_imgMask).attr({
						'width': _image.width,
						'height': _image.height,
						'data-ref': 'svg',
						'fill': 'rgba(255, 255, 255, 0)'
					});
					_svgMap.appendChild( _imgMask );
					// 创建区域父容器
					_gLoc = document.createElementNS(_svgNS, 'g');
					// 插入地图中
					_svgMap.appendChild( _gLoc );
				}
				// 遍历计算区域
				picture.locareas.forEach(function(loc, i){
					// 区域坐标计算
					// 左上角xy坐标
					loc.ltx = loc.locMainx - loc.locSizex / 2;
					loc.lty = loc.locMainy - loc.locSizey / 2;
					// 右下角xy坐标
					loc.rbx = loc.locMainx + loc.locSizex / 2;
					loc.rby = loc.locMainy + loc.locSizey / 2;
					// 如果区域缓存中存在区域那比对对svg的dom进行更新
					var cache = _locsCache[ loc.id ];
					if ( cache ) { 
						/*比对当前区域数据与上次区域数据删除或添加对应的人员*/
						// 遍历获取当前人员id集合,与人员信息集合
						var peoIds = [], peoList = {};
						loc.peoList.forEach(function(peo){
							peoIds.push( peo.id );
							peoList[ peo.id ] = peo;
							// 将人员写入人员集合中
							_allPeopleColl[peo.id] = peo;
						});
						// 获取要删除的人员
						var a = _.difference(cache, peoIds),
							// 获取要增加的人员
							b = _.difference(peoIds, cache),
							// 获取区域G元素
							g = document.getElementById('area-floor-' + loc.id).parentElement;
						
						// 判断是否变化过
						if ( peoIds.length === 0) {
							// 清空当前区域
							$(g).find('text.person').remove();
							// 还原床位信息
							$(g).find('[data-place=bed]').each(function(){
								this.setAttribute('class', 'g-bed');
								this.setAttribute('data-status', 0);
							});
							$(g).find('[data-place=wrk]').each(function(){
								this.setAttribute('class', 'g-wrk');
								this.setAttribute('data-status', 0);
							});
							// 当区域中没人的时候清空区域中的缓存
							_locsCache[ loc.id ] = [];
						// 人员有过变动
						} else if ( a.length !== 0 || b.length !== 0 ) {
							// 清空当前区域
							$(g).find('text.person').remove();
							// 重新创建人物
							var peoIds = self.createPeople(g, loc);
							// 存入区域缓存中
							_locsCache[ loc.id ] = peoIds;
						
						} else {
							loc.peoList && loc.peoList.forEach(function(peo, i){
								var peoSvg = document.getElementById('floor-person-' + peo.id);
								if (peoSvg) {
									// 判断是否是丢失状态
									if (peo.allRunningState === 0) {
										peoSvg.setAttribute('class', 'iconfont person color-gray');
									} else {
										if ( peo.peoType == 1 ) {
											peoSvg.setAttribute('class', 'iconfont person color-green');
										} else {
											peoSvg.setAttribute('class', 'iconfont person color-red');
										}
									}
								}
							});
						}					
					} else {
						// 创建svg g元素容器
						var g = document.createElementNS(_svgNS, 'g');
						// 设置属性以及事件
						$(g).attr({
							'data-event': 'list',
							'data-picid': picture.id,
							'data-id': loc.id,
							'class': 'g-region',
							'y': _top,
							'data-ref': 'svg'
						})
						// 创建区域svg元素
						var locSvg = document.createElementNS(_svgNS, 'rect');
						// 创建区域
						$(locSvg).attr({
							id: prefix + loc.id,
							'data-id': loc.id,
							'class': 'region',
							'x': loc.ltx,
							'y': loc.lty,
							'width': loc.locSizex,
							'height': loc.locSizey,
							'data-ref': 'svg'
						});
						// 插入g元素中
						g.appendChild(locSvg);
						// 创建床位与工位
						self.createBed(g, loc);
						self.createWorkder(g, loc);
						// 区域插入svg文档
						_gLoc.appendChild(g);
						// 创建区域中的人员
						var peoIds = self.createPeople(g, loc);
						// 存入区域缓存中
						_locsCache[ loc.id ] = peoIds;
					}
					// 创建区域中的摄像头
					self.createCamera(g, loc);
					// 创建区域中的人数统计
					self.createPeopleCount(g, loc);
				});
				_isRefresh = true;
			}
			// 判断地图是否已经缓存加载过
			_image = _imageCache[ picture.id ];
			if ( !_image ) {
				_image = _imageCache[ picture.id ] = new Image();
				_image.onload = function() {
					render();
				}
				_image.src =  Global.path + picture.picPath;
			} else {
				render();
			}
			// 切换楼层标题
			this.$el.find('[data-value=floor]').html( picture.picName );
			// 判断是否显示重控犯提交按钮
			if ( _isFactory ) {
				self.$el.find('[data-event=vipCriSub]').hide();
			} else {
				self.$el.find('[data-event=vipCriSub]').show();
			}
		},
		/**
		 * 创建区域中的人数统计
		 * @param  {Object} g 区域svg信息
		 * @param  {Object} loc 区域信息
		 * @return {[type]}     [description]
		 */
		createPeopleCount: function(g, loc) {
			var countSvg;
			if (countSvg = document.getElementById('count-' + loc.id)) {
				$(countSvg).html(loc.locCountMap.total);
			} else {
				// 创建统计svg
				countSvg = document.createElementNS(_svgNS, 'text');
				circleSvg = document.createElementNS(_svgNS, 'circle');
				// 设置svg属性
				$(circleSvg).attr({
					id: 'cricle-' + loc.id,
					'data-id': loc.id,
					'class': 'circle',
					'cx': loc.ltx,
					'cy': loc.lty,
					'r': 10
				});
				$(countSvg).attr({
					id: 'count-' + loc.id,
					'data-id': loc.id,
					'class': 'count',
					'width': 20,
					'height': 20,
					'data-ref': 'svg'
				}).html(loc.locCountMap.total);
				// 加入区域中
				g.appendChild(circleSvg);
				g.appendChild(countSvg);
			}
			if (loc.locCountMap.total > 9) {
				var diff = 10;
			} else if (loc.locCountMap.total > 99) {
				var diff = 12;
			} else {
				var diff = 4;
			}
			$(countSvg).attr({
				'x': loc.ltx - diff,
				'y': loc.lty + 6,
			})
		},	
		/**
		 * 创建人员
		 * @param  {Object} locSvg 区域节点
		 * @param  {Object} loc 区域信息 LIST
		 * @return {Object} 当前区域人员id集合
		 */
		createPeople: function( locSvg, loc ) {
			var self = this,
				// 区域下创建人员
				peoIds = [];
			// 判断区域的类型
			if ( loc.locType == 199 ) { // 监舍
				var // 计数
					c = 1,
					// 字体
					font = 12,
					// 计算区域的中轴定点坐标
					axisX = loc.locMainx - font / 2,
					axisY = loc.locMainy - loc.locSizey / 2;
				// 遍历
				loc.peoList.forEach(function(peo, i){
					// 获取监区分监区信息
					if ( i === 0 ) {
						self.pcoId = peo.pco ? peo.pco.id : '3319140000';
						self.ploId = peo.plo ? peo.plo.id : 1;
					}
					// 判断人员是否已经存在
					if ( peo.bed && peo.bed.locId === loc.id) { // 罪犯出现在其宿舍
						// 找到床位
						var bed = document.getElementById( peo.bed.id );
						// 设置人员id
						bed.setAttribute('data-id', peo.id);
						// 判断是否是丢失状态
						if (peo.allRunningState === 0) {
							bed.setAttribute('class', 'g-bed gray');
						} else {
							// 高亮床位
							if ( peo.peoType == 1 ) {
								bed.setAttribute('class', 'g-bed green');
							} else {
								bed.setAttribute('class', 'g-bed red');
							}
						}
					} else {
						// 判断床位是否存在
						if ( peo.bed ) {
							// 找到床位
							var bed = document.getElementById( peo.bed.id );
							// 将床位变暗
							bed && bed.setAttribute('class', 'g-bed');
						}
						var peoSvg = document.createElementNS(_svgNS, 'text'),
							className;
						// 判断是否是丢失状态
						if (peo.allRunningState === 0) {
							className = 'iconfont color-gray person';
						} else {
							// 判断类型
							if ( peo.peoType === '1' ) {
								className = 'iconfont color-green person';
							} else if ( peo.peoType === '2' ) {
								className = 'iconfont color-red person';
							} else if ( peo.peoType === '3' ) {
								className = 'iconfont color-blue person';
							}
						}
						// 设置属性id
						$(peoSvg).attr({
							id: 'floor-person-' + peo.id,
							'class': className,
							'data-id': peo.id,
							'data-ref': 'svg',
							'data-event': 'showPeople'
						}).html( '&#xe6ba;' );
						// 设置字体
						peoSvg.style.fontSize = font + 'px';
						// 设置人物的位置
						peoSvg.setAttribute('x', axisX);
						peoSvg.setAttribute('y', axisY + c * font + 2);
						// 人员插入文档
						locSvg.appendChild( peoSvg );
						c++;	
					}
					// 将id写入集合中
					peoIds.push( peo.id );
					_allPeopleColl[peo.id] = peo;	
				});
				// 当前楼层为监舍
				_isFactory = false;
			} else if (loc.locType == 299) { // 车间
				var // 每列人物的索引数
					c = 1,
					// 字体
					font = 20,
					// 计算车间右侧点坐标
					axisX = loc.locMainx + loc.locSizex / 2 - 30,
					axisY = loc.locMainy - loc.locSizey / 2,
					// 计算一列能容纳的数量
					rowNum = Math.ceil((loc.locSizey - 100) / 20),
					// 目前遍历到那个人
					n = 0,
					// 目前换了多少列
					col = 0; 
				// 遍历
				loc.peoList.forEach(function(peo, i){
					if ( peo.wrk && peo.wrk.locId === loc.id) { // 罪犯出现在其自己车间
						// 找到床位
						var wrk = document.getElementById( peo.wrk.id );
						// 设置人员id
						wrk.setAttribute('data-id', peo.id);
						// 判断是否是丢失状态
						if (peo.allRunningState === 0) {
							wrk.setAttribute('class', 'g-wrk gray');
						} else {
							// 高亮工位
							if ( peo.peoType == 1 ) {
								wrk.setAttribute('class', 'g-wrk green');
							} else {
								wrk.setAttribute('class', 'g-wrk red');
							}
						}
					} else { // 罪犯未出现在其自己车间
						if (peo.wrk) {
							// 找到床位
							var wrk = document.getElementById( peo.wrk.id );
							// 将位置变暗
							wrk && wrk.setAttribute('class', 'g-wrk');
						}
						var peoSvg = document.createElementNS(_svgNS, 'text'),
							className;
						
						// 判断是否是丢失状态
						if (peo.allRunningState === 0) {
							className = 'iconfont color-gray person';
						} else {
							// 判断类型
							if ( peo.peoType === '1' ) {
								className = 'iconfont color-green person';
							} else if ( peo.peoType === '2' ) {
								className = 'iconfont color-red person';
							} else if ( peo.peoType === '3' ) {
								className = 'iconfont color-blue person';
							}
						}
						// 设置属性id
						$(peoSvg).attr({
							id: 'floor-person-' + peo.id,
							'class': className,
							'data-id': peo.id,
							'data-ref': 'svg',
							'data-event': 'showPeople'
						}).html('&#xe6ba;');
						// 设置字体
						peoSvg.style.fontSize = font + 'px';
						// 人数自增
						n++;
						if (n === rowNum) {
							n = 0;
							col++;
							c = 1;
						}
						// 设置人物的位置
						peoSvg.setAttribute('x', axisX - col * 25);
						peoSvg.setAttribute('y', axisY + c * font + 2);
						// 人员插入文档
						locSvg.appendChild( peoSvg );
						c++;	
					}
					// 将id写入集合中
					peoIds.push( peo.id );
					_allPeopleColl[peo.id] = peo;	
				});
				// 当前楼层为工厂
				_isFactory = true;
			} else { // 非车间与宿舍
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

						// 判断是否是丢失状态
						if (peo.allRunningState === 0) {
							className = 'iconfont color-gray person';
						} else {
							// 判断类型
							if ( peo.peoType === '1' ) {
								className = 'iconfont color-green person';
							} else if ( peo.peoType === '2' ) {
								className = 'iconfont color-red person';
							} else if ( peo.peoType === '3' ) {
								className = 'iconfont color-blue person';
							}
						}

						// 设置属性id
						$(peoSvg).attr({
							id: 'floor-person-' + peo.id,
							'class': className,
							'data-id': peo.id,
							'data-ref': 'svg',
							'data-event': 'showPeople'
						}).html('&#xe6ba;');
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
						// 将id写入集合中
						peoIds.push( peo.id );
						_allPeopleColl[peo.id] = peo;	
					}
				});
			}
			
			return peoIds;
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
			// 去掉所有摄像头
			$(locSvg).find('.video').remove();
			// 遍历计算
			loc.camera.forEach(function(camera, i){
				left = camera.camMainx - reLeft;
				top = camera.camMainy - reTop;
				// 插入区域中
				var camSvg = document.createElementNS(_svgNS, 'text');
				// 设置属性
				$(camSvg).attr({
					'data-event': 'videoPlay',
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
		 * 移上去显示人物的基本信息
		 * @param {Object} event 事件对象
		 * @return {[type]} [description]
		 */
		showPeople: function(event) {
			var self = this,
				// 当前元素
				con = event.currentTarget,
				// 人员di
				id = con.getAttribute('data-id'),
				// 事件类型
				type = event.type;
			if (id) {
				var cl = con.getAttribute('class');
				if (type === 'mouseenter') {
					var cenX = event.clientX,
						cenY = event.clientY;
					// 转换为jQuery元素
					$tip = $(template('areaShowPeopleTpl', _allPeopleColl[id]));
					// 定位
					$tip.css({
						left: cenX - 70 - 50,
						top: cenY - 70 - 50
					});
					// 高亮
					con.setAttribute('class', cl + ' highlight');
					// 渲染
					self.$el.append($tip);
				} else if (type === 'mouseleave') {
					$('.flat.tooltip').remove();
					// 去掉高亮
					con.setAttribute('class', cl.replace('highlight',''));
				}
			}
		},
		/**
		 * 创建床位
		 * @param {Object} locSvg区域DOM元素
		 * @param {Object} loc 区域数据
		 * @return {[type]} [description]
		 */
		createBed: function(locSvg, loc)   {
			var self = this;
			// 遍历
			loc.bedList && loc.bedList.forEach(function(bed, i){
				// 工位svg节点
				var bedSvg = document.createElementNS(_svgNS, 'rect');
				$(bedSvg).attr({
					'id': bed.id,
					'data-type': bed.bedType,
					'data-place': 'bed',
					'data-ref': 'svg',
					'x': bed.bedMainx,
					'y': bed.bedMainy,
					'data-event': 'showPeople'
				});
				// 上铺
				if ( bed.bedType == 1 ) {
					$(bedSvg).attr({
						'width': bed.bedSizex - 1,
						'height': bed.bedSizey - 1,
						'filter': 'url(#bedShadow)',
						'class': 'g-bed'
					});
				} else {
					$(bedSvg).attr({
						'width': bed.bedSizex,
						'height': bed.bedSizey,
						'class': 'g-bed'
					})
				}
				// 将床位放入区域svg中
				locSvg.appendChild( bedSvg );
			});
		},
		/**
		 * 创建工位
		 * @param {Object} locSvg区域DOM元素
		 * @param {Object} loc 区域数据
		 * @return {[type]} [description]
		 */
		createWorkder: function(locSvg, loc) {
			var self = this,
				// 工位svg节点
				wrkSvg = document.createElementNS(_svgNS, 'rect');
			var self = this;
			// 遍历
			loc.workerList && loc.workerList.forEach(function(wrk, i){
				// 工位svg节点
				var wrkSvg = document.createElementNS(_svgNS, 'rect');
				$(wrkSvg).attr({
					'id': wrk.id,
					'class': 'g-wrk',
					'data-ref': 'svg',
					'data-place': 'wrk',
					'x': wrk.wrkMainx,
					'y': wrk.wrkMainy,
					'width': wrk.wrkSizex,
					'height': wrk.wrkSizey,
					'data-event': 'showPeople'
				});
				// 将床位放入区域svg中
				locSvg.appendChild( wrkSvg );
			});	
		},
		/**
		 * 创建床位或工位名字
		 * @return {[type]} [description]
		 */
		createName: function(  ) {

		},
		/**
		 * 创建并显示人员名字
		 * @param {Float} scale 放大比例
		 * @param {Object} loc 区域数据
		 * @return {[type]} [description]
		 */
		createName: function( scale, loc ) {
			// 帅选出对应楼层数据
			var pictures = self.model.pictures.filter(function(pic){
				return pic.id == self.picId;
			});
			var picture = pictures[0];
			// 获取当前所有床位
			
		},
		/**
		 * 处理监区与分监区以及小组人员
		 * @param {Object} event 组织对象
		 * @return {undefined} 无返回
		 */
		handleGroups: function( event ) {
			var self = this,
				content = '';
			// 获取当前监区与分监区人员信息
			$.http({
				url: Global.path + '/main/loadGroupAndpeoInfo.do',
				dataType: 'json',
				type: 'post',
				data: {pcoId: self.pcoId, ploId: self.ploId}
			}).done(function( data ){
				// 渲染
				data.data.forEach(function(item, i){
					item.index = i;
					content += template('areaFlatOrganTpl', item);
				});
				self.$organ.html( content );
			});
		},
		/**
		 * 处理左下缩略图
		 * @return {undefined} 无返回
		 */
		handleThumb: function() {
			var self = this;
			// 导入全局缩略地图
			self.$thumb.attr('src',  window.MAP_URI).parent().css({
				left: -self.model.cooMainx + 156,
				top: -self.model.cooMainy + 125
			});
			// 在缩略地图上的点位显示
			self.$point.css({
				opacity: 1,
				left: self.model.cooMainx - 27,
				top: self.model.cooMainy - 27
			});
			self.$el.find('[data-value=coo]').html( self.model.cooName );
		},
		/**
		 * 销毁释放播放器
		 * 销毁定时器
		 * @return {[type]} [description]
		 */
		destory: function() {
			MainLoop.unset('main');
			_isReady = false;
			$('#vid-frame-container').remove();
			this.videoControlIns ? this.videoControlIns = null : '';
		},
		/**
		 * 防止冒泡
		 * @return {bool} false 防止冒泡
		 */
		unbubble: function() {
			return false;
		},
		/**
		 * 在幢内查询人员
		 * @param  {object} event 事件对象
		 * @return {undefined}    无返回
		 */
		search: function( event ) {
			var self = this,
				$con = $(event.currentTarget),
				param = { 
					condition: $.trim( $con.prev().val() ),
					coo_id: self.coo_id 
				};
			// 搜索获取
			self.fetch(param, function( data ){
				var content = '<li>暂无结果</li>', 
					model;
				// 遍历
				if (data) {
					content = '';
					data.forEach(function(peo){
						// 模板的拼接
						content += template('areaFlatSearchTpl', peo);
					});
				}
				// 渲染
				$con.next().html( content ).show();
			});
		},
		/**
		 * 查询人员
		 * @param  {object}   param    关键字参数
		 * @param  {Function} callback 回调函数
		 * @return {undefined}         无返回
		 */
		fetch: function( param, callback ) {
			$.http({
				url: persons.url,
				data: param,
				dataType: 'json',
				type: 'post'
			}).done(function( data ){
				// 加入数据集合中
				data.data && data.data.forEach(function(peo){
					persons.add( new person( peo ) );
				});
				// 执行回调
				callback && callback( data.data );
			});
		},
		/**
		 * 关闭人物详细
		 * @return {undefined} 无返回
		 */
		closed: function() {
			this.$detailList.removeClass('show');
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
		 * 人物详细列表
		 * @return {[type]} [description]
		 */
		slide: function () {
			var data = this.criEvents;
			// 渲染
			this.$infoDetail.addClass('enter show')
							.css({
								left: parseInt( this.$detail.css('left') ),
								top: parseInt( this.$detail.css('top') ) + 350 
							}).find('.layer-body').html( template( 'personnelDetailTpl', data ) );
		},
		/**
		 * 左侧人物历史范围
		 * @return {undefined} 无返回
		 */
		history: function() {
			// 右侧轨迹显示
			ActivityLocus.history.ins.load( this.criInfo );
		},
		/**
		 * 切换楼层
		 * @event {object} 事件对象
		 * @return {undefined} 无返回
		 */
		change: function( event ) {
			var self = this,
				// 楼层id
				picId = event.currentTarget.getAttribute('data-id');
			// 判断是否切换楼层
			if ( self.picId != picId ) {
				// 重置楼层
				self.picId = picId;
				// 重置参数
				var param = JSON.stringify( { method: 'floor', cooId: self.cooId, picId: self.picId } );
				// 重新加入监听
				MainLoop.set({
					name: 'main',
					param: param,
					func: _wsIndex.send,
					times: 5000,
					context: _wsIndex
				});
				// 清空地图
				$(_svgMap).find('>g').remove();
				$(_svgMap).find('>image').remove();
				// 发送一次
				_wsIndex.send( param );
				// 清空区域缓存
				_locsCache = {};
				_isRefresh = false;
				// 关闭详情与列表框
				self.closed();
			} 
		},
		/**
		 * 上一层
		 * @event {object} 事件对象
		 * @return {undefined} 无返回
		 */
		prev: function( event ){
			var self = this,
				$con = $(event.currentTarget),
				$a = $con.next().find('a.active');
			// 模拟点击
			$a.prev().trigger('click');
		},
		/**
		 * 下一层
		 * @event {object} 事件对象
		 * @return {undefined} 无返回
		 */
		next: function( event ){
			var self = this,
				$con = $(event.currentTarget),
				$a = $con.prev().find('a.active');
			// 模拟点击
			$a.next().trigger('click');
		},
		/**
		 * 刷新
		 * @return {undefined} 无返回
		 */
		refresh: function( event ){
			_isRefresh = false;
			// 加载中
			$(event.currentTarget).find('>i').addClass('fa-spin');
		},
		list: function( event ) {
			var self = this,
				$con = $(event.currentTarget),
				id = $con.attr('data-id'),
				picId = $con.attr('data-picid');
			var pictures = self.model.pictures.filter(function(pic){
				return pic.id == picId;
			})
			var loc = pictures[0].locareas.filter(function(loc){
				return loc.id == id;
			});
			// 区域信息
			loc = loc[ 0 ];
			// 人员信息以及人员判断
			var peoList = loc.peoList;
			if ( peoList && peoList.length > 0 ) {
				content = template('areaPersonListTpl', loc);
				// 列表位置判断
				var locMainx = loc.locMainx > 800 ? loc.locMainx - 500 : loc.locMainx;
				self.$detailList.css({
					left: locMainx,
					top: loc.locMainy - 100
				}).html( content ).removeClass('leave').addClass('enter show');
				// 关闭人物详细
				self.$detail.hide();
				self.$infoDetail.removeClass('enter show');
			} else {
				UI.alert({ message: Global.lang.m22, type: 'info'});
			}
		},
		/**
		 * [info description]
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		info: function( event ) {
			var self = this,
				$con = $(event.currentTarget),
				id = event.currentTarget.getAttribute('data-id');
			progress.start('L');
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
				data: {id: id }
			}).done(function(d1, d2){
				// 设置type
				var data = d1[0].data;
				data.type = false;
				
				
				data.cri.criBrithday = (new Date( data.cri.criBrithday )).Format('yyyy-MM-dd');
				data.cri.criMonitoringtime = (new Date( data.cri.criMonitoringtime )).Format('yyyy-MM-dd');
				
				self.$detail.html( template( 'personnelInfoTpl', data ) )
							.css({
								left: (left > 1200 ? 1200 : left) + 'px',
								top: top + 'px'
							}).show();

				// 设置处遇信息与详情信息
				self.criInfo = data;
				self.criEvents = d2[0].data[0];
				// 定位当前人物所在的区域
				// 移除其它高亮
				$('.region.active').each(function(){
					this.setAttribute('class', 'region');
				});
				var loc = document.getElementById('area-floor-' + data.locInfo.id);
				loc.setAttribute('class', 'region active');
				// 将人员写入搜索框
				self.$el.find('[name=condition]').val(data.peoName).nextAll('ul').hide();
				// 关闭进度
				progress.end();
			});
			return false;
		},
		
		/**
		 * 初始化视频播放容器
		 * @return {[type]} [description]
		 */
		initPlayBox: function() {
			this.DOMid = 'vid-frame-container';
			// 创建播放容器
			var $frame = $('<div>');
			// 设置容器
			$frame.appendTo( this.$video )
			      .addClass('body')
			      .attr('id', this.DOMid);
		},
		/**
		 * [videoPlay description]
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		videoPlay: function( event ) {
			var self = this,
				// 当前点击摄像头元素
				$con = $(event.currentTarget),
				// 摄像头id
				id = $con.attr('data-id'),
				// 摄像头数据
				camera = self.cameras[ id ];
			console.log('camera',camera);
			// 显示播放容器
			self.$video.show();
			// 位置定位
			var $parent = $con.parent();
			// 更换摄像头名字
			self.$video.find('[data-value=name]').html( camera.camName )
			// 设置
			// 计算偏移量
			var left = parseInt( $parent.css('left') );
			self.$video.css({
				left: left < 250 ? 0 : left,
				top: $parent.css('top')
			});
			// 实时播放视频
			if ( !self.videoControlIns ) {
				self.videoControlIns = VideoControl.init( self.DOMid );
			}
			self.videoControlIns.playlive( [camera] );
			return false;
		},
		vipCriSub: function() {
			!vipCriSub.ins ? vipCriSub.ins = new vipCriSub : '';
			// 显示重犯待提交列表
			vipCriSub.ins.show( self.pcoId, self.ploId);
		},
		/**
		 * [areaLocate description]
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		areaLocate: function( event ) {
			var con = event.currentTarget,
				id = con.getAttribute('data-id');
			if( event.type == 'mouseenter' ) {
				// $('#area-floor-'+id).addClass('active');
			} else if( event.type == 'mouseleave' ) {
				// $('#area-floor-'+id).removeClass('active');
			} else if ( event.type == 'click' ) {
				$(con).addClass('active')
					   .closest('.accordion-tree-list')
					   .siblings()
					   .find('.active')
					   .removeClass('active');
				// 添加激活
				var loc = document.getElementById('area-floor-'+id);
				loc.setAttribute('class', 'region active');
				$(loc).closest('g')
					  .siblings()
					  .find('.region.active')
					  .each(function(){
					  	this.setAttribute('class', 'region');
					  });
			} else {

			}
		},
		/**
		 * 回退
		 */
		goBack: function() {
			window.history.go(-1);
		},
	});


	var vipPerson = Backbone.Model.extend({
		idAttribute: 'id',
	});

	var vipPersons = new (Backbone.Collection.extend({
		model: vipPerson
	}));

	var criPerson = Backbone.Model.extend({
		idAttribute: 'id',
	});

	var criPersons = new (Backbone.Collection.extend({
		model: criPerson
	}));
	
	var vipCriSub = Backbone.View.extend({
		el: '#vipCriSub',
		events: {
			// 提交保存重犯
			'submit form': 'submit',
			// 选择重犯
			'click [data-event=choice]': 'choice',
			// 取消重犯提交
			'click [data-event=cancel]': 'cancel'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 设置表单元素
			this.addFormData();
			// 数据验证
			this.validate();
		},
		/**
		 * 渲染当前楼层所属监区人员
		 * @param {int} pco 监区ID
		 * @param {int} plo 分监区ID
		 * @return {[type]} [description]
		 */
		render: function(pco, plo) {
			var self = this;
			$.http({
				url: Global.path + '/a/per/admCriminalList/findList.do',
				data: {criCoo: pco, criLoc: plo},
				type: 'post',
				dataType: 'json'
			}).done(function(data){
				var models = data.data;
				// 人员存储
				vipPersons.set( models.peoples );
				criPersons.set( models.criminal );
				// 渲染显示
				self.$el.find('.modal-body').html( template('vipCriSubTpl', models) )
				// 滚动条
				UI.iscroll( self.$el.find('.iscroll') );
			});
		},
		/**
		 * 显示当前楼层所属监区人员w
		 * @param {int} pco 监区ID
		 * @param {int} plo 分监区ID
		 * @return {[type]} [description]
		 */
		show: function(pco, plo) {
			this.render(pco, plo);
			// 显示
			UI.dialog( this.$el );
		},
		/**
		 * 提交保存重犯
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this,
				data = [],
				isEmpty = false;
			this.$el.find('[data-watnum]').each(function(){
				var id = this.getAttribute('data-id'),
					vipModel, criModel;

				// 判断是否为空
				if ($.trim(this.value) == '') isEmpty = true;

				if ( vipModel = vipPersons.get( id ) ) {
					var json = {
						pcoId: vipModel.get('pco').id,
						ploId: vipModel.get('plo').id,
						criNum: vipModel.get('peoNum'),
						impName: vipModel.get('peoName'),
						impIdcard: '00',
						watNum: vipModel.get('wat').watNum,
						impType: vipModel.get('peoType'),
						remarks: this.value
					}
				} else if ( criModel = criPersons.get( id )) {
					var json = {
						id: id,
						pcoId: criModel.get('pco').id,
						ploId: criModel.get('plo').id,
						criNum: criModel.get('criNum'),
						impName: criModel.get('impName'),
						impIdcard: '00',
						watNum: criModel.get('watNum'),
						impType: criModel.get('impType'),
						remarks: this.value
					}
				} 
				data.push( json );
			});
			if ( isEmpty ) {
				UI.alert({ message: Global.lang.m28, type: 'warning'});
				return;
			}
			progress.start('L');
			// 提交保存
			$.http({
				url: Global.path + '/a/per/admCriminalList/save.do',
				data: JSON.stringify( data ),
				dataType: 'json',
				type: 'post',
				contentType: 'application/json; charset=utf-8'
			}).done(function( data ){
				if ( !data.status ) {
					UI.alert({ message: data.msg });
					// 关闭弹出层
					$('.close').trigger('click');
				} else {
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			}).always(function(){
				progress.end();
			});
		},
		/**
		 * 选择重犯
		 * @return {[type]} [description]
		 */
		choice: function( event ) {
			var self = this,
				//当前元素
				con = event.currentTarget,
				// id
				id = con.getAttribute('data-id');
				// 人员数据
			var	model = vipPersons.get( id ).toJSON();
			$(con).addClass('active');
			if (model.wat.watNum == '0') {
				UI.alert({ message: '当前用户未绑定手环无法进行巡检', type: 'info'});
			} else {
				// 判断右侧是否存在人员
				var	$cri = $('[data-watnum='+ model.wat.watNum +']');
				if ( $cri.length === 0 ) {
					this.$el.find('#rightPers').prepend( template('vipCriSubPeoTpl', model) );
				} else {
					$cri.closest('tr').addClass('active');
				}
			}
			
		},
		/**
		 * 取消重犯
		 * @type {[type]}
		 */
		cancel: function( event ) {
			var con = event.currentTarget,
				id = con.getAttribute('data-id'),
				type = con.getAttribute('data-type');
			// 激活样式移除
			this.$el.find('#leftPers').find('dd[data-id='+ id  +']').removeClass('active');
			// 请求去掉已存在的id
			if ( type && type === 'true' ) {
				$.http({
					url: Global.path + '/a/per/admCriminalList/delete',
					type: 'post',
					dataType: 'json',
					data: {id: id }
				}).done(function(data){
					if ( data.status == 0 ) {
						// 移除当前列
						$(con).closest('tr').remove();
					}
				});
			} else {
				$(con).closest('tr').remove();
			}
		}
	});

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
		model: person,
		url: Global.path + '/main/findPeopleInfoByIdOrName.do'
	}))();

	AreaFlat.view = view;
	// 全局模型
	return AreaFlat;
})
