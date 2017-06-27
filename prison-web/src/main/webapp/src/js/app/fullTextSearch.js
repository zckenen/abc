define(['global', 'activityLocus', 'overview'], function(Global, ActivityLocus, Overview){
	var fullTextSearch = {},
		// 循环检测计时器
		timer,
		// 是否处于请求中
		isRequest = false,
		// 上一次输入的值
		lastkey = false;
		// 调用历史记录
		record = [];
	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'peo_id',
		defaults: {
			cri_picpath: '',
			name: '',
			cri_charge: '',
			cri_startdate: '',
			peo_groupid: '',
			cri_sex: 0
		}
	});
	// 数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		url: Global.path + '/main/findPeopleInfoByIdOrName.do'
	}))();

	// 视图
	var view = Backbone.View.extend({
		el: '#fullTextSearch',
		events: {
			'click.all': 'unbubble',
			// 搜索框获得焦点
			'focus.focus [data-event=keyword]': 'focus',
			// 搜索框失去焦点
			'blur.blur [data-event=keyword]': 'blur',
			// 点击搜索
			'click.search [data-event=search]': 'list',
			// 清空关键字
			'click.clear [data-event=clear]': 'clear',
			// 删除历史
			'click.remove [data-event=remove]': 'recordRemove',
			// 查看详细
			'click.detail [data-event=detail]': 'detail',
			// 历史轨迹
			'click.locus [data-event=locus]': 'locus',
			// 显示与隐藏组织信息
			'click.slide [data-event=slide]': 'slide',
			'mousedown [data-event=unmove]': 'unmove',
		},
		initialize: function() {
			this.$el = $(this.el);
			// 搜索结果列表数据容器与模板
			var $result = this.$result = this.$el.find('#result');
			// this.resultTpl = _.template( $('#fullTextSearchTpl').html() );
			// 搜索框
			this.$condition = this.$el.find('[name=condition]');
			// 上一次的值
			lastkey = $.trim( this.$condition.val() );
			// 处理隐藏
			Layout.addClickHandler(function(){
				$result.hide();
			});
			// 实例化详细
			detail.ins = new detail();
		},
		/**
		 * [禁止冒泡]
		 * @return {[type]} [description]
		 */
		unbubble: function() {
			return false;
		},
		/**
		 * 当前input输入框获得焦点时,生成一个定时器,定时检测input中的值
		 * 每隔一秒钟将检测到的值向后台请求搜索数据
		 * @param  {object} event [事件对象]
		 * @return {false}    [禁止冒泡]
		 */
		focus: function( event ) {
			var self = this;
			// 读取历史记录
			self.recordRead();
			// 如果定时器不存在新建定时器
			if ( !timer ) {
				timer = setInterval(function(){
					// 如果处于请求中那么不再次执行请求
					if ( !isRequest ) {
						var key = $.trim( self.$condition.val() );
						if ( key && key != lastkey ) {
							// 执行搜索
							self.search({condition: key});
							// 更换lastkey
							lastkey = key;
							// 显示X
							self.$condition.next().show();
						} else {

						}
					};
				}, 1000);
			}
			return false;
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
		 * 点击搜索调用
		 * @return {[undefined]} [无返回值]
		 */
		list: function() {
			var key = $.trim( this.$condition.val() );
			// 调用搜索
			this.search({condition: key});
		},
		/**
		 * 清空关键字
		 * @return {undefined} 无返回
		 */
		clear: function() {
			this.$condition.val('').next().hide();
			this.$result.hide();
		},

		/**
		 * 清除历史记录
		 * @param  {object} event 事件对象
		 * @return {undefined}       无返回
		 */
		recordRemove: function( event ) {
			localStorage['SEARCH_RECORD'] = '';
			this.$result.hide();
		},
		/**
		 * 获取历史记录中的任务详情
		 * @id {int} 数据主键id
		 * @return {object} 指定id数据
		 */
		recordFetch: function( id ) {
			var res;
			$.each(this.records, function(){
				if ( this.peo_no == id ) {
					res = this;
					return false;
				}
			});
			return res;
		},
		/**
		 * 历史记录读取
		 * @return {undefined} 无返回
		 */
		recordRead: function() {
			var self = this,
				json = localStorage['SEARCH_RECORD'],
				content = '<li class="title">'+ Global.lang.m16 +'</li>';
			// 如果存在历史记录
			try {
				if( json != '' ) {
					json = JSON.parse( json );
					// 遍历
					json.forEach(function(item, i){
						content += template('fullTextSearchTpl', item);
					});
					content += '<li class="action"><a data-event="remove">'+ Global.lang.m17 +'</a></li>';
					// 渲染
					self.$result.show().find('>ul').html( content );
					// 结果
					self.records = json;
				}
			} catch(e) {
				console.log( e );
			}
			
		},
		search: function( param ) {
			var self = this,
				content = '<li class="title">无此人员信息</li>',
				model;
			// 请求
			isRequest = true;
			collection.fetch({
				data: param,
				type: 'post',
				success: function( models, data ) {
					if ( data.data ) {
						content = '';
						// 历史记录
						var record = [];
						// 遍历
						$.each(collection.models, function(){
							model = this.toJSON();
							if ( model.peoType != 3 ) {
								// 写入历史记录
								record.push( model );
								// 模板的拼接
								content += template( 'fullTextSearchTpl', model );
							}
						});
						localStorage['SEARCH_RECORD'] = JSON.stringify( record );
					}
					// 渲染
					self.$result.show().find('>ul').html( content );
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
		 * 查询人物详细
		 * @param  {object} event 时间对象
		 * @return {[undefined]}       [无返回]
		 */
		detail: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			
			this.fetch(id, function(model){
				// 复制到搜索框
				self.$condition.val( model.peoName );
				// 关闭列表
				self.$result.hide();
			});
		},
		// 历史轨迹
		locus: function( event ) {
			var ins = ActivityLocus.dialog.ins;
			// 判断
			if ( !ins ) {
				ins = ActivityLocus.dialog.ins = new ActivityLocus.dialog();
			}
			// 显示
			ins.show( event.currentTarget.getAttribute('data-id') );
		},
		/**
		 * 提供外部调用搜索
		 * @param  {object} id 人员peo_id 编号
		 * @param {fun} callback 回调
		 * @return {undefined}    无返回
		 */
		fetch: function( id, calllback ) {
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				data: {id: id},
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				var model = data.data;
				model.criSex = 1;
				// 调用详情
				detail.ins.render( model );

				calllback && calllback( model )
			});
		},
		slide: function() {
			var $view = $('#rightView');
			if ( $view.hasClass('show') ) {
				$view.removeClass('show');
			} else {
				$view.addClass('show');
			};

			$('#chartView').find('#container').addClass('none');
		}
	});

	// 详细
	var detail = Backbone.View.extend({
		el: '#personnelInfo',
		events: {
			'click.unbubble [data-event=unbubble]': 'unbubble',
			// 详细信息下拉
			'click.slide [data-event=slide]': 'slide',
			// 关闭
			'click.close [data-event=close]': 'close',
			// 历史范围
			'click.history [data-event=history]': 'history',
			//视频追踪
			'click.monitor [data-event=monitor]': 'monitor',
			// 刷新位置
			'click.refresh [data-event=refresh]': 'refresh'
		},
		initialize: function() {
			this.$el = $(this.el);
			// this.template = _.template( $('#').html() );
			// 详细信息容器
			this.$detail = $('#personnelDetail');
			// this.detail = _.template( $('#personnelDetailTpl').html() );
		},
		/**
		 * 防止冒泡
		 * @return {[type]} [description]
		 */
		unbubble: function() {
			return false;
		},
		/**
		 * 展开与收缩详细信息
		 * @return {undefined} 无返回
		 */
		slide: function() {
			var self = this;
			$.http({
				url: Global.path + '/main/selEventByPeoId.do',
				dataType: 'json',
				type: 'post',
				data: { id: this.model.id }
			}).done(function(data){
				self.$detail.find('>.layer-body').html( template('personnelDetailTpl', data.data[0]) );
				self.$detail.addClass('enter show')
				// 宽度
				var width = ($(window).width() - 90) / 2,
					left = parseInt( self.$el.css('left') ),
					top = parseInt( self.$el.css('top') );
				
				// 判断
				if ( left > width ) {
					self.$detail.css({
						left: left + 'px',
						top: top + 345 +'px'
					})
				} else {
					self.$detail.css({
						left: left + 'px',
						top: top + 345 + 'px',
					})
				}
			});
		},
		/**
		 * 关闭人物详细信息框
		 * @return {undefined} 无返回
		 */
		close: function() {
			this.$el.hide();
			this.$detail.hide();
		},
		/**
		 * 定位当前人所在的区域
		 * @return {undefined} 无返回
		 */
		locate: function( ) {
			var info = this.model.locInfo,
				x = info ? info.coo.cooMainx - 100 : 600,
				y = info ? info.coo.cooMainy - 20: 100,
				height = $(window).height() / 2;
			// 调整位置
			this.$el.css({
				left: x,
				top: y > height ? y - 400: y
			});
		},
		/**
		 * 右侧历史轨迹窗口
		 * @return {undefined} 无返回
		 */
		history: function() {
			// 右侧轨迹显示
			ActivityLocus.history.ins.load( this.model );
		},
		/**
		 * "视频追踪"按钮点击事件
		 */
		monitor: function(){
			$('.page-menu-list > li:nth-child(2) > a').trigger('click');	
		},
		/**
		 * 刷新位置
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		refresh: function( event ) {
			var $con = $(event.currentTarget);
			$con.addClass('fa-spin');
			setTimeout(function(){
				$con.removeClass('fa-spin');
			}, 2000);
		},
		/**
		 * 渲染详细
		 * @param  {object} model 人物数据对象
		 * @return {undefined}    无返回
		 */
		render: function( data ) {
			// 模型数据
			this.model = data;
			// 设置type
			this.model.type = true;
			// 渲染
			// 处理数据
			data.cri.criBrithday = (new Date( data.cri.criBrithday )).Format('yyyy-MM-dd');
			data.cri.criMonitoringtime = (new Date( data.cri.criMonitoringtime )).Format('yyyy-MM-dd');

			this.$el.html( template('personnelInfoTpl', data) ).draggable({
                handle: ".bubble-header"
			});
			// 定位
			this.locate( data );
			// 显示
			this.$el.show();
		},
		/**
		 * 防止冒泡
		 * @return {[type]} [description]
		 */
		unmove: function(e) {
			var e = e || window.e;
		}
			
	});
	// 初始化
	var init = function() {
		if ( !view.ins ) {
			view.ins = new view();
		}
	};

	fullTextSearch.model = model;
	fullTextSearch.collection = collection;
	fullTextSearch.view = view;
	fullTextSearch.detail = detail;
	fullTextSearch.init = init;

	return fullTextSearch;
})

