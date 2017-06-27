define(['global', 'pagination', 'areaLinkpage', 'receptorManagement'], function(Global, Pagination, AreaLinkpage, ReceptorManagement){
	var aerialManagement = {

	};

	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {   
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
		el: '#aerialManagement',
		events: {
			'click.import [data-event=import]': 'import',
			'click.scan   [data-event=scan]':   'scan',
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
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
			// 联动加载
			AreaLinkpage.init({
				$coo: this.$el.find('[data-name=s_cooId]'),
				$pic: this.$el.find('[data-name=s_picId]'),
				$loc: this.$el.find('[data-name=s_locId]'),
				handlezIndex: false
			});
			// 处理iselect
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
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
			data = $.extend(data, param)
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/recvunit/loadAdmRecvunitInfo.do';
			self.collection.fetch({
				data: data,
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render();
					// 处理分页
					self.pagination({
						codes: self.parsePage(data.data.data),
						$el: self.$el.find('.pagination-container'),
						hash: 'aerial/management/list/p'
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
				$container = this.$el.find('#aerialManagementList'),
				// 渲染内容
				content = '',
				// 模型
				model;
			// 遍历拼接内容
			$.each(this.collection.models, function(i){
				model = this.toJSON();
				model.index = ++i;
				if ( !model.id ) return true;
				content += template( 'aerialManagementListTpl', model );
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
		 * 修改天线
		 * @param  {[type]} event [description]
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

			//  获取数据集合
			self.collection.url = Global.path + '/recvunit/deleteAdmRecvunitInfoById.do'; 
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
			return false;
		}
	});

	// 添加
	var add = Backbone.View.extend({
		el: '#aerialManagementAdd',
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
				$coo: this.$el.find('[data-name=cooId]'),
				$pic: this.$el.find('[data-name=picId]'),
				$loc: this.$el.find('[data-name=loc]'),
				handlezIndex: true
			});
			// 处理iselect
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
			// 加载接收机
			ReceptorManagement.load( this.$el.find('[name=rcvId]'), this.model.get('rcv').id );
		},
		// 提交保存
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/recvunit/saveAdmRecvunitInfo.do';
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
		},
		// 显示当前视图
		show: function() {
			// UI渲染
			UI.dialog( this.$el );
		}
	});

	// 修改
	var edit = Backbone.View.extend({
		el: '#aerialManagementEdit',
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
			this.$el.find('.modal-body').html( template( 'aerialManagementEditTpl', this.model.toJSON() ) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 联动加载
			AreaLinkpage.init({
				$coo: this.$el.find('[data-name=cooId]'),
				cooId: this.model.get('coo').id,
				$pic: this.$el.find('[data-name=picId]'),
				picId: this.model.get('pic').id,
				$loc: this.$el.find('[data-name=locId]'),
				locId: this.model.get('loc').id,
				handlezIndex: true
			});
			// 处理iselect
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
			// 加载接收机
			ReceptorManagement.load( this.$el.find('[data-name=rcvId]'), this.model.get('rcv').id );
			
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
			collection.url = Global.path + '/recvunit/updateAdmRecvunitInfo.do';
			// 删除数据
			this.model.unset('rcv');
			this.model.unset('coo');
			this.model.unset('pic');
			this.model.unset('loc');
			this.model.unset('locId');
			this.model.unset('rcvId');
			console.log('this.model',this.model);
			// 写入数据
			collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.refresh();
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: data.msg });
					} else {
						// 失败提示
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}		
			});
	 	}
	});
	// 详情
	

	aerialManagement.model 		= model;
	aerialManagement.collection = collection;
	aerialManagement.view 		= view;
	aerialManagement.add 		= add;
	aerialManagement.edit 		= edit;

	return aerialManagement;
});