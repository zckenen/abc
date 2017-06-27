/* 罪犯分级模块 */
/* criminalGraded */
define(['global', 'pagination'], function(Global, Pagination){
	var criminalGraded = {};

	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {

		}
	});

	// 模型集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data'
	}))();

	// 视图
	var view = Backbone.View.extend({
		el: '#criminalGraded',
		events: {
			'click.add [data-event=add]': 'add',
			'click.edit [data-event=edit]': 'edit',
			'click.dels [data-event=dels]': 'dels'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
			this.template = _.template( $('#criminalGradedListTpl').html() );
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
			// 处理iselect
			UI.iselect( this.$el.find('.search select') );
		},
		list: function( pageNo ) {
			var self = this,
				// 列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize };
			// 搜索条件
			// 扩展搜索条件
			param ? data = $.extend(data, param) : data = $.extend(data, self.searchFormData());
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = self.form.action;
			self.collection.fetch({
				data: data,
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render();
					// 处理分页
					self.pagination({
						codes: data.codes, 
						$el: self.$el.find('.pagination-container'),
						hash: 'criminal/grade/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('tbody'),
				// 渲染内容
				content = '';
			// 遍历拼接内容
			$.each(this.collection.models, function(){
				content += self.template( this.toJSON() );
			});
			// 插入渲染容器中
			$container.html( content );
		},
		// 添加
		add: function() {
			if ( !add.ins ) {
				add.ins = new add();
			}
			add.ins.show();
		},
		// 修改
		edit: function() {
			// 获取要修改的id checkbox
			var $checked = this.$el.find('table>tbody :checked');
			// 判断长度
			if ( $checked.length !== 1 ) {
				UI.alert({ message: Global.code.common['msg-1'], type: 'warning' });
				return false;
			}
			// 获取要修改的id
			var id = $checked.val();
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
				UI.alert({ message: Global.code.common['msg-3'], type: 'warning'});
				return false;
			}

			//  获取数据集合
			self.collection.url = con.href;
			// 删除
			self.collection.deletes($checked, {
				success: function(data) {
					if( data.status == '0' ) {
						UI.alert({ message: Global.code.common['msg-5'] });
						self.list(1);
					} else {
						UI.alert({ message: Global.code.common['msg-6'] });
					}
				}
			});
			return false;
		}
	});

	// 添加
	add = Backbone.View.extend({
		el: '#criminalGradedAdd',
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
			collection.url = self.form.action;
			// 写入数据
			collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.render();
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.code.common['msg-4'] });
					} else {
						// 提示成功
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		},
		show: function() {
			UI.dialog( this.$el );
		}
	});

	// 编辑
	edit = Backbone.View.extend({
		el: '#criminalGradedEdit',
		events: {
			'submit.submit form': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 模板
			this.template = _.template( $('#criminalGradedEditTpl').html() );
		},
		//渲染
		// @id 数据ID
		render: function( id ) {
			this.model = this.collection.get( id );
			// 渲染
			this.$el.find('.modal-body').html( this.template( this.model.toJSON() ) );
			// 数据绑定
			this.addFormData();
			// UI select
			UI.iselect( this.$el.find('select'), {handlezIndex: true} );
			// 时间
			UI.datepicker( this.$el.find('.datepicker') );

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
			collection.url = this.form.action;
			// 写入数据
			collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						AreaBuilding.view.ins.render();
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.code.common['msg-6'] });
					} else {
						// 失败提示
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}		
			});
	 	}
	});


	criminalGraded.model 		= model;
	criminalGraded.collection 	= collection;
	criminalGraded.view 		= view;

	return criminalGraded;

});