define(['global', 'pagination', 'areaFloor', 'areaLinkpage', 'tripleNumberLink'], 
	function(Global, Pagination, AreaFloor, AreaLinkpage, TripleNumberLink){
		var AreaBuilding = {

		};
		/**
		 * 坐标选取处理
		 * @return {[type]} [description]
		 */
		var coordinate = function() {
			var	self = this,
				// 地图平级
				map = window.MAP_URI,
				// 创建容器
				$container = $('<div>'),
				// 图片元素以及真实宽度
				img = document.createElement('img'), width,
				// 关闭按钮
				$button = $('<a>'),
				// 窗口大小
				winWidth = $(window).width(),
				// 创建tip提示元素
				$tip = $('<div>'),
				// 坐标位置
				x, y;
			// 获取图片的真实宽高
			var image = new Image();
			image.onload = function() {
				width = image.width;
				height = image.height;
				// 计算比例
				var scale = width / winWidth;
				// 设置tip元素
				$tip.css({
					position: 'absolute',
					background: '#000',
					color: '#fff',
					left: 0,
					top: 0,
					padding: '5px 10px'
				}).appendTo( $container );
				// 设置关闭按钮样式
				$button.css({
					background: '#000',
					padding: '10px 15px',
					color: '#fff',
					position: 'absolute',
					right: '20px',
					top: '20px',
					display: 'block'
				}).addClass('iconfont').html('关闭&nbsp;&#xe658;');
				$container.append( $button );
				// 图片位置以及样式
				img.src = map;
				img.style.width = '100%';
				// 设置容器样式
				$container.append( img ).css({
					position: 'fixed',
					top: 0,
					left: 0,
					zIndex: 19999,
					cursor: 'pointer',
					width: winWidth
				});
				// 插入文档
				$container.appendTo('body');
				// 绑定事件
				$button.on('click', function(){
					$container.remove();
				});
				$container.on('mouseenter', function(){
					$tip.css({display: 'block'});
				}).on('mouseleave', function(){
					$tip.css({display: 'none'});
				});
				$container.on('mousemove', function(event){
					x = event.pageX, y = event.pageY;
					$tip.css({
						left: x + 20,
						top: y + 20
					}).html('x:' + (x * scale).toFixed(2) + 'px, y:' + (y * scale).toFixed(2) + 'px');
				});
				$container.on('click', function(event){
					self.$el.find('[name=cooMainx]').val( x );
					self.$el.find('[name=cooMainy]').val( y );
					$container.remove();
				});
			};
			image.src = map;
		};

		// 模型
		AreaBuilding.model = Backbone.Model.extend({
			initialize: function() {

			},
			idAttribute: 'id',
			// 默认值
			defaults: {
				cooName: '',
				cooMainx: '',
				cooMainy: ''
			}
		});

		// 模型集合
		AreaBuilding.collection = new (Backbone.Collection.extend({
			model: AreaBuilding.model,
			// 模型名字
			modelName: 'data',
			modelSubName: 'data',
			modelTreName: 'list'

		}))();

		// 视图
		AreaBuilding.view = Backbone.View.extend({
			el: '#areaBuilding',
			events: {
				// 添加幢
				'click.add [data-event=add]': 'add',
				// 编辑幢
				'click.edit [data-event=edit]': 'edit',
				// 删除幢
				'click.dels [data-event=dels]': 'dels',
				// 删除幢-单条
				'click.del [data-event=del]': 'del',
				// 按关键字搜索幢
				'click.search [data-event=search]': 'search',
				// 刷新
				'click.refresh [data-event=refresh]': 'refresh',
				// 设置幢下的楼层
				// 'click.setFloor [data-event=setFloor]': 'setFloor' 
			},
			initialize: function() {
				this.$el = $(this.el);
				// 获取模板
				this.template = _.template( $('#areaBuildingListTpl').html() );
				// 将form中dom表单元素写入属性中
				this.addFormData();
				// 获取数据并渲染
				this.list(1);
			},
			/**
			 * 幢列表
			 * @param  {int} pageNo 页码
			 * @param  {object} param  搜索参数
			 * @return {[type]}        [description]
			 */
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
				//  获取数据集合
				self.collection.url = Global.path + '/loccoor/loadAdmLoccoorInfo.do';
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
							hash: 'area/building/list/p'
						}, Pagination);
						// 关闭进度
						progress.end();
					}		
				});
			},
			/**
			 * 视图渲染
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
						contents += self.template( model );
					}
				});
				// 插入视图
				$container.html( contents );
				// 提示框
				UI.tooltips( $container.find('[data-toggle=tooltip]') );
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
			 * 修改幢
			 * @event {object} 事件对象
			 * @return {[type]} [description]
			 */
			edit: function( event ) {
				var id = event.currentTarget.getAttribute('data-id');
				// 判断视图实例化是否存在
				if ( !this.viewEditIns ) {
					this.viewEditIns = new AreaBuilding.edit({collection: AreaBuilding.collection});
				}
				// 渲染
				this.viewEditIns.render( id );
				// 显示当前弹出层
				this.viewEditIns.show();
				return false;
			},
			/**
			 * 添加幢
			 */
			add: function() {
				var ins = AreaBuilding.add.ins;
				// 实例化添加视图
				!ins ? AreaBuilding.add.ins = ins = new AreaBuilding.add({ model: new AreaBuilding.model() }) : '';
				// 显示当前弹出层
				ins.show(); 
				return false;
			},
			/**
			 * 批量删除幢数据
			 * @param  {[type]} event [description]
			 * @return {[type]}       [description]
			 */
			del: function( event ) {
				var self = this,
					con = event.currentTarget,
					// 获取要删除的id
					id = con.getAttribute('data-id');
				console.log('删除id',id);
				
				UI.confirm('',function(){
					//  获取数据集合
					self.collection.url = Global.path + '/loccoor/deleteAdmLoccoorInfo.do';
					// 删除
					self.collection.del(id, {
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
			/**
			 * 批量删除幢数据
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
				UI.confirm('',function(){
					//  获取数据集合
					self.collection.url = Global.path + '/loccoor/deleteAdmLoccoorInfo.do';
					// 删除
					self.collection.deletes($checked, {
						success: function(data) {
							if( data.status == '0' ) {
								UI.alert({ message: Global.lang.m5 });
								self.list(1);
								// 刷新缓存
								AreaLinkpage.refresh();
							} else {
								UI.alert({ message: data.msg, type: 'danger' });
							}
						}
					});
				})
				
				return false;
			}
		});
	/*****
	* 添加
	*****/
	AreaBuilding.add = Backbone.View.extend({
		el: '#areaBuildingAdd',
		events: {
			'submit.submit form': 'submit',
			// 地图选取坐标点
			'click [data-event=handleCoordinate]': 'handleCoordinate'
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
			AreaBuilding.collection.url = Global.path + '/loccoor/saveAdmLoccoorInfo.do';
			// 写入数据
			AreaBuilding.collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						AreaBuilding.view.ins.list(1);
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.lang.m4 });
						// 刷新缓存
						AreaLinkpage.refresh();
					} else {
						// 提示失败
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
		},
		// 显示当前视图
		show: function() {
			// UI渲染
			UI.dialog( this.$el );
		},
		/**
		 * 通过首页地图选择坐标点
		 * @return {[type]} [description]
		 */
		handleCoordinate: function( event ) {
			coordinate.call(this);
		}
	});

	/*****
	* 修改
	*****/
	AreaBuilding.edit = Backbone.View.extend({
		el: '#areaBuildingEdit',
		events: {
			// 弹出坐标选择面
			'click.select [data-event=handleCoordinate]': 'handleCoordinate',
			// 提交保存
			'submit.submit form': 'submit'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
			// 模板
			this.template = _.template( $('#areaBuildingEditTpl').html() );
			// 处理iselect
			UI.iselect( this.$el.find('select'), {handlezIndex: true} );
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
			AreaBuilding.collection.url = Global.path + '/loccoor/updateAdmLoccoorInfo.do';
			// 写入数据
			AreaBuilding.collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						AreaBuilding.view.ins.render();
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
	 	 * 处理坐标位置点
	 	 * @return {[type]} [description]
	 	 */
	 	handleCoordinate: function() {
	 		coordinate.call(this);
	 	}
	});
		
	return AreaBuilding;
});