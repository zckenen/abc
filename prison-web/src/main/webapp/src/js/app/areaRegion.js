define(['global', 'pagination', 'areaLinkpage'], function(Global, Pagination, AreaLinkpage){
	/**
	 * 区域选择坐标
	 * @return {[type]} [description]
	 */
	var _position = function() {
		if ( !this.image ) {
			UI.alert({ message: Global.lang.m18, type: 'warning'});
		} else {
			var self = this,
				// 创建div容器元素			 
				$container = $('<div>'),
				// 遮罩元素
				$mask = $('<div>'),
				// 创建按钮元素
				$button = $('<a>'),
				// 创建提示元素
				$tip = $('<div>'),
				// 创建画框元素
				$frame = $('<div>'),
				// 创建图片sh实例
				image = new Image(),
				// 创建图片元素
				img = document.createElement('img'),
				// 窗口大小
				winWidth = $(window).width(),
				winHeight = $(window).height(),
				// body元素是否绑定keyup事件
				isBind = false;
			// frame中加入一个宽高为100%的元素用触发mouseover事件
			$frame.append( "<div style='width: 100%; height: 100%;'></div>" )
			// 显示坐标位置
			var _show = function($elem, x, y, scale) {
				$elem.css({
					left: x + 20,
					top: y + 20
				}).html( 'x:' + (x * scale).toFixed(2) + 'px, y:' + (y * scale).toFixed(2) + 'px' );
			};
			// 绑定onload事件
			image.onload = function() {
				width = image.width;
				height = image.height;
				// 计算比例
				var scale = height / winHeight;
				// 时间段的坐标位置
				var intx, inty,
					nowx, nowy,
					lasx, lasy;
				// 设置框样式
				$frame.css({
					position: 'absolute',
					zIndex: 1999,
					background: 'rgba(255, 255, 255, 0)',
					border: '2px solid red',
					display: 'none'
				}).appendTo( $container );
				// 设置tip元素
				$tip.css({
					position: 'absolute',
					background: '#000',
					zIndex: 2999,
					color: '#fff',
					left: 0,
					top: 0,
					padding: '5px 10px'
				}).appendTo( $container );
				// 设置关闭按钮样式
				$button.css({
					background: '#000',
					zIndex: 2999,
					padding: '10px 15px',
					color: '#fff',
					position: 'absolute',
					right: '20px',
					top: '20px',
					display: 'block'
				}).addClass('iconfont')
				  .html('关闭&nbsp;&#xe658;')
				  .appendTo( $container );
				// 图片位置以及样式
				img.src = Global.path + self.image;
				img.style.maxHeight = winHeight + 'px';
				img.style.position = 'relative';				
				// 放入遮罩
				$mask.css({
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 999,
				}).appendTo($container);
				// 设置容器样式
				$container.append( img ).css({
					position: 'fixed',
					top: 0,
					left: 0,
					zIndex: 19999,
					cursor: 'pointer',
					width: winWidth
				});
				// container插入文档
				$container.appendTo( 'body' );
				// 事件绑定
				$button.on('click', function(){
					$container.remove();
					$('body').off('keyup.region');
					isBind = false;
				});
				$container.on('mousedown', function( event ){
					// 解绑
					$('body').off('keyup.region');
					if ( event.which == 3 ) {//点击鼠标右键
						$frame.hide();
						$tip.hide();
						return;
					} else if ( event.which == 1 ) {//点击鼠标左键
						$frame.css({
							width: 0,
							height: 0
						})
					}
					intx = event.clientX;
					inty = event.clientY;
					// 显示框
					$frame.show();
					// 显示tip
					$tip.show();
					// 显示坐标位置
					_show($tip, intx, inty, scale);
					// 确定起始位置
					$frame.css({left: intx, top: inty});
					// 绑定移动
					$container.on('mousemove', function( event ){
						nowx = event.clientX;
						nowy = event.clientY;
						_show($tip, nowx, nowy, scale);
						$frame.css({
							width: (nowx - intx) + 'px',
							height: (nowy - inty) + 'px'
						});
					});
				}).on('contextmenu', function( event ){
					return false;
				}).on('mouseup', function( event ){
					lasx = event.clientX;
					lasy = event.clientY;
					$container.off('mousemove');
					// 绑定回车提交数据功能
					if ( event.which == 1 ) {
						$('body').on('keyup.region', function(e){
							if ( e.which == 13 ) {
								var width = ((lasx - intx) * scale).toFixed(2),
									height = ((lasy - inty) * scale).toFixed(2),
									cenx = (width / 2 + intx * scale).toFixed(2),
									ceny = (height / 2 + inty * scale).toFixed(2);
								// 插入input元素中
								self.$el.find('[name=locMainx]').val( cenx );
								self.$el.find('[name=locMainy]').val( ceny);
								self.$el.find('[name=locSizex]').val( width );
								self.$el.find('[name=locSizey]').val( height );
								$container.remove();
								$('body').off('keyup.region');
							}
						});
					}
					isBind = true;
				});
				// 区域拖动
				$frame.on('mousedown', function(){
					$frame.on('mousemove', function(){

					});
				}).on('mouseup', function(){
					$frame.off('mousemove');
				})
			};
			image.src = Global.path + this.image;
		}
	};

	/**
	 * 楼层选择改变
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	var _change = function( event ) {
		var $option = $(event.currentTarget).find('option:selected');
		// 获取路径
		this.image = $option.attr('data-pic');
	}

	var AreaRegion = {

	};

	AreaRegion.model = Backbone.Model.extend({
		idAttribute: 'id',
		defaults: {  }
	});

	AreaRegion.collection = new (Backbone.Collection.extend({
		model: AreaRegion.model,
		// 模型名字
		modelName: 'data',
		modelSubName: 'data',
		modelTreName: 'list'
	}));

	AreaRegion.view = Backbone.View.extend({
		el: '#areaRegion',
		events: {
			// 查看原图
			'click.origin [data-event=origin]': 'origin', 
			// 添加
			'click.add [data-event=add]': 'add', 
			// 修改
			'click.edit [data-event=edit]': 'edit', 
			// 删除
			'click.dels [data-event=dels]': 'dels',
			// 删除-单条
			'click.del [data-event=del]': 'del',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 搜索
			'click.search [data-event=search]': 'search'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 获取模板
			// this.template = _.template( $('#areaRegionListTpl').html() );
			// 将form中dom表单元素写入属性中
			this.addFormData();
			// 获取数据并渲染
			this.list(1);
			// 搜索框数据显示
			AreaLinkpage.init({
				$coo: this.$el.find('select[data-name=cooId]'),
				$pic: this.$el.find('select[data-name=picId]'),
				handlezIndex: false
			});
		},
		/**
		 * 列表
		 * @param  {int} pageNo 页码
		 * @param  {object} param  搜索参数
		 * @return {[type]}        [description]
		 */
		list: function( pageNo, param ) {
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
			// 获取数据集合
			self.collection.url = Global.path + '/locarea/loadAdmLocareaInfo.do';
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
						hash: 'area/region/list/p'
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
			var self = this;
			// 渲染容器
			var $container = this.$el.find('tbody'),
				contents = '',
				model;
			// 遍历渲染
			$.each(this.collection.models, function(i){
				model = this.toJSON();
				if(model.id) {
					model.index = ++i;
					contents += template('areaRegionListTpl', model );
				}
			});
			// 插入视图
			$container.empty().append( contents );
			// UI事件
			UI.tooltips( $container.find('[data-toggle=tooltip]') );
		},
		/* 查看原图 */
		origin: function(event) {
			var con = (event || window.event).target,
				$layer = $('#AreaRegionMapDetail');
			// 替换图片
			$layer.find('img').attr('src', con.getAttribute('data-src'));
			// 弹出显示
			UI.dialog( $layer );
		},
		/* 添加层 */
		add: function() {
			var ins = AreaRegion.add.ins;
			// 判断是否实例化
			!ins ? AreaRegion.add.ins = ins = new AreaRegion.add({ model: new AreaRegion.model() }) : '';
			// 迁移视图
			ins.setElement( $('#areaRegionAdd') );
			// 显示当前弹出层
			ins.show(); 
			// 需要重新渲染
			ins.isRender = true;
			// 初始化select
			AreaLinkpage.init({
				$coo: ins.$el.find('select[data-name=cooId]'),
				$pic: ins.$el.find('select[data-name=picId]'),				
				handlezIndex: true
			});
			return false;
		},
		/**
		 * 修改区域
		 * @param  {object} event 事件对象
		 * @return {[type]}       [description]
		 */
		edit: function( event ) {
			// 获取要修改的id
			var id = event.currentTarget.getAttribute('data-id');
			// 判断视图实例化是否存在
			var ins = AreaRegion.edit.ins;
			!ins ? ins = AreaRegion.edit.ins = new AreaRegion.edit({collection: AreaRegion.collection}) : '';
			// 渲染
			ins.render( id );
			// 显示当前视图
			ins.show();
			return false;
		},
		/* 删除数据 */
		del: function( event ) {
				var self = this,
					con = event.currentTarget,
					// 获取要删除的id
					id = con.getAttribute('data-id'),
					cooId = con.getAttribute('data-cooId'),
					item = {'id': id, 'coo.id': cooId};
				// 判断长度
				UI.confirm('',function(){
					//  获取数据集合
					self.collection.url = Global.path + '/locarea/deleteAdmLocareaInfo.do';
					// 删除			
					self.collection.delArea(item, {
						success: function(data) {
							if( data.status == '0' ) {
								UI.alert({ message: Global.lang.m5 });
								self.list(1);
							} else {
								UI.alert({ message: data.msg, type: 'danger' });
							}
						}
					});
				})			
				return false;
		},
		/* 删除数据 */
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
				UI.confirm('',function(){
					//  获取数据集合
					self.collection.url = Global.path + '/locarea/deleteAdmLocareaInfo.do';
					// 删除
					$checked.each(function(i){
						var model = self.collection.get(this.value).toJSON();
						$.http({
							url: self.collection.url,
							data: {id: model.id, 'coo.id': model.coo.id},
							dataType: 'json', 
							type: 'post'
						}).done(function(data){
							if (i === 0) {
								if( data.status == '0' ) {
									UI.alert({ message: Global.lang.m5 });
									self.list(1);
									// 刷新缓存
									AreaLinkpage.refresh();
								} else {
									UI.alert({ message: data.msg, type: 'warning' });
								}
							}
						});
					});
				})
				
				return false;
			}
	});

	// 添加
	AreaRegion.add = Backbone.View.extend({
		el: '#areaRegionAdd',
		events: {
			// 提交保存
			'submit.submit form': 'submit',
			// 选取坐标
			'click [data-event=handlePosition]': 'handlePosition',
			// 楼层改变
			'change [name=locGroupid]': 'change'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 绑定选择
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
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
			AreaRegion.collection.url = Global.path + '/locarea/saveAdmLocareaInfo.do';
			// 写入数据
			AreaRegion.collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						self.isRender ? AreaRegion.view.ins.list(1) : '';
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.lang.m4 });
						// 刷新缓存
						AreaLinkpage.refresh();
					} else {
						// 提示成功
						UI.alert({message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		},
		/**
		 * 楼层选择改版
		 * @return {[type]} [description]
		 */
		change: function( event ) {
			_change.call(this, event);
		},
		/**
		 * 选取区域位置
		 * @return {[type]} [description]
		 */
		handlePosition: function() {
			this.image = this.$el.find('[data-name=picId]').find('option:selected').attr('data-pic');
			_position.call( this );
		}
	});

	// 修改
	AreaRegion.edit = Backbone.View.extend({
		el: '#areaRegionEdit',
		events: {
			// 提交保存
			'submit.submit form': 'submit',
			// 选取坐标
			'click [data-event=handlePosition]': 'handlePosition',
			// 楼层选择改变
			'change [data-name=picId]': 'change'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
		},
		/**
		 * 渲染数据
		 * @param  {int} id 数据id
		 * @return {[type]}    [description]
		 */
		render: function( id ) {
			var data = (this.model = this.collection.get( id )).toJSON();
			// 渲染
			this.$el.find('.modal-body').html( template('areaRegionEditTpl', data) );
			// 数据绑定
			this.addFormData();
			// 初始化联动
			AreaLinkpage.init({
				$coo: this.$el.find('select[data-name=cooId]'),
				cooId: data.coo.id,
				$pic: this.$el.find('select[data-name=picId]'),
				picId: data.pic.id,
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
			AreaRegion.collection.url = Global.path + '/locarea/updateAdmLocareaInfo.do';
			// 写入数据
			this.model.unset('coo');
			this.model.unset('pic');
			AreaRegion.collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						AreaRegion.view.ins.refresh();
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.lang.m3 });
						// 刷新缓存
						AreaLinkpage.refresh();
					} else {
						// 失败提示
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}		
			});
	 	},
	 	/**
		 * 选取区域位置
		 * @return {[type]} [description]
		 */
		handlePosition: function() {
			// 设置图片
			this.image = this.$el.find('[data-name=picId]').find('option:selected').attr('data-pic');
			_position.call( this );
		},
		/**
		 * 楼层选择改版
		 * @return {[type]} [description]
		 */
		change: function( event ) {
			_change.call(this, event);
		}
	});

	return AreaRegion;
});