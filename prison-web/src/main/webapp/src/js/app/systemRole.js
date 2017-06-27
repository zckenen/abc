define(['global', 'init', 'pagination', 'systemMenu'], function(Global, Init, Pagination, SystemMenu){
	var systemRole = {};

	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			
		}
	});

	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		modelSubName: 'data'
	}))();

	var view = Backbone.View.extend({
		el: '#systemRole',
		events: {
			// 设置权限
			'click [data-event=setActionPower]': 'setActionPower',
			// 设置人员
			'click [data-event=setPerson]': 'setPerson',
			// 角色添加
			'click [data-event=add]': 'add',
			// 编辑
			'click [data-event=edit]': 'edit',
			// 删除
			'click [data-event=del]': 'del'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
			// this.template = _.template( $('#dataserverManagementListTpl').html() );
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
			// 当前页面用于刷新
			self.pageNo = pageNo;
			// 搜索条件
			data = $.extend(data, param);
			// 开启进度
			progress.start('L');
			// 设置url
			self.collection.url = Global.path + '/a/sys/role/list';
			// 获取数据
			self.collection.fetch({
				data: data,
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render();
					// // 处理分页
					// self.pagination({
					// 	codes: data.codes, 
					// 	$el: self.$el.find('.pagination-container'),
					// 	hash: '#system/role/p'
					// }, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		/**
		 * 渲染数据
		 * @return {[type]} [description]
		 */
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('tbody'),
				// 渲染内容
				content = '',
				// 模型
				model;
			// 遍历拼接内容
			_.each(this.collection.models, function(data, i){
				model = data.toJSON();
				model.index = ++i;
				content += template( 'systemRoleListTpl', model );
			});
			// 插入渲染容器中
			$container.html( content );

			UI.tooltips( $container.find('[data-toggle=tooltip]') );
		},
		/**
		 * 设置角色菜单权限
		 * @param {[type]} event [description]
		 */
		setActionPower: function( event ){
			if ( !setActionPower.ins ) {
				setActionPower.ins = new setActionPower({model: new model});
			}
			setActionPower.ins.render( event.currentTarget.getAttribute('data-id') );
		},
		/**
		 * 设置数据权限
		 * @param {[type]} event [description]
		 */
		setDataPower: function( event ) {

		},
		/**
		 * 设置角色所属人员
		 * @param {[type]} event [description]
		 */
		setPerson: function( event ) {
			setPerson.ins.show();
		},
		/**
		 * 角色添加
		 */
		add: function(  ) {
			if ( !add.ins ) {
				add.ins = new add({model: new model});
			}
			add.ins.show();
		},
		/**
		 * 编辑角色
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		edit: function( event ) {

		},
		/**
		 * 删除角色
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		del: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			// 确认是否删除
			UI.confirm(Global.lang.m15, function(){
				//  获取数据集合
				self.collection.url = Global.path + '/a/sys/role/delete';
				// 删除
				self.collection.del(id, {
					success: function(data) {
						if( data.status == '0' ) {
							UI.alert({ message: Global.lang.m5 });
							self.list(1);
						} else {
							UI.alert({ message: data.msg });
						}
					}
				});
			});
		}
	});


	var setActionPower = Backbone.View.extend({
		el: '#setActionPower',
		events: {
			'click.submit [data-event=submit]': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
		},
		/**
		 * 获取角色关联菜单
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		render: function( id ) {
			var self = this,
				$container = this.$el.find('.modal-body');
			$.http({
				url: Global.path + '/a/sys/role/form',
				data: {id: id},
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				var role = data.data.role;
			//	self.model.set({oldName: self.model.attributes.name });
				//role.oldName = role.name;
				//console.log('role',role);
				// 摧毁树
				$.jstree.destroy();
				// 解析树
				role.child = Init.parseMenu( data.data.menuList, data.data.role.menuIds.split(',') );
				// 渲染树
				$container.html( template('setActionPowerTpl', role) );
				// 插件展示树
				UI.tree($container.find('#tree'), {plugins: ['wholerow', 'checkbox', 'types']}, function(e, data){
					
				})
				UI.dialog( self.$el );
				// 数据绑定
				self.addFormData();
				// 数据验证
				self.validate();
			});
			
		},
		/**
		 * 提交保存
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/sys/role/save';
			// 获取菜单树
			var menuIds = [];
			this.$el.find('#tree').find('a.jstree-clicked').each(function(){
				menuIds.push( this.getAttribute('data-id') );
			});
			if(menuIds.length===0){
				UI.alert({ message: '请至少选择一个角色菜单！', type: 'danger', container: self.$el.find('.alert-container') });
				return false;
			};
		//	self.model.set({oldName: self.model.attributes.name });
			self.model.set({menuIds: menuIds.join(',')});
			//console.log('self.model',self.model);
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.list(1);
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

	var setPerson = Backbone.View.extend({
		el: '#setPerson',
		events: {

		},
		initialize: function() {
			this.$el = $(this.el);
		},
		show: function() {
			UI.dialog( this.$el );
		}
	})

	var add = Backbone.View.extend({
		el: '#systemRoleAdd',
		events: {
			// 添加一个角色
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
		 * 显示添加页面
		 * @return {[type]} [description]
		 */
		show: function() {
			SystemMenu.load.call(this, function(collection, data, xhr){
				$container = this.$el.find('#tree');
				// 摧毁树
				$.jstree.destroy();
				var menus = {};
				// 解析树
				menus.child = Init.parseMenu( data.data.data );
				// 渲染树
				$container.html( template('roleMenuTreeTpl', menus) );
				// 插件展示树
				UI.tree($container, {plugins: ['wholerow', 'checkbox', 'types']}, function(e, data){
					
				});
				UI.dialog( this.$el );
			});
		},
		/**
		 * 保存新增角色
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/sys/role/save';
			// 获取菜单树
			var menuIds = [];
			this.$el.find('#tree').find('a.jstree-clicked').each(function(){
				menuIds.push( this.getAttribute('data-id') );
			});
//			self.model.set({oldName: self.model.attributes.name });
			
			if(menuIds.length===0){
				UI.alert({ message: '请至少选择一个角色菜单！', type: 'danger', container: self.$el.find('.alert-container') });
				return false;
			};
			self.model.set({menuIds: menuIds.join(',')});
			//console.log('model',self.model,menuIds);
			
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.list(1);
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.lang.m4 });
					} else {
						// 提示成功
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		}
	});
	
	/**
	 * 外部加载角色使用
	 * @param {object} callback 回掉函数执行
	 * @return {[type]} [description]
	 */
	systemRole.load = function(callback) {
		var self = this;
		// url切换
		collection.url = Global.path + '/a/sys/role/list';
		// 获取数据
		collection.fetch({
			type: 'post',
			success: function(collection, data, xhr) {
				callback.apply(self, arguments);
			}
		});
	}

	systemRole.model 		= model;
	systemRole.collection 	= collection;
	systemRole.view 		= view;
	systemRole.add 			= add;

	return systemRole;
});