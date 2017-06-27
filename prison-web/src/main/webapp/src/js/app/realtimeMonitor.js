define(['global', 'videoControl', 'overview'], function(Global, VideoControl, Overview){
	var // 返回
		realtimeMonitor = { },
		// timer定时器推送
		timer = null,
		// 当前正在监控的人员peo_id
		// 上一次的建筑ID
		// 上一次的区域ID
		peoId, lastCooId, lastLocId,
		// 基于小组的websocket连接
		ws = null;
	// 楼层模型
	var building = Backbone.Model.extend({
		idAttribute: 'id'
	});

	// 楼层数据集合
	var buildings = new (Backbone.Collection.extend({
		modelName: 'data',
		model: building,
		url: Global.path + '/main/loadCooPicLoc.do'
	}));

	// 监区组模型
	var group = Backbone.Model.extend({
		// idAttribute: 'coo_id'
	});

	// 监区组数据模型
	var groups = new (Backbone.Collection.extend({
		modelName: 'data',
		model: group,
		url: Global.path + '/main/loadGroupAndpeoInfo.do'
	}));

	// 视图
	var view = Backbone.View.extend({
		el: '#realtimeMonitor',
		events: {
			// 搜索人员
			'click.search [data-event=search]': 'search',
			// 防止冒泡
			'click.unbubble [data-event=unbubble]': 'unbubble',
			// 定位人员在建筑列表的位置
			'click.locate [data-event=locate]': 'locate',
			// 改变建筑
			'click.changeBuild [data-event=changeBuild]': 'changeBuild',
			// 改变层
			'click.openRegion [data-event=openRegion]': 'openRegion',
			// 追踪此人
			'click [data-event=monitor]': 'monitor',
			// 播放区域实时视频
			'click.liveVideo [data-event=liveVideo]': 'liveVideo',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 所有的摄像头数据
			this.cameras = {};
			// 幢层级tab
			this.$build = this.$el.find('[data-view=build]');
			// 组织关系
			this.$organ = this.$el.find('[data-view=organ]');
			// 处理容器大小
			Global.handleContainer();
			// 加载缩略图
			this.$thumb = this.$el.find('#monitor-thumb')
								  .attr('src', window.MAP_URI)
								  .parent();
			// 缩略图上的点
			this.$point = this.$el.find('#monitor-thumb-point');
			// 处理隐藏
			Layout.addClickHandler(function(){
				$('[name=condition]').nextAll('ul').hide();
			});
			// 搜索条件
			this.$condition = this.$el.find('[name=condition]');
			
		},
		/**
		 * 导入数据用于兼容有指定人员的时候
		 * @return {[type]} [description]
		 */
		load: function( id ) {
			// 渲染区域与组织
			this.renderBuilds();
			this.renderGroups( id );
			// 初始化播放容器
			this.initPlayBox();
		},
		/**
		 * 渲染建筑
		 * @return {undefined} 无返回
		 */
		renderBuilds: function() {
			var self = this;
			// 建筑渲染
			buildings.fetch({
				type: 'post',
				success: function() {
					var model,
						content = '';
					// 渲染楼层
					$.each(buildings.models, function( i ){
						model = this.toJSON();
						model.index = i;
						content += template('realtimeBuildTpl', model);
						// 取出所有摄像头数据
						model.pictures && model.pictures.forEach(function(pic){
							pic.locareas && pic.locareas.forEach(function(loc){
								loc.camera && loc.camera.forEach(function(camera){
									self.cameras[ camera.id ] = camera;
								});
							})
						});
					});
					self.$build.html( content );
					// 默认展开第一项
					self.$build.find('a[data-index=0]').trigger('click');
					// 去掉刷新
					self.$el.find('.fa-spin').removeClass('fa-spin');
					UI.iscroll(self.$el.find('.panel-body.atuo').css({maxHeight: $(window).height() - 455, height: 'auto'}));
					self.$el.find('.panel-body.atuo').parent().css({height: 'auto'})

				}
			});
		},
		/**
		 * 渲染监区组
		 * @param {int} id 人员id
		 * @return {undefined} 无返回
		 */
		renderGroups: function( id ) {
			var self = this;
			// 监区组渲染
			groups.fetch({
				type: 'post',
				success: function() {
					var model,
						content = '';
					// 渲染
					groups.models.forEach(function(item, i){
						model = item.toJSON();
						model.index = i;
						content += template('realtimeOrganTpl', model);
					});
					self.$organ.html( content );
					// 去掉刷新
					self.$el.find('.fa-spin').removeClass('fa-spin');
					// 切换到组织
					id && self.appoint( id );
					UI.iscroll(self.$el.find('.panel-body.atuo').css({maxHeight: $(window).height() - 555, height: 'auto'}));
					self.$el.find('.panel-body.atuo').parent().css({height: 'auto'});
				}
			})
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
					condition: $.trim( $con.prev().val() )
				};
			// 搜索获取
			self.fetch(param, function( data ){
				var content = '', model;
				// 遍历
				data.forEach(function(item){
					// 模板的拼接
					content += template('realtimeSearchTpl', item);
					// 将名字写入
					//self.$condition.val( item.peoName );
				});
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
				$.each(data.data, function(){
					persons.add( new person( this ) );
				});
				// 执行回调
				callback && callback( data.data );
			});
		},
		/**
		 * 指定某人视频追踪
		 * @param {int} id 人员编号
		 * @return {[type]} [description]
		 */
		appoint: function( id ) {
			var self = this,
				$organ = this.$el.find('[data-view=organ]');
			// 获取人员信息
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				data: { id: id },
				type: 'post'
			}).done(function(data){
				self.$condition.val( data.data.peoName );
				// 执行播放
				self.monitor( data.data.watNum );
			});
		},
		/**
		 * 改变建筑同时小地图做出相应的改变
		 * @param  {object} event 事件对象
		 * @bool   {bool}   bool 用于判断是否是trigger触发
		 * @return {undefind}     no return
		 */
		changeBuild: function( event, bool ) {
			var // 当前建筑对象
				$con = $(event.currentTarget),
				// 数据索引
				id = $con.attr('data-coo'),
				// 建筑数据
				data = buildings.get( id ).toJSON(),
				// 该楼层第一层
				$floor = $con.closest('div').next().find('[data-pic]:first');
				// 第一层的第一个区域
			//	$region = $floor.closest('div').next().find('[data-loc]:first');
			// // 分别展开楼层以及下属区域
			if ( !bool ) {
				// $floor.prev().trigger('click');
				// setTimeout(function(){
				// 	$region.trigger('click');
				// }, 400);
			}
			// 改变缩略图的位置
			this.$thumb.css({
				left: -data.cooMainx + 156,
				top: -data.cooMainy + 125
			});
			// 显示点并改变值
			this.$point.css({'opacity': 1, left: data.cooMainx - 27, top: data.cooMainy - 27})
			   .find('[data-value=coo]')
			   .html( data.cooName )
			   .attr('title', data.cooName);
			// 改变标题
			this.$el.find('[data-value=left]').html( data.cooName );
		},
		/**
		 * 点击层展开区域
		 * @return {[type]} [description]
		 */
		openRegion: function( event ) {
			var con = event.currentTarget,
				$con = $(con),
				$button = $con.prev();
			// 展开
			if ( !$button.hasClass('open') ) {
				$con.prev().trigger('click');
			}
			console.log(''+con.childNodes[2].nodeValue);
			// 改变标题
			this.$el.find('[data-value=center]').html(  '&gt;' + con.childNodes[2].nodeValue  );
		},
		/**
		 * 实时追踪当前选中的人
		 * @param {object} event 事件对象
		 * @return {[type]} [description]
		 */
		monitor: function( event ) {
			var self = this;
			// 修正参数
			if ( _.isObject(event) ) {
				var $con = $(event.currentTarget),
					name;
				watNum = $con.attr('data-watnum');
				// 判断获取名字
				if ( name = $con.find('.name').text() ) {
					self.$condition.nextAll('ul').hide();
				} else {
					name = $con.attr('data-name');
				}
				// 搜索框写入名字
				self.$condition.val($.trim(name));
				// 提示追踪
				UI.alert({ message: '正在对' + name + '追踪', type: 'info'});
			} else {
				watNum = event; 
			}
			// console.log( !ws );
			if ( !ws ) {
				lastLocId = null;
				// ws推送
				ws = $.websocket("ws://"+ Global.host + Global.path +"/cameraServer.do", {
				 	open: function() {
				 		ws.send( watNum );
				  	},
				  	message: function(response) {
				  		
				  		var data = JSON.parse( response.data ).data;
				  		var rsp = JSON.parse( response.data );
				  		//console.log(rsp,rsp.status);
                        if(rsp.status==0){
                        	// console.log(data);
    						if ( !self.videoControlIns ) {
    							self.videoControlIns = VideoControl.init( self.DOMid );
    						}
    						// 上一秒的楼层id判断
    						if ( lastCooId != data.coo.id ) {
    							// 地图位置渲染
    							self.$thumb.css({
    								left: -data.coo.cooMainx + 40,
    								top: -data.coo.cooMainy + 80
    							}).next().find('[data-value=coo]').html( data.coo.cooName );
    							// 设置上一秒
    							lastCooId = data.coo_id;
    							// 更换当前位置
    							self.$el.find('[data-value=left]').text( data.coo.cooName );
    						}
    						// 上一秒的区域id判断
    						if ( lastLocId != data.id ) {
    							self.videoControlIns.playlive( data.camera );
    							// 设置上一秒的区域id
    							lastLocId = data.id;
    							// 更换当前位置
    							self.$el.find('[data-value=center]').text(  '>' +  data.pic.picName );
    							self.$el.find('[data-value=right]').text(   '>' + data.locName );
    						}
							
						}else{
							UI.alert({ message: rsp.data, type: 'warning'});
							clearInterval( timer );
							timer = null;
						}
						
						
				  	},
				  	close: function() {
				  		console.log('monitor successfully disconnected')
				  	}
				});
			}
			if ( !timer ) {
				timer = setInterval(function(){
					// console.log( peoId );
					ws.send( watNum );
				}, 1000);
			}
		},
		/**
		 * 初始化播放容器
		 * @return {[type]} [description]
		 */
		initPlayBox: function() {
			this.$video = this.$el.find('[data-view=video]');
			this.DOMid = 'vid-frame-container' ;
			// 计算播放窗口的高度
			// 设置video
			this.$video.css({
				height: $(window).height() - 70,
				width: $(window).width() - 325 - 70
			})
			// 创建播放容器
			var $frame = $('<div>');
			// 设置容器
			// console.log(this.$video, $frame)
			$frame.appendTo( this.$video )
				  .addClass('video-body')
				  .attr({
				  	id: this.DOMid
				  });
		},
		/**
		 * 实时播放视频
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		liveVideo: function( event ){
			var self = this,
				con = event.currentTarget,
				$con = $(con),
				$button = $con.prev();
			// 清除定时器
			clearInterval( timer );
			timer = null;
			// 展开
			if ( !$button.hasClass('open') ) {
				$con.prev().trigger('click');
			}
			// 改变右侧视频框的标题
			var picId = $con.attr('data-pic'),
				nodePic = this.$el.find('[data-pic='+ picId +']')[0],
				nodeLoc = con;
			this.$el.find('[data-value=center]').html(  '&gt;' + nodePic.childNodes[2].nodeValue );
			this.$el.find('[data-value=right]').html(  '&gt;' + nodeLoc.childNodes[2].nodeValue );
			var	// 获取左侧所有摄像头
				$cameras = $con.parent().next().find('[data-vid]'),
				// 区域摄像头集合
				areaCameras = [];
			if ( $cameras.length == 0 ) {
				UI.alert({ message: '此区域暂无摄像头信息', type: 'warning'});
				return;
			};
			// 获取摄像头
			$cameras.each(function(i){
				areaCameras.push( self.cameras[ this.getAttribute('data-vid') ] );
			});
			if ( !self.videoControlIns ) {
				self.videoControlIns = VideoControl.init( self.DOMid );
			}
			self.videoControlIns.playlive( areaCameras );
		},
		/**
		 * 改变建筑同时小地图做出相应的改变
		 * @param  {object} event 事件对象
		 * @return {undefind}     no return
		 */
		refresh: function( event ) {
			var $con = $(event.currentTarget),
				method = $con.attr('data-fun');
			// 加上class
			$con.find('>i').addClass('fa-spin');
			// 执行刷新
			this[ method ].call(this);
		},
		/**
		 * 销毁回收各变量
		 * @return {[type]} [description]
		 */
		destory: function() {
			console.log( ws, $('#vid-frame-container') );
			$('#vid-frame-container').remove();
			clearInterval( timer );
			timer = null;
			if ( ws ) {
				ws.close();
				ws = null;
			}
			this.videoControlIns ? this.videoControlIns = null : '';
		}
	});

	// 人员模型
	var person = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			
		}
	});
	// 人员数据集合
	var persons = new (Backbone.Collection.extend({
		model: person,
		url: Global.path + '/main/findPeopleInfoByIdOrName.do'
	}))();


	// 初始化
	var init = function( id ) {
		if ( !view.ins ) {
			view.ins = new view;
		}
		view.ins.load( id );
	};

	realtimeMonitor.init = init;
	realtimeMonitor.view = view;

	return realtimeMonitor;
});
