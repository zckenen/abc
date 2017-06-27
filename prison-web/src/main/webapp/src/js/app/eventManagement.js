/* 民警管理模块 */
/* eventManagement */
define(['global', 'pagination', 'areaLinkpage', 'overview'], function(Global, Pagination, AreaLinkpage, Overview){
	var eventManagement = {

	};
	// 默认状态
	var status = 'all'
	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id'
	});

	// 数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		// 模型名字
		modelName: 'data',
		modelSubName: 'data',
		modelTreName: 'list'
	}))();

	// 视图
	var view = Backbone.View.extend({
		el: '#eventManagement',
		events: {
			// 搜索
			'click.search [data-event=search]': 'search',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 类型切换
			'click.toggle [data-event=toggle]': 'toggle',
			// 点击查看损坏报警
			'click.breakEvent2 [data-event=breakEvent2]': 'breakEvent2',
		},
		initialize: function() {
			this.$el = $(this.el);
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 初始化排序
			this.initSort();
			// 获取并渲染数据
			this.list(1);
			// 处理iselect
			UI.iselect( this.$form.find('select') );
			// 时间处理
			 this.$form.find('.datetimepciker').datetimepicker({
				 minView: "month", //选择日期后，不会再跳转去选择时分秒
				 endDate : new Date(),
				 todayBtn: true 
			 });
		},
		/**
		 * 按关键字搜索
		 * @return {[type]} [description]
		 */
		search: function() {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(1, param);
		},
		/**
		 * 刷新当前页面
		 * @return {[type]} [description]
		 */
		refresh: function() {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(this.pageNo, param);
		},
		/**
		 * 切换
		 * @return {[type]} [description]
		 */
		toggle: function( event ) {
			status = event.currentTarget.getAttribute('data-status');
			// 读取列表
			var param = this.searchFormData();
			// 获取列表数据
			this.list(1, param);
		},
		// 获取列表数据
		// @pageNo 页码
		list: function(pageNo, param) {
			var self = this,
				// 列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize, warType: '' };
			// 扩展搜索条件
			param ? data = $.extend(data, param) : data = $.extend(data, self.searchFormData());
			// 当前页面用于刷新
			self.pageNo = pageNo;
			// 搜索条件
			data = $.extend(data, param || {});
			// 状态判断
			if ( status == 'all' ) {
				var $container = self.$el.find('#all-warning');
				data.warType = '';
			} else if ( status == 0 ) {
				var $container = self.$el.find('#adv-warning');
				data.warType = 0;
			} else if ( status == 1 ) {
				var $container = self.$el.find('#tell-warning');
				data.warType = 1;
			}	
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/rule/warSimpleResult/list';
			self.collection.fetch({
				data: data,
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render( $container.find('tbody'), data );
					// 处理分页
					self.pagination({
						codes: self.parsePage(data.data.data), 
						$el: $container.find('.pagination-container'),
						hash: 'event/management/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
					// 更新统计数量
					try {
						if ( status == 'all' ) {
							self.$el.find('[data-value=allWarning]').html( data.data.typeALL );
							self.$el.find('[data-value=advWarning]').html( data.data.type0 );
							self.$el.find('[data-value=tellWarning]').html( data.data.type1 );
						}
					} catch(e) {

					}
					
				}
			});
		},
		/**
		 * 渲染报警结果
		 * @param  {Object} $container 列表容器
		 * @param  {Object} data       数据
		 * @return {[type]}            [description]
		 */
		render: function( $container, data ) {
			var self = this,
				// 渲染内容
				content = '',
				// 列表内容
				list = data.data.data.list;
			// 遍历拼接内容
			list && list.forEach(function(item, i){
				item.index = ++i;
				content += template( 'eventManagementListTpl', item );
			});
			// 插入渲染容器中
			$container.html( content );
			// 提示框
			UI.tooltips( $container.find('[data-toggle=tooltip]') );
		},
		/**
		 * 查看损坏的手环
		 * @param {Objecct} event 事件对象
		 * @return {[type]} [description]
		 */
		breakEvent2: function(event) {
			//console.log('www');
			/*Overview.topWarView.ins.breakEvent(event);*/
			var self = this,
			// dom元素
			$con = $(event.currentTarget),
			// 获取数据id
			id = $con.attr('data-id'),
			watNum = $con.attr('data-num'),
			temp = {};
			// 弹窗容器
			$container = $('#topWarBreak');
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				data: {watNum: watNum},
				type: 'post'
			}).done(function(data){
				temp.data= data.data;
		    });
		// 获取人员详情
		$.http({
			url: Global.path + '/rule/warSimpleResult/getWarSimpleResultById',
			dataType: 'json',
			data: {id: id},
			type: 'post'
		},{
			url: Global.path + '/main/loadInfoByCondition.do',
			dataType: 'json',
			data: {watNum: watNum},
			type: 'post'
		}).done(function(d1,d2){
			if(d2[0].status === 0){
				temp.war = d1[0].data;
				temp.data= d2[0].data;
				console.log(temp);
				// 渲染
				$container.html(template('topWarBreakTpl2', temp)).addClass('enter show');
				self.list(self.pageNo);
			}
			//console.log(data);
		
		});
	}
	});

	eventManagement.model 		= model;
	eventManagement.collection  = collection;
	eventManagement.view 		= view;

	return eventManagement;
});