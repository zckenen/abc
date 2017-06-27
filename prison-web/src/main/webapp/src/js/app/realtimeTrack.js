define(['global', 'tripleNumberLink', 'createPerson'], function( Global, TripleNumberLink, CreatePerson ){
	var realtimeTrack = {

	}

	// 临时计时器
	var timer;

	var view = Backbone.View.extend({
		el: '#realtimeTrack',
		events: {
			// 开始
			'click.start [data-event=start]': 'start',
			// 结束
			'click.stop [data-event=stop]': 'stop'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 追踪容器与模板
			this.$trackRange = this.$el.find('#container');
			this.trackRangeTpl = _.template( $('#trackRangeTpl').html() );
			// 区域模板容器
			// 头部容器以及模板
			this.$head = this.$el.find('#head');
			this.headTpl = _.template( $('#trackHeaderTpl').html() );
			// 区域与人员模板
			this.regionTpl = _.template( $('#trackRegionTpl').html() );
			this.personTpl = _.template( $('#trackPersonTpl').html() );
			// 处理容器大小
			Global.handleContainer();
			// 地图容器
			this.$map = this.$el.find('#map');
			this.$mapContainer = this.$el.find('#map-container');
			this.realWidth = $(window).width() - 400;
			this.realHeight = $(window).height() - 100;
			this.$mapContainer.css({
				width: this.realWidth,
				height: this.realHeight
			})
			
		},
		/**
		 * 获取人物详细信息
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		fetch: function( id ) {
			var self = this;
			// 人物id
			self.peo_no = id;
			//人物详细
			$.http({
				url: Global.path + '/main/loadInfoByPeono.do',
				data: {peo_no: id},
				dataType: 'json',
				type: 'post'
			}, {
				url: Global.path + '/main/loadWarInfoById.do',
				data: {nwar_no: 17},
				dataType: 'json',
				type: 'post'
			}).done(function(d1, d2){
				var info = d1[0].data;
				// 加载联动
				TripleNumberLink.multiple({
					$subdistrict: self.$el.find('[name=peo_loc]'),
					$group: self.$el.find('[name=groupid]'),
					$person: self.$el.find('[name=peo_no]'),
					peo_coo: info.peo_coo,
					peo_loc: info.peo_loc,
					groupid: info.peo_groupid,
					peo_no: id,
					handlezIndex: true,
					callback: self.changePerson
				});
				var model = d2[0].data[0];


				self.start();

				// 地图计算
				var img = new Image();
				img.onload = function() {
					self.imgWidth = img.width;
					self.imgHeight = img.height;
					// 地图容器
					self.$map.css({
						width: img.width,
						height: img.height,
						left: (self.realWidth - img.width) / 2 + 200,
						top: (self.realHeight - img.height) / 2,
						backgroundImage: 'url(' + Global.path + '/' + model.pic_path +')'
					}).removeClass('none');
					// 创建当前楼层的所有人员
					$.each(model.otherpeo, function(i) {
						self.createRegion(this, i);
						// CreatePerson.init( this.peoinfo, self.createRegion(this, i), self.personTpl, this.loc_sizey, this.loc_sizex );
					});
				};
				// 加载地图
				img.src = Global.path + '/' + model.pic_path;

			});
			// 清除临时记事起
			clearInterval( timer );
		},
		/**
		 * 创建区域
		 * @param  {[type]} model [description]
		 * @return {[type]}       [description]
		 */
		createRegion: function( model, i ) {
			var self = this,
				prefix = 'track-region',
				id = prefix + '-' + model.loc_id,
				$region = $( '#' + id );
			// 区域相关信息
			var y = model.loc_mainy,
				x = model.loc_mainx,
				l = model.loc_sizey,
				w = model.loc_sizex;
			// 判断区域是否存在
			if ( $region.length == 0 ) {
				// 创建并设置属性
				$region = $('<div>').attr({
					'class': 'region',
					id: id
				});
				//  加入地图
				$region.appendTo( self.$map );
				// 计算位置
				$region.html( self.regionTpl( model ) )
					   .css({
					   		width: w, 
							height: l,
							left: x - w / 2,
							bottom: y - l / 2,
							opacity: 1
					   	});
			} 
			// 设置事件与属性
			$region.attr({
				'data-event': 'list', 
				'data-index': i || false
			})
			return $region;
		},
		/**
		 * 改变人物
		 * @return {[type]} [description]
		 */
		changePerson: function(  ) {

		},
		/**
		 * 开始追踪
		 * @return {[type]} [description]
		 */
		start: function() {
			var self = this;
			// 请求获取当前任务的监听信息
			$.http({
				url: Global.path + '/selRealTimeDemo.do',
				dataType: 'json',
				type: 'post',
				data: { peo_no: this.peo_no }
			}).done(function( data ){
				$.each(data, function(){
					!this.war ? this.war = false : '';
				});
				self.$trackRange.html( self.trackRangeTpl(data) ); 
				//-----------------------------------------------
				//-----------------------------------------------
				var $pos = self.$el.find('#thumb');
				$pos.css({ 'left': '-1040px', 'top': '-400px' });
				// 时间计算
				// var i = 0, hour = 0, minute = 0, second = 0, time = '';
				// // 位置显示
				// var $pos = self.$el.find('#thumb');
				// $pos.css({ 'left': '-861px', 'top': '-119px' });
				// // 时间秒表
				// var $timecount = self.$el.find('#timecount');
				// //针对的特殊处理
				// var $box = self.$el.find('#historyResult'),
				// 	$first = $box.find('li[data-index=0]'),
				// 	$second = $box.find('li[data-index=1]'),
				// 	$third = $box.find('li[data-index=2]'),
				// 	$fourth = $box.find('li[data-index=3]');
				// // 显示第一条
				// $first.removeClass('none').addClass('active live');
				// // 创建计时器
				// timer = setInterval(function(){
				// 	if ( second >= 60 ) {
				// 		minute++;
				// 		second = 0;
				// 	}

				// 	if ( minute >= 60 ) {
				// 		hour++;
				// 		minute = 0;
				// 	}

				// 	// 判断
				// 	time = (hour < 10 ? "0" + hour.toString() : hour) + ":";
				// 	time += (minute < 10 ? "0" + minute.toString() : minute) + ":";
				// 	time += (second < 10 ? "0" + second.toString() : second);
				// 	// 时间自增
				// 	$timecount.html( time  );
				// 	// 判断时间点
				// 	if ( i > 10 && i < 30 ) {
				// 		$first.removeClass('active live')
				// 			  .find('#timeend')
				// 			  .removeClass('none')
				// 			  .end()
				// 			  .find('#timenum')
				// 			  .removeClass('none');
				// 		// 第二时时间点开始执行
				// 		$second.removeClass('none').addClass('active live');
				// 		$pos.css({ 'left': '-461px', 'top': '-75px' });
				// 	} else if ( i >= 30 && i <= 40) {
				// 		$second.removeClass('active live')
				// 			  .find('#timeend')
				// 			  .removeClass('none')
				// 			  .end()
				// 			  .find('#timenum')
				// 			  .removeClass('none');
				// 		// 第二时时间点开始执行
				// 		$third.removeClass('none').addClass('active live');
				// 		$pos.css({ 'left': '-461px', 'top': '-219px' });
				// 	} else if  ( i > 40 && i < 50 ) {
				// 		$third.removeClass('active live')
				// 			  .find('#timeend')
				// 			  .removeClass('none')
				// 			  .end()
				// 			  .find('#timenum')
				// 			  .removeClass('none');
				// 		// 第二时时间点开始执行
				// 		$fourth.removeClass('none').addClass('active live');
				// 		$pos.css({ 'left': '-72px', 'top': '-374px' });
				// 	} else if ( i >= 50 ) {
				// 		clearInterval( timer );
				// 		timer = null;
				// 	}
					
				// 	// 自增
				// 	second++;
				// 	i++;
				// }, 1000);
			});
		},
		/**
		 * 停止
		 * @return {[type]} [description]
		 */
		stop: function() {

		},
		/**
		 * 改变人物
		 * @return {[type]} [description]
		 */
		change: function( event ) {
			console.log( event );
		}
	});

	// 初始化
	var init = function( id ) {
		if ( !view.ins ) {
			view.ins = new view;
		}
		// 获取当前人员信息
		view.ins.fetch( id );

		// 视频播放
		$.each(view.ins.$el.find('video'), function(){
			this.play();
		});
	};

	realtimeTrack.init = init;
	realtimeTrack.view = view;

	return realtimeTrack;
});