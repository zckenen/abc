define(['global', 'pagination', 'systemRole'], function(Global, Pagination, SystemRole){
	var systemUser = {}

	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {

		}
	});

	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		modelSubName: 'data',
		modelTreName: 'list'
	}));

	var view = Backbone.View.extend({
		el:'#systemUser',
		events: {
			// 添加用户
			'click [data-event=add]': 'add',
			// 修改用户
			'click [data-event=edit]': 'edit',
			// 删除用户
			'click [data-event=dels]': 'dels',
			// 锁定或解锁用户
			'click [data-event=lock]': 'lock',
			
		},
		initialize: function() {
			this.$el = $(this.el);
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
		},
		/**
		 * 列表
		 * @param  {int} pageNo 页码
		 * @param  {object} param  搜索参数
		 * @return {[type]}        [description]
		 */
		list: function(pageNo, param) {
		
			var self = this,
				// 列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize };
			// 扩展搜索条件
			param ? data = $.extend(data, param) : data = $.extend(data, self.searchFormData());
			console.log('list',param, self.searchFormData());
			// 当前页面用于刷新
			self.pageNo = pageNo;
			// 搜索条件
			data = $.extend(data, param)
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/a/sys/user/list';
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
						hash: 'system/user/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		/**
		 * 刷新当前页面
		 * @return {[type]} [description]
		 */
		refresh: function() {
			console.log('refresh');
			var param = this.searchFormData();
			// 获取列表数据
			this.list(this.pageNo, param);
		},
		/**
		 * 列表搜索
		 * @return {[type]} [description]
		 */
		search: function () {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(1, param);
		},
		/**
		 * 渲染
		 * @return {[type]} [description]
		 */
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('#systemUserList'),
				// 渲染内容
				content = '',
				// 模型
				model;
			// 遍历拼接内容
			_.each(this.collection.models, function(data, i){
				model = data.toJSON();
				model.index = ++i;
				content += template('systemUserListTpl',  model );
			});
			;
			// 插入渲染容器中
			$container.html( content );
		},
		/**
		 * 添加用户
		 * @param {[type]} event [description]
		 */
		add: function( event ) {
			if ( !add.ins ) {
				add.ins = new add({model: new model});
			}
			add.ins.show();
		},
		/**
		 * 修改用户
		 * @return {[type]} [description]
		 */
		edit: function( event ) {
			if ( !edit.ins ) {
				edit.ins = new edit({model: new model});
			}
			edit.ins.show( event.currentTarget.getAttribute('data-id') );
		},
		/**
		 * 锁定或解锁用户
		 * @return {[type]} [description]
		 */
		lock: function( event ) {
			var id = event.currentTarget.getAttribute('data-id'),
				flag = event.currentTarget.getAttribute('data-flag'),
				oldLoginName= event.currentTarget.getAttribute('data-oldLoginName');
			$.http({
				url: Global.path + '/a/sys/user/save',
				data: {
					id: id, 
					loginFlag: flag == 0 ? 1 : 0,
					'company.id': 1,
					'office.id': 1,
					oldLoginName: oldLoginName,
				},
				type: 'post',
				dataType: 'json'
			}).done(function(data){
				if ( data.status == '0' ) {
					view.ins.list(1,{});
					// 提示成功
					UI.alert({ message: data.msg });
				} else {
					// 提示成功
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			});
		}
	});

	var add = Backbone.View.extend({
		el: '#systemUserAdd',
		events: {
			'submit form': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
		}, 
		/**
		 * 显示弹窗
		 * @return {[type]} [description]
		 */
		show: function() {
			var self = this;
			// 获取角色数据
			SystemRole.load.call(this, function(collection, data, xhr){
				var $container = self.$el.find('#userRoleList'),
					content = '';
				_.each(data.data.data, function(model, i){
					content += template('userRoleListTpl', model);
				});
				$container.html( content );
				UI.dialog( this.$el );
			});
		},
		/**
		 * 提交
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/sys/user/save';
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.list(1,{});
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: data.msg });
					} else {
						// 提示成功
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		}
	});

	var edit = Backbone.View.extend({
		el: '#systemUserEdit',
		events: {
			// 修改用户
			'submit form': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
		},
		/**
		 * 显示弹窗
		 * @return {[type]} [description]
		 */
		show: function( id ) {
			var self = this,
				model = collection.get( id ).toJSON();
		//	model.oldLoginName = model.loginName;
		//	console.log('userEdit',model);
			this.$el.find('.modal-body').html( template('systemUserEditTpl', model) );
			// 获取角色数据
			SystemRole.load.call(this, function(collection, data, xhr){
				var $container = self.$el.find('#userRoleList'),
					content = '';
				_.each(data.data.data, function(model, i){
					content += template('userRoleListTpl', model);
				});
				$container.html( content );
				UI.dialog( this.$el );
			});

			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
		},
		/**
		 * 提交
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/sys/user/save';
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.list(1,{});
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: data.msg });
					} else {
						// 提示成功
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		}
	})

	systemUser.view = view;
	systemUser.model = model;
	systemUser.collection = collection;

	return systemUser;
});