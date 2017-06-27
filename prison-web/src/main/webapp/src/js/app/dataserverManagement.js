define(['global', 'pagination'], function(Global, Pagination){
	var dataserverManagement = {

	};
	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			ser_rem: ''
		}
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
		el: '#dataserverManagement',
		events: {
			// 添加
			'click.add [data-event=add]': 'add', 
			// 修改
			'click.edit [data-event=edit]': 'edit', 
			// 删除
			'click.dels [data-event=dels]': 'dels',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 搜索
			'click.search [data-event=search]': 'search'			
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
//			this.template = template( $('#dataserverManagementListTpl').html() );
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
			// 处理iselect
			UI.iselect( this.$el.find('.search select') );
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
			/*data = $.extend(data, param);*/
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/server/loadAdmServerInfo.do';
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
						hash: 'dataserver/management/list/p'
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
				$container = this.$el.find('tbody'),
				// 渲染内容
				content = '',
				// 模型
				model;
			
			// 遍历拼接内容
			$.each(this.collection.models, function(i){
				model = this.toJSON();
				if(!model.id){
					return true;
				}
				model.index = ++i;
				console.log(model);
				content += template('dataserverManagementListTpl',  model );
			});
			//console.log('content',content,model);
			
			// 插入渲染容器中
			$container.html( content ).find('[data-hover="dropdown"]').dropdownHover();
		},
		/**
		 * DT服务器添加
		 */
		add: function() {
			if ( !add.ins ) {
				add.ins = new add({model: new model()});
			}
			add.ins.show();
			
		},
		/**
		 * DT服务器修改
		 * @param {object} [event] 事件对象
		 * @return {[type]} [description]
		 */
		edit: function( event ) {
			
			// 获取要修改的id
			var id =  (event || window.event).currentTarget.getAttribute('data-id');
			//console.log('修改3332222',event.currentTarget,id);
			if ( !edit.ins ) {
				edit.ins = new edit({collection: collection});
			}
			edit.ins.render( id ).show();
		},
		/**
		 * 删除数据
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		dels: function( event ) {
			var self = this,
				con = (event || window.event).currentTarget,
				// 获取要删除的id checkbox
				$checked = this.$el.find('table>tbody :checked');
			// 判断长度
			if ( $checked.length === 0 ) {
				UI.alert({ message: Global.lang.m7, type: 'warning'});
				return false;
			}
			// 确认是否删除
			UI.confirm(Global.lang.m1, function(){
				//  获取数据集合
				self.collection.url = Global.path + '/server/deleteAdmServerInfoById.do';
				// 删除
				self.collection.deletes($checked, {
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
			
			return false;
		}
	});

	// 添加
	var add = Backbone.View.extend({
		el: '#dataserverManagementAdd',
		events: {

		},
		events: {
			'submit.submit form': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 处理iselect
			UI.iselect( this.$el.find('select'), {handlezIndex: true} );
		},
		// 提交保存
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/server/saveAdmServerInfo.do';
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.list(1);
						view.ins.render();
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
		// 显示当前视图
		show: function() {
			// UI渲染
			UI.dialog( this.$el );
		}
	});

	// 修改
	var edit = Backbone.View.extend({
		el: '#dataserverManagementEdit',
		events: {
			// 提交保存
			'submit.submit form': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 模板
			this.template = _.template( $('#dataserverManagementEditTpl').html() );
		},
		//渲染
		// @id 数据ID
		render: function( id ) {
			this.model = this.collection.get( id );
			// 渲染
			this.$el.find('.modal-body').html( this.template( this.model.toJSON() ) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// UI select
			UI.iselect( this.$el.find('select'), {handlezIndex: true} );

			return this;
		},
		// 弹出显示容器
		show: function(){
			UI.dialog( this.$el );
		},
	 	// 提交保存数据
	 	submit: function() {
	 		var self = this;
			// 写入数据
			this.setFormData();
			// 设置URL
			collection.url = Global.path + '/server/updateAdmServerInfo.do';
			// 写入数据
			collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.render();
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.lang.m3 });
					} else {
						// 失败提示
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}		
			});
	 	}
	});

	// 加载DT服务器
	var	load = function( $container, id ) {
		var // 参数
			param = {pageNo: 1, pageSize: 100},
			// id
			id = id || false;
		// 获取数据
		collection.url = Global.path + '/server/loadAdmServerInfo.do';
		collection.fetch({
			data: param,
			type: 'post',
			success: function() {
				var content = '', model;
				// 遍历
				$.each(collection.models, function(){
					model = this.toJSON();
					content += '<option '+( id == model.id ? "selected": ""  )+' value='+ model.id +'>'+ model.serName +'</option>';
				});
				// 渲染
				$container.html( content );
				// 查询选中项
				var txt = $container.find('option:selected').text();
				// 更改placehodler
				$container.attr('data-placeholder', txt);
				// UI select
				UI.iselect( $container, {handlezIndex: true} );
			}
		});
	};

	dataserverManagement.model 		= model;
	dataserverManagement.collection = collection;
	dataserverManagement.view 		= view;
	dataserverManagement.add 		= add;
	dataserverManagement.edit 		= edit;
	dataserverManagement.load 		= load;

	return dataserverManagement;
});