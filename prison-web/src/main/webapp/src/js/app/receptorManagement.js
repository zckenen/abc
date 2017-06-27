define(['global', 'pagination', 'areaLinkpage', 'dataserverManagement'], function(Global, Pagination, AreaLinkpage, DataserverManagement){
	var receptorManagement = {

	};

	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {
			rcvRem: '',
			rcvMac: '',
			coo: '',
			pic: '',
			loc: '',
			remarks: ''
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
		el: '#receptorManagement',
		events: {
			// 添加
			'click.add 	  [data-event=add]': 'add',
			// 修改
			'click.edit   [data-event=edit]': 'edit',
			// 删除
			'click.dels   [data-event=dels]': 'dels',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 搜索
			'click.search [data-event=search]': 'search'		
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
			// 联动加载
			AreaLinkpage.init({
				$coo: this.$el.find('select[data-name=cooId]'),
				$pic: this.$el.find('select[data-name=picId]'),
				$loc: this.$el.find('select[data-name=locId]'),
				handlezIndex: false
			});
			// 处理iselect
			UI.iselect( this.$el.find('.iselect') );
		},
		list: function(pageNo, param) {
			var self = this,
				// 获取列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize };
			// 扩展搜索条件
			param ? data = $.extend(data, param) : data = $.extend(data, self.searchFormData());
			// 当前页面用于刷新
			self.pageNo = pageNo;
			// 判断搜索条件
			data = $.extend(data, param || {});
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/receiver/loadAdmReceiverInfo.do';
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
						hash: 'receptor/management/list/p'
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
		 * 列表数据渲染
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
				model.index = ++i;
				if ( !model.id ) return true;
				!model.coo ? model.coo = 0 : '';
				!model.pic ? model.pic = 0 : '';
				!model.loc ? model.loc = 0 : '';
				content += template( 'receptorManagementListTpl', model );
			});
			// 插入渲染容器中
			$container.html( content );
		},
	
		// 添加
		add: function() {
			if ( !add.ins ) {
				add.ins = new add({model: new model()});
			}
			add.ins.show();
		},
		/**
		 * 接收机修改
		 * @param  {object} event 事件对象
		 * @return {[type]}       [description]
		 */
		edit: function( event ) {
			// 获取要修改的id
			var id = event.currentTarget.getAttribute('data-id');
			if ( !edit.ins ) {
				edit.ins = new edit({collection: collection});
			}
			edit.ins.render( id ).show();
		},
		// 删除数据
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
			// 确认删除
			UI.confirm(Global.lang.m2, function(){
				self.collection.url = Global.path + '/receiver/deleteAdmReceiverInfoById.do';
				// 删除
				self.collection.deletes($checked, {
					success: function(data) {
						if( data.status == '0' ) {
							UI.alert({ message: Global.m5 });
							self.list(1);
						} else {
							UI.alert({ message: data.msg });
						}
					}
				});
			});
			//  获取数据集合
			return false;
		}
	});

	// 添加
	var add = Backbone.View.extend({
		el: '#receptorManagementAdd',
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
			// 联动加载
			AreaLinkpage.init({
				$coo: this.$el.find('select[data-name=cooId]'),
				$pic: this.$el.find('select[data-name=picId]'),
				$loc: this.$el.find('select[data-name=locId]'),
				handlezIndex: false
			});
			// 处理iselect
			UI.iselect( this.$el.find('.select'), {handlezIndex: true} );
			// 加载DT服务器
			DataserverManagement.load( this.$el.find('select.rcvSerid') );
		},
		// 提交保存
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/receiver/saveAdmReceiverInfo.do';
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
		},
		// 显示当前视图
		show: function() {
			// UI渲染
			UI.dialog( this.$el );
		}
	});

	// 修改
	var edit = Backbone.View.extend({
		el: '#receptorManagementEdit',
		events: {
			// 提交保存
			'submit.submit form': 'submit',
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
		},
		//渲染
		// @id 数据ID
		render: function( id ) {
			this.model = this.collection.get( id );
			// 渲染
			this.$el.find('.modal-body').html( template( 'receptorManagementEditTpl', this.model.toJSON() ) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 联动加载
			AreaLinkpage.init({
				$coo: this.$el.find('[data-name=cooId]'),
				$pic: this.$el.find('[data-name=picId]'),
				$loc: this.$el.find('[data-name=locId]'),
				cooId: this.model.get('coo').id,
				picId: this.model.get('pic').id,
				locId: this.model.get('loc').id,
				handlezIndex: true
			});
			// 加载DT服务器
			DataserverManagement.load( this.$el.find('[data-name=serId]'), this.model.get('ser').id );
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
			collection.url = Global.path +  '/receiver/updateAdmReceiverInfo.do';
			// 删除数据
			this.model.unset('coo');
			this.model.unset('pic');
			this.model.unset('loc');
			this.model.unset('ser');
			// 写入数据
			collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.refresh();
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
	// 加载接收机
	var	load = function( $container, id ) {
		var // 参数
			param = {pageNo: 1, pageSize: 1000},
			// id
			id = id || false;
		// 获取数据
		collection.url = Global.path + '/receiver/loadAdmReceiverInfo.do';
		collection.fetch({
			data: param,
			type: 'post',
			success: function() {
				var content = '', model;
				// 遍历
				$.each(collection.models, function(){
					model = this.toJSON();
					content += '<option '+( id == model.id ? "selected": ""  )+' value='+ model.id +'>'+ model.rcvName +'</option>';
					
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

	receptorManagement.model 		= model;
	receptorManagement.collection 	= collection;
	receptorManagement.view 		= view;
	receptorManagement.add 			= add;
	receptorManagement.edit 		= edit;
	receptorManagement.load 		= load;

	return receptorManagement;
});