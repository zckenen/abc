define(['global', 'pagination'], function( Global, Pagination ){
	var criminalManagement = {

	};

	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		mobile: ''
	});

	// 数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		modelSubName: 'data',
		modelTreName: 'list'
	}))();


	// 视图
	var view = Backbone.View.extend({
		el: '#criminalManagement',
		events: {
			// 搜索
			'click.search [data-event=search]': 'search',
			// 同步
			'click [data-event=async]': 'async',
			// 罪犯详细
			'click [data-event=detail]': 'detail'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
			// 处理iselect
			UI.iselect( this.$el.find('.search select') );
		},
		// 获取列表数据
		// @pageNo 页码
		list: function(pageNo,param) {
			var self = this,
				// 列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize };
			// 搜索条件
			param ? data = $.extend(data, param) : data = $.extend(data, self.searchFormData());
			// 当前页面用于刷新
			self.pageNo = pageNo;
			// 判断搜索条件
			data = $.extend(data, param || {});
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/a/admCriminalInfo/list';
			self.collection.fetch({
				data: data,
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render();
					// 处理分页
					self.pagination({
						codes: self.parsePage( data.data.data ), 
						$el: self.$el.find('.pagination-container'),
						hash: 'criminal/management/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		/**
		 * 渲染列表
		 * @return {[type]} [description]
		 */
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('tbody'),
				// 渲染内容
				content = '';
				model;
			// 遍历拼接内容
			collection.forEach(function(item, i){
				model = item.toJSON();
				model.index = ++i;
				content += template('criminalManagementListTpl', model);
			});
			// 插入渲染容器中
			$container.html( content );
		},
		/**
		 * 民警搜索
		 * @return {[type]} [description]
		 */
		search:function () {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(1, param);
		},
		/**
		 * 同步罪犯
		 * @return {[type]} [description]
		 */
		async: function() {
			// 开启进度
			progress.start('L');
			$.http({
				url: Global.path + '/criminal/syncAdmCriminalInfo',
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				if (data.status == 0) {
					UI.alert({message: data.data});
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger'});
				}
			}).always(function(){
				// 关闭进度
				progress.end();
			});
		},
		/**
		 * 查看罪犯详细
		 * @return {[type]} [description]
		 */
		detail: function() {

		}
	});

	criminalManagement.model 		= model;
	criminalManagement.collection 	= collection;
	criminalManagement.view 		= view;
	

	return criminalManagement;
});