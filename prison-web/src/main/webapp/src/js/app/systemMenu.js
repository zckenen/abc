define(['global'], function(Global){
	var systemMenu = {

	}
	var parseTree = function( collections ) {
		var first = [],
			second = [],
			third = [];

		var menus = {};

		_.each(collections, function(model, index, list){
			var data = model.toJSON();
			if ( data.parentId == '0' ) {
				meuns = data;
			} else if ( data.parentId == '1' ) {
				first.push( data );
				data.child = [];
			} else {
				data.ids = data.parentIds.split(',');
				data.ids.pop();
				data.ids.shift();
				if ( data.ids.length == 2 ) {
					second.push( data );
					data.child = [];
				} else if ( data.ids.length == 3 ) {
					third.push( data )
				}
			}
		});
		_.each(third, function(a){
			_.each(second, function(b){
				if ( a.parentId == b.id ) {
					b.child.push( a )
				}
			});
		});
		_.each(second, function(a){
			_.each(first, function(b){
				if ( a.parentId == b.id ) {
					b.child.push( a );
				}
			});
		});

		menus.child = first;

		return menus;
	};

	// 人员模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			
		}
	});

	// 人员数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		modelSubName: 'data',
		url: Global.path + '/a/sys/menu/list'
		// url: Global.path + '/src/mock/menu.json'
	}))();

	var menuTree = Backbone.View.extend({
		el: '#menuTree',
		events: {
			// 修改菜单
			'click.edit [data-event=edit]': 'edit',
			// dles
			'click.dels [data-event=dels]': 'dels'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
		},
		/**
		 * 获取菜单数据
		 * @return {[type]} [description]
		 */
		list: function() {
			var self = this;
			// 开启进度
			progress.start('L');
			// url切换
			self.collection.url = Global.path + '/a/sys/menu/list';
			// 获取数据
			self.collection.fetch({
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render();
					
					progress.end();
				}
			});
		},
		/**
		 * 渲染菜单树
		 * @return {[type]} [description]
		 */
		render: function() {
			$.jstree.destroy();
			
			var menus = parseTree( this.collection.models ),
				$container = $('#menuTreeList');
			// 
			$container.html( template('menuTreeListTpl', menus) );

			if ( !edit.ins ) {
				edit.ins = new edit({collection: collection});
			}
			edit.ins.render( 2 );

			UI.tree( $container );

		},
		/**
		 * 提交保存
		 * @return {[type]} [description]
		 */
		submit: function() {
			this.setFormData();

		},
		/**
		 * 编辑菜单
		 * @event 事件对象
		 * @return {[type]} [description]
		 */
		edit: function(event) {
			// 获取要修改的id
			var id = event.currentTarget.getAttribute('data-id');
			if ( !edit.ins ) {
				edit.ins = new edit({collection: collection});
			}
			edit.ins.render( id );
		},
		/**
		 * 删除当前菜单
		 * @return {[type]} [description]
		 */
		dels: function( event ) {
			UI.confirm(Global.lang.m14, function(){
				var id = event.currentTarget.getAttribute('data-id');
				// 删除
				$.http({
					url: Global.path + '/a/sys/menu/delete',
					data: {id: id},
					type: 'post',	
					dataType: 'json'
				}).done(function(data){
					if ( data.status == '0' ) {
						UI.alert({ message: Global.lang.m5 });
						$('#ui-tree-' + id).remove();
						$('#ui-tree-2').find('a').trigger('click');
					} else {
						UI.alert({ message: data.msg });
					}
				});
				// self.collection.deletes($checked, {
				// 	success: function(data) {
				// 		if( data.status == '0' ) {
				// 			UI.alert({ message: Global.code.common['msg-5'] });
				// 			self.list(1);
				// 		} else {
				// 			UI.alert({ message: Global.code.common['msg-8'] });
				// 		}
				// 	}
				// });
			});
		}
	});
	
	var edit = Backbone.View.extend({
		el: '#menuTreeDetail',
		events: {
			// 提交
			'click.submit [data-event=submit]': 'submit',
			// 添加子菜单
			'click.addSub [data-event=addSub]': 'addSub'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
		},
		/**
		 * 菜单修改详细信息
		 * @param  {[type]} id 主键id
		 * @return {[type]}    [description]
		 */
		render: function( id ) {
			this.model = this.collection.get( id );
			
			// 渲染
			this.$el.html( template('menuTreeDetailTpl', this.model.toJSON()) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			
			return this;
		},
		/**
		 * 提交
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			// 写入数据
			this.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/sys/menu/save';
		//	console.log('edit', this.model);
			// 写入数据
			collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						// 提示成功
						UI.alert({ message: Global.lang.m3 });
					} else {
						// 失败提示
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}	
			});
		},
		/**
		 * 添加子菜单
		 * @param {[type]} event [description]
		 */
		addSub: function( event ) {
			var parent = event.currentTarget.getAttribute('data-id');
			
			if ( !addSub.ins ) {
				var ins = new model();
				addSub.ins = new addSub({model: ins});
			}
			addSub.ins.model.set({'parent.id': parent})
			addSub.ins.show();
		}
	})

	var addSub = Backbone.View.extend({
		el: '#menuTreeAddSub',
		events: {
			'click.submit [data-event=submit]': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
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
			collection.url = Global.path + '/a/sys/menu/save';
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						menuTree.ins.list();
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
		},
		/**
		 * 显示当前视图
		 * @return {[type]} [description]
		 */
		show: function() {
			// UI渲染
			UI.dialog( this.$el );
		}
	})

	systemMenu.init = function() {
		if ( !menuTree.ins ) menuTree.ins = new menuTree({collection: collection});
		// 渲染
		menuTree.ins.list();
	}

	systemMenu.parseTree = parseTree;
	/**
	 * 外部加载菜单使用
	 * @param {object} callback 回掉函数执行
	 * @return {[type]} [description]
	 */
	systemMenu.load = function(callback) {
		var self = this;
		// url切换
		collection.url = Global.path + '/a/sys/menu/list';
		// 获取数据
		collection.fetch({
			type: 'post',
			success: function(collection, data, xhr) {
				callback.apply(self, arguments);
			}
		});
	}

	return systemMenu;
}); 