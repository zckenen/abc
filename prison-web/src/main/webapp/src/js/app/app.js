define(['router', 'global'], function(Router, Global){
	// Backbone扩展
	// 出现没有捕获的未知异常
	var fail = function() {
		// 提示出现未知异常
		UI.alert({
			message: Global.lang.m0,
			type: 'danger',
			closeInSeconds: false
		});
	};
	// 回调执行
	var callback = function(options, self, data) {
		if ( options.success && options.context) {
			options.success.call( context, data );
		}  else if ( options.success ) {
			options.success.call( self, data );
		} else {
			return false;
		}
	};
	/**
	视图扩展
	*/
	$.extend(Backbone.View.prototype, {
		/**
		 * 初始化排序
		 * @return {[type]} [description]
		 */
		initSort: function() {
			var self = this,
				// 获取表单
				$form = self.$el.find('form'),
				// 获取排序顺序
				$sort = $form.find('[name=sortType]'),
				// 获取排序字段
				$column = $form.find('[name=sortColumn]');
			// 绑定排序
			self.$el.find('.sorting').on('click', function(){
				var $this = $(this),
					sort = $this.attr('data-sort'),
					column = $this.attr('data-column');
				// 设置字段
				$sort.val(sort);
				$column.val(column);
				// 重新获取列表
				self.search();
				// 改变排序与标识
				if (sort === 'desc') {
					$this.attr('data-sort', 'asc');
					$this.removeClass('asc').addClass('desc');
					$this.children('a').removeClass('asc').addClass('desc');
				} else {
					$this.attr('data-sort', 'desc');
					$this.children('a').removeClass('desc').addClass('asc');
				}
				// 其它还原
				$this.closest('th').siblings('th').find('.sorting').removeClass('desc asc');
			});
		},
		// 将表单元素添加到视图属性中
		addFormData: function() {
			var self = this;
			// 表单
			self.form = self.$el.find('form')[0];
			self.$form = $(self.form);
			// 表单元素
			self.elements = {};
			// 遍历讲表单元素放入
			$(self.form).find('[name]').each(function(){
				self.elements[ this.name ] = this;
			});
		},
		// 将搜索表单值更新到搜索条件中去
		searchFormData: function() {
			var self = this,
				// 表单元素name与value
				key, val;
			// 搜索条件
			this.condition = [];
			// 参数param
			param = {};
			// 遍历
			$.each(self.elements, function(){
				val = $.trim( this.value );
				key = this.name;
				if ( val != 'null' && val ) {
					// 放入条件中
					self.condition.push( {name: key, value: val} );
				}
				// 写入参数中
				param[ key ] = (val == 'null' ? '' : val);
			});
			return param;
		},
		// 将表单元素值更新到模型属性中
		setFormData: function() {
			var self = this;
			$.each(self.elements, function(){
				self.model.set(this.name, this.value === 'null' ? '' : this.value);
			});
		},
		// 调用jquery Validate 绑定数据验证
		validate: function() {
			$(this.form).validate({
				errorPlacement: function(error, element) {
					if ( element[0].tagName == 'SELECT' ) {
						error.appendTo( element.parent() );
					} else {
						error.insertAfter( element );
					}
				},
				highlight: function(element) {
					$(element).addClass('error-element');
				},
				success: function(error, element) {
					$(element).removeClass('error-element');
					error.remove();
				},
				rules: {
					cooId: {
						isnull: true
					},
					'coo.id': {
						isnull: true
					}
				}
			});
		},
		// 处理分页
		// @options => { codes: codes, $el: $el, hash: hash }
		// @codes 返回分页数据
		// @$el 分页视图
		// @hash 分页hash
		pagination: function(options, pagination) {
			// 实例化分页模型
			var model = new pagination.model( options.codes ); // new Model.pagination();
			// 设置hash
			model.set({ 
				hash: options.hash,
				// 如果无hash列表方法
				method: options.method || '',
				// 如果无hash上下文
				context: options.context || ''
			});
			// 实例化分页视图
			var view = new pagination.view({ model: model });
			// 设置分页视图容器jQery对象
			view.setElement( options.$el );
			// 渲染
			view.render();
		},
		/**
		 * 解析分页内容
		 * @param {object} data 分页内容
		 * @return {[type]} [description]
		 */
		parsePage: function(data) {
			return {
				PageCount: data.pages,
				Count: data.total,
				PageSize: data.pageSize,
				PageNo: data.pageNum,
				LastPage: data.prePage || 1,
				NextPage: data.nextPage || data.pages
			}
		}
	});
	/**
	数据集合扩展
	*/
	$.extend(Backbone.Collection.prototype, {
		// 插入一条数据
		insert: function( model, options ) {
			var self = this;
			// 默认请求参数
			var defaults = $.extend({
				dataType: 'json',
				type: 'post'
			}, options || {});
			// 发送请求
			$.http({
				url: self.url,
				dataType: defaults.dataType,
				data: model.toJSON(),
				type: defaults.type
			}).done(function(data){
				var temp = {};
				// 设置id属性 
				temp[ model.idAttribute ] = data.data;
				// 修改模型参数
				model.set( temp );
				// 将数据模型添加到模型集合
				self.unshift( model.toJSON() );
				// 判断是否需要删除最后一条
				if ( self.models.length > Global.pageSize ) {
					// 删除最后一条
					self.pop();
				}
				// 执行回掉函数
				return callback( options, self, data );
			}).fail( fail );
		},
		// 更新一条数据
		update: function( model, options ) {
			var self = this;
			// 默认请求参数
			var defaults = $.extend({
				dataType: 'json',
				type: 'post'
			}, options || {});
			// 发送请求
			$.http({
				url: self.url,
				dataType: defaults.dataType,
				data: model.toJSON(),
				type: defaults.type
			}).done(function(data){
				// 执行回掉函数
				return callback( options, self, data );
			}).fail( fail );
		},
		// 批量删除数据
		deletes: function($elems, options) {
			var ids = [];
			// 遍历id集合
			$elems.each(function(){
				ids.push( this.value );
			});
			// 请求删除数据
			$.http({
				url: this.url,
				dataType: 'json',
				data: {ids: ids.join()},
				type: 'post'
			}).done(function(data){
				return callback(options, self, data);
			}).fail( fail );
		},
		/**
		 * 删除单个数据
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		del: function(id, options) {
			$.http({
				url: this.url,
				dataType: 'json',
				data: {id: id},
				type: 'post'
			}).done(function(data){
				return callback(options, self, data);
			}).fail( fail );
		},
		/**
		 * 删除幢层区域单个数据
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		delArea: function(item, options) {
			$.http({
				url: this.url,
				dataType: 'json',
				data: item,
				type: 'post'
			}).done(function(data){
				return callback(options, self, data);
			}).fail( fail );
		}
	});

	// Backbone underscore 模板标记设置
	_.templateSettings = {
		evaluate: /<\-([\s\S]+?)\->/g,
		interpolate: /\{\{\=([\s\S]+?)\}\}/g,
		escape: /<\-\-([\s\S]+?)\-\->}/
	};
	// 去掉加载loading框
	var complete = function() {
		$('#loading').hide().removeClass('init').addClass('transparent');
	};
	return {
		init: function() {
			// 初始化UI组件
			Layout.init();
			// 去掉加载框
			complete();
			// 路由实例化
			Router.ins = new Router();
			// 开始历史记录及路由
			Backbone.history.start();
		}
	}
})