/* 民警规则管理模块 */
/* RulePolice */
define(['global', 'pagination', 'ruleCriminal', 'areaRegion'], function(Global, Pagination, RuleCriminal, AreaRegion){
	// 罪犯类
	var rulePolice = {

	};

	// 模型
	var model = Backbone.Model.extend({

	});

	// 模型集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data'
	}))();

	// assets/json/RulePolice.json

	// 视图
	var view = Backbone.View.extend({
		el: '#rulePolice',
		events: {
			'click.edit [data-event=edit]': 'edit',
			'click.close [data-event=close]': 'close',
			'click.dels [data-event=dels]': 'dels'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
			this.template = _.template( $('#rulePoliceListTpl').html() );
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 获取并渲染数据
			this.list(1);
			// 初始化添加罪犯规则
			this.add();
		},
		// 获取列表数据
		// @pageNo 页码
		list: function(pageNo) {
			var self = this,
				// 列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize };
			// 搜索条件

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
						hash: 'rule/police/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		// 渲染
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('#rulePoliceContainer'),
				// 渲染内容
				content = '';
			// 遍历拼接内容
			$.each(this.collection.models, function(){
				content += self.template( this.toJSON() );
			});
			// 插入渲染容器中
			$container.html( content );
		},
		// 罪犯规则
		add: function() {
			if ( !add.ins ) {
				add.ins  = new add();
			}
		},
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
			// 判断视图实例化是否存在
			if ( !edit.ins ) {
				edit.ins = new edit({collection: collection});
			}
			// 渲染
			edit.ins.render( id );  

			return false;
		},
		// 删除
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
						UI.alert({ message: Global.code.areaBuilding['msg-5'] });
						self.list(1);
					} else {
						UI.alert({ message: Global.code.areaBuilding['msg-6'] });
					}
				}
			});
			return false;
		},
		// 关闭tab
		close: function( event ) {
			var con = (event || window.event).target;
				// 获取tab
				$tab = $(con).closest('a');
			// 隐藏
			$tab.hide();
			// 显示列表
			$tab.closest('.nav-tabs').find('li:first > a').trigger('click');
			// 重新渲染列表
			this.render();

			return false;			
		}
	});
	// 添加罪犯规则
	var add = Backbone.View.extend({
		el: '#rulePoliceAdd',
		events: {
			// 区域范围设置
			'click.regionSet [data-event=regionSet]': 'regionSet',
			// 添加
			'click.submit [data-event=submit]': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 时间选择组件初始化
			UI.timepicker( this.$el.find('.timepicker') );
			// 下拉选择框
			UI.iselect( this.$el.find('select')  );
		},
		// 区域设置
		regionSet: function( event ) {
			var con = (event || window.event).target,
				ins;
			// 区域实例化
			if ( !RuleCriminal.regionSet.ins ) {
				ins = RuleCriminal.regionSet.ins = new RuleCriminal.regionSet({collection: AreaRegion.collection})
			};
			// 获取已选中的区域信息
			ins.getInfo( $(con).next() );
			// 渲染
			ins.list(1);
		},
		// 新增保存一条规则
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
						UI.alert({ message: Global.code.areaBuilding['msg-1'] });
					} else {
						// 提示成功
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		}
	});
	// 修改罪犯规则设置
	var edit = Backbone.View.extend({
		el: '#rulePoliceEdit',
		events: {
			// 区域范围设置
			'click.regionSet [data-event=regionSet]': 'regionSet',
			// 保存修改
			'click.submit [data-event=submit]': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 模板
			this.template = _.template( $('#rulePoliceEditTpl').html() );
		},
		render: function( id ) {
			var self = this,
				// 模型
				model = self.collection.get( id ),
				// tab
				$tab = $('[href$=tab-police-edit]');
			// 渲染
			this.$el.html( this.template( model.toJSON() ) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// UI iselect
			UI.iselect( this.$el.find('select') );
			// 切换显示
			$tab.show().trigger('click');
		},
		// 区域设置
		regionSet: function( event ) {
			var con = (event || window.event).target,
				ins;
			// 区域实例化
			if ( !RuleCriminal.regionSet.ins ) {
				ins = RuleCriminal.regionSet.ins = new RuleCriminal.regionSet({collection: AreaRegion.collection})
			};
			// 获取已选中的区域信息
			ins.getInfo( $(con).next() );
			// 渲染
			ins.list(1);
		},
		// 保存
		submit: function(){
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = self.form.action;
			// 写入数据
			collection.update(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						view.ins.render();
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.code.areaBuilding['msg-1'] });
					} else {
						// 提示成功
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		}
	});
	

	// 列表视图数据模型等
	rulePolice.model 		= model;
	rulePolice.collection 	= collection;
	rulePolice.view 		= view;
	rulePolice.add 			= add;

	return rulePolice;
});