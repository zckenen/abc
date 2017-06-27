define(['global', 'pagination', 'areaLinkpage'], function(Global, Pagination, AreaLinkpage){
	var cameraManagement = {

	}

	var model = Backbone.Model.extend({
		idAttributes: 'id',
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
		el: '#cameraManagement',
		events: {
			// 添加摄像头
			'click [data-event=add]': 'add',
			// 编辑摄像头
			'click [data-event=edit]': 'edit',
			// 修改摄像头
			'click [data-event=del]': 'del',
			// 刷新
			'click [data-event=refresh]': 'refresh',
			// 搜索
			'click [data-event=search]': 'search'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
			// this.template = _.template( $('#dataserverManagementListTpl').html() );
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
			data = $.extend(data, param);
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/a/equ/admCameraInfo/list.do';
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
						hash: 'camera/management/list/p'
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
			$.each(this.collection.models, function(i){
				model = this.toJSON();
				if (model.id) {
					model.index = ++i;
					content += template( 'cameraManagementListTpl', model );
				}
			});
			// 插入渲染容器中
			$container.html( content );
		},
		/**
		 * 添加摄像头
		 */
		add: function() {
			if ( !add.ins ) {
				add.ins = new add({model: new model});
			}
			add.ins.show();
		},
		/**
		 * 编辑摄像头
		 * @param {object} [event] 事件对象
		 * @return {[type]} [description]
		 */
		edit: function( event ) {
			// 获取要修改的id
			var id = event.currentTarget.getAttribute('data-id');
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
		del: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			// 确认是否删除
			UI.confirm('', function(){
				self.collection.url = Global.path + '/a/equ/admCameraInfo/delete';
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
			
			return false;
		}
	});

	var add = Backbone.View.extend({
		el: '#cameraManagementAdd',
		events: {
			'submit form': 'submit',
			// 获取摄像头位置
			'click [data-event=handlePosition]': 'handlePosition'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 幢层区域联动
			AreaLinkpage.init({
				$coo: this.$el.find('[data-name=cooId]'),
				$pic: this.$el.find('[data-name=picId]'),
				$loc: this.$el.find('[data-name=locId]'),
				handlezIndex: true
			});
		},
		/**
		 * [show description]
		 * @return {[type]} [description]
		 */
		show: function() {
			UI.dialog( this.$el );
		},
		/**
		 * 提交保存摄像头
		 * @return {[type]} [description]
		 */
		submit: function(){
			var self = this;
			// 写入数据
			self.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/equ/admCameraInfo/save.do';
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
		/**
	 	 * 处理摄像头位置
	 	 * @param {object} event 事件对象
	 	 * @return {[type]} [description]
	 	 */
	 	handlePosition: function( event ) {
	 		this.image = this.$el.find('[data-name=picId]').find('option:selected').attr('data-pic');
	 		_position.call(this);
	 	}
	});

	var edit = Backbone.View.extend({
		el: '#cameraManagementEdit',
		events: {
			'submit form': 'submit',
			// 选取坐标点
			'click [data-event=handlePosition]': 'handlePosition'
		},
		initialize: function() {

		},
		/**
		 * 渲染修改数据
		 * @param  {int} id 摄像头id
		 * @return {[type]}    [description]
		 */
		render: function( id ) {
			this.model = this.collection.get( id );
			// 渲染
			this.$el.find('.modal-body').html( template( 'cameraManagementEditTpl', this.model.toJSON() ) );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
			// 数据联动
			// 幢层区域联动
			AreaLinkpage.init({
				$coo: this.$el.find('[data-name=cooId]'),
				$pic: this.$el.find('[data-name=picId]'),
				$loc: this.$el.find('[data-name=locId]'),
				cooId: this.model.get('coo').id,
				picId: this.model.get('pic').id,
				locId: this.model.get('loc').id,
				handlezIndex: true
			});
			return this;
		},
		show: function() {
			UI.dialog( this.$el );
		},
		/**
		 * 提交数据保存
		 * @return {[type]} [description]
		 */
	 	submit: function() {
	 		var self = this;
			// 写入数据
			this.setFormData();
			// 设置URL
			collection.url = Global.path + '/a/equ/admCameraInfo/save.do';
			// 写入数据
			self.model.unset('loc');
			self.model.unset('pic');
			self.model.unset('coo');
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
	 	},
	 	/**
	 	 * 处理摄像头位置
	 	 * @param {object} event 事件对象
	 	 * @return {[type]} [description]
	 	 */
	 	handlePosition: function( event ) {
	 		this.image = event.currentTarget.getAttribute('data-image');
	 		_position.call(this);
	 	}
	});

	/**
	 * 选取坐标位置
	 * @return {[type]} [description]
	 */
	var _position = function() {
		if ( !this.image ) {
			UI.alert({message: Global.lang.m18, type: 'warning'});
		} else {
			var self = this,
				// 创建容器
				$container = $('<div>'),
				// 创建关闭按钮元素
				$button = $('<a>'),
				// 创建摄像头元素
				$camera = $('<span>'),
				// 创建提示元素
				$tip = $('<div>'),
				// 创建图片实例
				image = new Image(),
				// 创建图片元素
				img = document.createElement('img'),
				// 窗口大小
				winWidth = $(window).width();
			    winHeight = $(window).height();
			// 图片加载
			image.onload = function() {
				width = image.width;
				height = image.height;
				// 计算比例
				//var scale = width / winWidth;
				var scale = height / winHeight;
				console.log('sssss');
				// 设置tip元素
				$tip.css({
					position: 'absolute',
					background: '#000',
					color: '#fff',
					left: 0,
					top: 0,
					padding: '5px 10px'
				}).appendTo( $container );
				// 设置摄像头
				$camera.css({
					background: '#3598dc',
					width: '10px',
					height: '10px',
					borderRadius: '100%',
					position: 'absolute',
					display: 'none'
				});
				// 设置关闭按钮样式
				$button.css({
					background: '#000',
					padding: '10px 15px',
					color: '#fff',
					position: 'absolute',
					right: '20px',
					top: '20px',
					display: 'block'
				}).addClass('iconfont')
				  .html( '关闭&nbsp;&#xe658;' )
				  .appendTo( $container );
				// 图片位置以及样式
				img.src = Global.path + self.image;
				/*img.style.width = '100%';*/
				img.style.height = winHeight + 'px';
				img.style.position = 'relative';
				// 设置容器样式
				$container.append( img )
						  .append( $camera )
						  .css({
								position: 'fixed',
								top: 0,
								left: 0,
								zIndex: 19999,
								cursor: 'pointer',
								width: winWidth
							}).appendTo('body');
				// 事件绑定
				$button.on('click', function(){
					$container.remove();
					$('body').off('keyup.camera');
				});
				// 选取点位
				var realX, realY;
				$container.on('click', function( event ){
					var x = event.pageX,
					    y = event.pageY;
					
					realX = (x * scale).toFixed(2);
					realY = (y * scale).toFixed(2);
					$camera.show().css({
						left: x + 'px',
						top: y + 'px'
					})
				});
				// 绑定回车选取点位
				$('body').on('keyup.camera', function(e){
					if ( e.which == 13 ) {
						self.$el.find('[name=camMainx]').val(realX);
						self.$el.find('[name=camMainy]').val(realY);

						$button.trigger('click');
					}
				});
			};

			image.src = Global.path + self.image;
		}
	}

	cameraManagement.collection = collection;
	cameraManagement.model = model;
	cameraManagement.view = view;
	
	return cameraManagement;
});