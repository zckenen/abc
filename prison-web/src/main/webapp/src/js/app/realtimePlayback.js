define(['global', 'videoControl'], function(Global, VideoControl){
	var // 返回
		realtimePlayback = { },
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

	// 视图
	var view = Backbone.View.extend({
		el: '#realtimePlayback',
		events: {
			// 搜索人员
			'click.search [data-event=search]': 'search',
			// 防止冒泡
			'click.unbubble [data-event=unbubble]': 'unbubble',
			// 改变建筑
			'click.change [data-event=change]': 'change',
			// 播放区域历史视频
			'click [data-event=playback]': 'playback',
			// 定位摄像头
			// 'click.framed [data-event=framed]': 'framed',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 所有摄像头数据
			this.cameras = {};
			// 幢层级
			this.$build = this.$el.find('[data-view=build]');
			// 处理容器大小
			Global.handleContainer();
			// 处理隐藏
			Layout.addClickHandler(function(){
				$('[name=condition]').nextAll('ul').hide();
			});
			// 时间处理
			UI.datetimepicker( this.$el.find('.datetimepicker') );
			// 渲染
			this.render();
			// 起始时间与结束时间
			this.$start = this.$el.find('[name=startTime]');
			this.$end = this.$el.find('[name=endTime]');
		},
		/**
		 * 渲染建筑
		 * @return {undefined} 无返回
		 */
		render: function() {
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
						//console.log('视频回放model',model);
						content += template( 'playbackBuildTpl', model );
						// 取出所有摄像头数据
						model.pictures && model.pictures.forEach(function(pic){
							pic.locareas&&pic.locareas.forEach(function(loc){
								loc.camera && loc.camera.forEach(function(camera){
									self.cameras[ camera.id ] = camera;
								});
							})
						});
					});
					self.$build.html( content );
					// 默认展开第一项，如果有指定id那么
					if ( self.cooId == 'all') {
						self.$build.find('a[data-index=0]').trigger('click');
					} else {
						self.$build.find('a[data-coo='+ self.cooId +']').trigger('click');
					}
					// 去掉刷新
					self.$el.find('.fa-spin').removeClass('fa-spin');
				}
			});
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
					cooId: self.cooId 
				};
			// 搜索获取
			self.fetch(param, function( data ){
				var content = '', model;
				// 遍历
				$.each(data, function(){
					// 模板的拼接
					content += self.searchTpl( this );
				});
				// 渲染
				$con.next().html( content ).show();
			});
		},
		/**
		 * 改变建筑同时小地图做出相应的改变
		 * @param  {object} event 事件对象
		 * @bool   {bool}   bool 用于判断是否是trigger触发
		 * @return {undefind}     no return
		 */
		change: function( event, bool ) {
			var // 当前建筑对象
				$con = $(event.currentTarget),
				// 数据索引
				id = $con.attr('data-coo'),
				// 建筑数据
				data = buildings.get( id ).toJSON(),
				// 该楼层第一层
				$floor = $con.closest('div').next().find('[data-pic]:first'),
				// 第一层的第一个区域
				$region = $floor.closest('div').next().find('[data-loc]:first');
			// 分别展开楼层以及下属区域
			if ( !bool ) {
				$floor.trigger('click');
			}
		},
		/**
		 * 初始化播放容器
		 * @return {[type]} [description]
		 */
		initPlayBox: function() {
			this.$video = this.$el.find('[data-view=video]');
			this.DOMid = 'vid-frame-container' ;
			// 设置video
			this.$video.css({
				height: $(window).height() - 70,
				width: $(window).width() - 325 - 70
			})
			// 创建播放容器
			var $frame = $('<div>');
			// 设置容器
			$frame.appendTo( this.$video )
				  .addClass('video-body')
				  .attr({
				  	id: this.DOMid
				  })
		},
		/**
		 * 实时播放视频
		 * @return {[type]} [description]
		 */
		playback: function( event ){
			var self = this,
				con = event.currentTarget,
				$con = $(con),
				$button = $con.prev();
			// 判断时间
			var startTime = $.trim( self.$start.val() ),
				endTime = $.trim( self.$end.val() );
			if ( !startTime || !endTime   ) {
				UI.alert({ message: Global.lang.m21, type: 'warning'});
				return;
			}
			if ( startTime > endTime ) {
				UI.alert({ message: Global.lang.m20, type: 'warning'});
				return;
			};

			// 改变右侧视频框的标题
			var picId = $con.attr('data-pic'),
				nodePic = this.$el.find('[data-pic='+ picId +']')[0],
				nodeLoc = con;
			this.$el.find('[data-value=center]').html( nodePic.childNodes[2].nodeValue );
			this.$el.find('[data-value=right]').html( nodeLoc.childNodes[2].nodeValue );
			// this.$el.find('[data-value=right]').html( con.childNodes[2].nodeValue );
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
			self.videoControlIns.playlive( areaCameras, 2, startTime, endTime );

			// 展开
			if ( !$button.hasClass('open') ) {
				$con.prev().trigger('click');
			}
		},
		/**
		 * 改变建筑同时小地图做出相应的改变
		 * @param  {object} event 事件对象
		 * @return {undefind}     no return
		 */
		refresh: function( event ) {
			var $con = $(event.currentTarget);
			// 加上class
			$con.find('>i').addClass('fa-spin');
			// 执行刷新
			this.render();
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


	// 初始化
	var init = function( id ) {
		if ( !view.ins ) {
			view.ins = new view;
		}
		view.ins.cooId = id || false;
		// 在初始化化视频窗口
		view.ins.initPlayBox();
	};

	realtimePlayback.init = init;
	realtimePlayback.view = view;

	return realtimePlayback;
});
