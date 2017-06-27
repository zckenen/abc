define(['global', 'videoControl'], function(Global, VideoControl){
	/**
	 * 追踪巡检
	 * @return {[type]} [description]
	 */
	var // 返回
		realtimeViptrack = { },
		// 基于小组的websocket连接
		ws = null,
		// 基于罪犯的巡检计时器
		timer = null,
		// 是否处于停止巡检状态
		isStop = true;

	var vipModel = Backbone.Model.extend({

	});

	var vipCollection = new (Backbone.Collection.extend({
		model: vipModel,
		// 模型名字
		modelName: 'data',
		modelSubName: 'data'
	}));

	// 视图
	var view = Backbone.View.extend({
		el: '#realtimeViptrack',
		events: {
			// 搜索人员
			'click.search [data-event=search]': 'search',
			// 防止冒泡
			'click.unbubble [data-event=unbubble]': 'unbubble',
			// // 将人员放入搜索框以便加入巡检列表
			'click [data-event=locate]': 'locate',
			// 将搜索框中的人物加入巡检列表中
			'click [data-event=push]': 'push',
			// 将列表中的人移除
			'click [data-event=remove]': 'remove',
			// 开始巡检
			'click [data-event=startTrack]': 'startTrack',
			// 停止巡检
			'click [data-event=stopTrack]': 'stopTrack'
		},
		initialize: function() {
			this.$el = $(this.el);
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
			// 开始结束按钮
			this.$start = this.$el.find('[data-event=startTrack]');
			this.$stop = this.$el.find('[data-event=stopTrack]');
		},
		/**
		 * 渲染初始重犯列表
		 * @return {[type]} [description]
		 */
		renderVips: function() {
			var self = this,
				content = '';
			vipCollection.url = Global.path + '/a/per/admCriminalList/findAll.do';
			vipCollection.fetch({
				type: 'post',
				success: function(collection, data, xhr) {
					_.each(vipCollection.models, function(model, i){
						var json = model.toJSON();
						content += template('realtimeVipListTpl', json);
					});
					// 插入文档
					self.$el.find('#vipTrackList').html( content ).css({
						maxHeight: $(window).height() - 280
					});
					// 开始按钮是否激活
					self.ifActive();
				}
			});
		},
		/**
		 * 判断列表中是否有人从而决定开始按钮的是否灰化
		 * @return {[type]} [description]
		 */
		ifActive: function() {
			if ( this.$el.find('#vipTrackList > .list').length === 0 ) {
				// 改变按钮状态
				this.$start.removeClass('active');
			} else {
				this.$start.addClass('active');
			}
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
				param = { condition: $.trim( $con.prev().val() ) };
			// 搜索获取
			$.http({
				url: persons.url,
				data: param,
				dataType: 'json',
				type: 'post'
			}).done(function( data ){
				var content = '';
				if ( !data.data ) {
					content += '<li>暂无搜索结果</li>';
				} else {
					// 加入数据集合中
					data.data.forEach(function(item){
						persons.add( new person( item ) );
						// 模板的拼接
						content += template( 'realtimeSearchTpl', item );
					});
					// 渲染
					$con.next().html( content ).show();
				}
			});
		},
		/**
		 * 定位人员在建筑的位置
		 * @param  {object} event 时间对象
		 * @return {undefined}    无返回
		 */
		locate: function( event ) {
			var con = event.currentTarget, 
				id = con.getAttribute('data-id'),
				person = persons.get( id ).toJSON();
			this.$el.find('[name=condition]').val( person.peoName ).attr('data-id', id);	
			$(con).closest('ul').hide();
			
		},
		/**
		 * 将搜索框中的人物加入巡检列表中
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		push: function( event ) {
			var self = this,
				$condition = this.$el.find('[name=condition]'),
				id = $condition.attr('data-id');
			if ( !id ) {
				UI.alert({ message: Global.lang.m23, type: 'danger', close: false });
				return;
			}
			// 获取人员数据
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				data: {id: id},
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				var	data = data.data,
					admCriminalList = { 
						pcoId: data.pco ? data.pco.id : '',
						ploId: data.plo ? data.plo.id : '',
						criNum: data.peoNum,
						impName: data.peoName,
						impIdcard: '00',
						watNum: data.watNum,
						impType: data.peoType
					};
				if (data.watNum == 0) {
					UI.alert({ message: '必须先绑定腕带,才能加入列表', type: 'danger', close: false });
					return;
				}
				if (self.$el.find('#vipTrackList').find('[data-watnum='+data.watNum+']').length > 0) {
					UI.alert({ message: '此人已在列表中', type: 'danger', close: false });
					return;
				}
				
				// 提交
				$.http({
					url: Global.path + '/a/per/admCriminalList/saveCriminal',
					data: JSON.stringify( admCriminalList ),
					contentType: 'application/json; charset=utf-8',
					type: 'post',
					dataType: 'json'
				}).done(function(data){
					if ( data.status == 0 ) {
						self.renderVips();
					}
				});
			});
		},
		/**
		 * 移除巡检列表中的人
		 * @return {[type]} [description]
		 */
		remove: function( event ) {
			var self = this,
				con = event.currentTarget,
				id = con.getAttribute('data-id'),
				model = vipCollection.get( id );
			// 删除
			$.http({
				url: Global.path + '/a/per/admCriminalList/delete',
				type: 'post',
				dataType: 'json',
				data: {id: id}
			}).done(function(data){
				if ( !data.status ) {
					$(con).closest('.list').remove();
					// 判断是否激活
					self.ifActive();
					// 移除集合中的人员
					vipCollection.remove( model );
				}
			});
		},
		/**
		 * 销毁释放播放器
		 * @return {[type]} [description]
		 */
		destory: function() {
			$('#vid-frame-container').remove();
			if ( ws ) {
				ws.close();
				ws = null;
			}
			this.videoControlIns ? this.videoControlIns = null : '';
		},
		/**
		 * 初始化视频播放容器
		 * @return {[type]} [description]
		 */
		initPlayBox: function() {
			this.$video = this.$el.find('[data-view=video]');
			this.DOMid = 'vid-frame-container' ;
			// 计算播放窗口的高度
			// 设置video
			this.$video.css({
				height: $(window).height() - 70 ,
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
		 * 开始对列表中的人进行巡检
		 * @param {object} event 当前点击事件
		 * @return {[type]} [description]
		 */
		startTrack: function( event ) {
			var self = this,
				// 当前点击元素
				con = event.currentTarget,
				// 巡检频率
				rate = this.$el.find('[name=rate]').val(),
				// 人员手环数组
				watNums = [],
				// 人员名字数组
				names = [],
				// 人员计数
				i = 0,
				// 频率计数
				count = 0,
				// 第几轮计数
				times = 1;
			if ( !$(con).hasClass('active') ) return;
			// 禁止调整时间
			this.$el.find('[name=rate]').attr('disabled', true);
			this.$el.find('[data-name=remove]').attr('disabled', true);
			this.$el.find('[data-name=push]').attr('disabled', true);
			$(con).removeClass('active');
			self.$stop.addClass('active');
			// 切换状态
			isStop = false;
			// 改变按钮icont图标
			$(con).find('>i').html('&#xe68a;');
			// 遍历计算人员
			_.each(vipCollection.toJSON(), function(model,i){
				watNums.push( model.watNum );
				names.push( model.impName );
			});
				// 计算长度
			var len = watNums.length,
				// 人员id
				watNum = watNums[ i ];
			// 第一个人加上激活样式
			self.$el.find('[data-watnum='+ watNum +'].list')
					.addClass('active')
					.siblings('.list.active')
					.removeClass('active');
			// 当前正在巡检的人员名字
			self.$video.find('[data-name]').text( names[ 0 ] );
			// 总计人数
			self.$el.find('#num').text( len );
			// 轮询次数
			self.$el.find('#times').text( times );
			// ws推送
			lastLocId = null;
			ws = $.websocket("ws://"+ Global.host + Global.path +"/cameraServer.do", {
			 	open: function() {
			 		watNum != '0' ? ws.send( watNum ) : '';
			  	},
			  	message: function(response) {
			  		try{
						var data = JSON.parse( response.data ).data;
						var rsp = JSON.parse( response.data );
                        if(rsp.status==0){
                        	// 面包屑导航位置渲染
    						self.$el.find('#viptrackCrumbs').html( template('viptrackCrumbsTpl', data) );
    						// 上一秒的楼层id判断
    						if ( lastCooId != data.coo.id ) {
    							// 地图位置渲染
    							self.$thumb.css({
    								left: -data.coo.cooMainx + 156, // 120
    								top: -data.coo.cooMainy + 125 // 100
    							});
    							self.$point.css({
    								opacity: 1,
    								left: data.coo.cooMainx - 27,
    								top: data.coo.cooMainy - 27
    							}).find('[data-value=coo]').html( data.coo.cooName );
    							// 设置上一秒
    							lastCooId = data.coo.id;
    						}
    						// 上一秒的区域id判断
    						if ( lastLocId != data.id ) {
    							self.videoControlIns.playlive( data.camera );
    							// 设置上一秒的区域id
    							lastLocId = data.id;
    						}
                        }
                        else{
							UI.alert({ message: rsp.data, type: 'warning'});
							clearInterval( timer );
							timer = null;
						}
			  		} catch(e) {
			  			console.error( e );
			  		}
			  	},
			  	close: function() {
			  		console.log('track successfully disconnected')
			  	}
			});
			// 计时器
			if ( !timer ) {
				timer = setInterval(function(){
					++count;
					if ( count == rate ) {
						count = 0;
						 ++i 
						watNum = watNums[i];
						// 加上激活
						self.$el.find('[data-watnum='+ watNum +'].list')
								.addClass('active')
								.siblings('.list.active')
								.removeClass('active');
						// 当前正在巡检的人员名字
						self.$video.find('[data-name]').text( names[ i ] );
						//i++;
						
					}
					if ( i == len ) {
						i = -1;
						++times;
						// 第几轮轮询
						self.$el.find('#times').text( times );
						id = watNums[ 0 ];
						// 加上激活
						self.$el.find('[data-watnum='+ id +'].list')
								.addClass('active')
								.siblings('.list.active')
								.removeClass('active');
						// 当前正在巡检的人员名字
						self.$video.find('[data-name]').text( names[ 0 ] );
						i++;
					}
					// 获取推送数据
					watNum != '0'&&watNum != undefined ? ws.send( watNum ) : '';
				}, 1000);
			}	
				// 摄像头列表
			var	$video = self.$el.find('[data-view=video]'),
				// 上一秒的建筑id
				lastCooId,
				// 上一秒的区域id,用于判断罪犯是否移动区域
				lastLocId;
			// 初始化视频插件
			if ( !self.videoControlIns ) {
				self.videoControlIns = VideoControl.init( self.DOMid );
			}
		},
		/**
		 * 结束巡检
		 * @return {[type]} [description]
		 */
		stopTrack: function( event ) {
			var $stop = this.$stop;
			if ( !$stop.hasClass('active') ) return;
			// 禁止调整时间
			this.$el.find('[name=rate]').attr('disabled', false);
			this.$el.find('[data-name=remove]').attr('disabled', false);
			this.$el.find('[data-name=push]').attr('disabled', false);
			$stop.removeClass('active');
			$('#vid-frame-container').remove();
			this.videoControlIns ? this.videoControlIns = null : '';
			clearInterval( timer );
			timer = null;
			isStop = true;
			if ( ws ) {
				ws.close();
				ws = null;
			}
			// 初始化各参数
			this.$el.find('#times').text( 0 );
			// 去掉激活样式
			this.$el.find('[data-watnum].list').removeClass('active');
			// 改变按钮状态
			this.$start.addClass('active').find('>i').html('&#xe681;');
			if ( _.isObject( event ) ) {
				this.initPlayBox();
			}
		}
	});

	// 人员模型
	var person = Backbone.Model.extend({
		idAttribute: 'id'
	});
	// 人员数据集合
	var persons = new (Backbone.Collection.extend({
		model: person,
		url: Global.path + '/main/findPeopleInfoByIdOrName.do'
	}))();

	// 初始化
	var init = function() {
		!view.ins ? view.ins = new view : '';
		view.ins.initPlayBox();
		view.ins.renderVips();
	};

	realtimeViptrack.init = init;
	realtimeViptrack.view = view;
	realtimeViptrack.timer = timer;

	return realtimeViptrack;
});
