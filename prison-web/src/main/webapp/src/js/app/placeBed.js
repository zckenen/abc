define(['global', 'pagination', 'areaLinkpage'], function(Global, Pagination, AreaLinkpage){


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

	var view = Backbone.View.extend({
		el: '#placeBed',
		events: {
			// 添加床位
			'click.add [data-event=add]': 'add',
			// 修改床位
			'click.edit [data-event=edit]': 'edit',
			// 删除床位
			'click.del [data-event=del]': 'del',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 查询
			'click.search [data-event=search]': 'search'
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
		 * 获取列表数据
		 * @param  {[type]} pageNo [description]
		 * @param  {[type]} param  [description]
		 * @return {[type]}        [description]
		 */
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
			self.collection.url = Global.path + '/a/per/admBed/list';
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
						hash: 'place/bed/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		/**
		 * 列表渲染
		 * @return {[type]} [description]
		 */
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('tbody'),
				// 渲染内容
				content = '';
			// 遍历拼接内容
			this.collection.models.forEach(function(item, i){
				var model = item.toJSON();
				model.index = ++i;
				content += template( 'placeBedListTpl', model );
			})
			// 插入渲染容器中
			$container.html( content );
		},
		/**
		 * 刷新列表
		 * @return {[type]} [description]
		 */
		refresh: function() {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(this.pageNo, param);
		},
		/**
		 * 添加床位
		 */
		add: function() {
			// 判断是否实例化
			!Add.ins ? Add.ins = new Add({ model: new model() }) : '';
			// 显示当前弹出层
			Add.ins.show(); 
		},
		/**
		 * 单个删除
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		del: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			// 确认是否删除
			UI.confirm('', function(){
				self.collection.url = Global.path + '/a/per/admBed/delete';
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
		},
		/**
		 * 编辑床位
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		edit: function( event ) {
			// 获取要修改的id
			var id = event.currentTarget.getAttribute('data-id');
			// 判断视图实例化是否存在
			!Edit.ins ? Edit.ins =  new Edit({collection: collection}) : '';
			// 渲染
			Edit.ins.render( id );
			// 显示当前视图
			Edit.ins.show();
			// 当前数据
			var model = Edit.ins.model.toJSON();
		}
	})
	// 添加
	var Add = Backbone.View.extend({
		el: '#placeBedAdd',
		events: {
			// 提交保存
			'submit.submit form': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 绑定选择
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
			// 初始化三级联动
			AreaLinkpage.init({
				$coo: this.$el.find('[name=cooId]'),
				$pic: this.$el.find('[name=picId]'),
				$loc: this.$el.find('[name=locId]'),
				handlezIndex: true
			});
		},
		/**
		 * 显示添加页面
		 * @return {[type]} [description]
		 */
		show: function(){
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 弹出添加层
			UI.dialog( this.$el );
		},
		/**
		 * 提交
		 * @return {[type]} [description]
		 */
		submit: function(){
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/per/admBed/save';
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

	// 修改
	var Edit = Backbone.View.extend({
		el: '#placeBedEdit',
		events: {
			// 提交保存
			'submit.submit form': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 绑定选择
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
		},
		/**
		 * 渲染数据
		 * @param  {int} id 数据id
		 * @return {[type]}    [description]
		 */
		render: function( id ) {
			this.model = this.collection.get( id );
			// 渲染
			this.$el.find('.modal-body').html( template('placeBedEditTpl', this.model.toJSON()) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 初始化三级联动
			AreaLinkpage.init({
				$coo: this.$el.find('[name=cooId]'),
				cooId: this.model.get('coo').id,
				$pic: this.$el.find('[name=picId]'),
				picId: this.model.get('pic').id,
				$loc: this.$el.find('[name=locId]'),
				locId: this.model.get('loc').id,
				handlezIndex: true
			});
			// UI下拉框
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
		},
		/**
		 * 显示弹出层
		 * @return {[type]} [description]
		 */
		show: function(){
			UI.dialog( this.$el );
		},
	 	/**
	 	 * 提交保存数据
	 	 * @return {[type]} [description]
	 	 */
	 	submit: function() {
	 		var self = this;
			// 写入数据
			this.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/per/admBed/save';
			// 写入数据
			this.model.unset('coo');
			this.model.unset('pic');
			this.model.unset('loc');
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
	return {
		model: model,
		collection: collection,
		view: view
	}
});