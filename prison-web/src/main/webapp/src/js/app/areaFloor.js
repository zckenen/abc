define(['global', 'pagination', 'areaRegion', 'areaLinkpage', 'tripleNumberLink'], 
		function(Global, Pagination, AreaRegion, AreaLinkpage, TripleNumberLink){
	var AreaFloor = {

	};

	AreaFloor.model = Backbone.Model.extend({
		initialize: function() {

		},
		idAttribute: 'id',
		defaults: {
			pco: false,
			plo: false
		}
	});

	AreaFloor.collection = new (Backbone.Collection.extend({
		model: AreaFloor.model,
		modelName: 'data',
		modelSubName: 'data',
		modelTreName: 'list'
	}));

	AreaFloor.view = Backbone.View.extend({
		el: '#areaFloor',
		events: {
			// 查看楼层地图原图
			'click.origin [data-event=origin]': 'origin', // 查看原图
			// 添加楼层
			'click.add [data-event=add]': 'add', // 添加
			// 修改楼层
			'click.edit [data-event=edit]': 'edit', // 修改
			// 删除楼层
			'click.dels [data-event=dels]': 'dels',
			//删除楼层-单个
			'click.del [data-event=del]': 'del',
			// 设置区域
			// 'click.set [data-event=regionSet]': 'regionSet',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 搜索
			'click.search [data-event=search]': 'search',
		},
		initialize: function() {
			this.$el = $(this.el);
			// 将form中dom表单元素写入属性中
			this.addFormData();
			// 获取数据并渲染
			this.list(1);
			
		},
		/**
		 * 列表
		 * @param  {int} pageNo 页码
		 * @param {object} param 搜索条件
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
			self.collection.url = Global.path + '/picture/loadAmdPictureInfo.do';
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
						hash: 'area/floor/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
			// 搜索框数据显示
			AreaLinkpage.init({
				$coo: this.$el.find('.search select[data-name=cooId]')
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
				if (model.id) {
					model.index = ++i;
					contents += template( 'areaFloorListTpl', model );
				}
			});
			// 插入视图
			$container.empty().append( contents );
			// UI事件
			UI.tooltips( $container.find('[data-toggle=tooltip]') );
			// iselect
			this.$el.find('.search select').each(function(){
				if ( this.name !== 'coo_id' ) {
					UI.iselect( this );
				}
			});
		},
		/**
		 * 查看楼层地图原图
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		origin: function(event) {
			var con = (event || window.event).target,
				$layer = $('#areaFloorMapDetail');
			// 替换图片
			$layer.find('img').attr('src', Global.path + con.getAttribute('data-src'));
			// 弹出显示
			UI.dialog( $layer );
		},
		/**
		 * 添加楼层
		 */
		add: function() {
			var ins = AreaFloor.add.ins;
			// 实例化添加视图
			!ins ? ins =  AreaFloor.add.ins = new AreaFloor.add({ model: new AreaFloor.model() }) : '';
			// 迁移视图
			ins.setElement( $('#areaFloorAdd') );
			// 显示当前弹出层
			ins.show(); 
			// 需要重新渲染
			ins.isRender = true;
			return false;
		},
		/**
		 * 修改层
		 * @param  {object} event 事件对象
		 * @return {[type]}       [description]
		 */
		edit: function( event ) {
			var con = event.currentTarget,
				// 层id
				id = con.getAttribute('data-id'),
				// 获取fid
				cooId = con.getAttribute('data-cooId');
			// 判断视图实例化是否存在
			var ins = AreaFloor.edit.ins;
			!ins ? ins = AreaFloor.edit.ins = new AreaFloor.edit({collection: AreaFloor.collection}) : '';
			// 渲染
			ins.render( id );
			// 显示当前弹出层
			ins.show();
			
			return false;
		},
		del: function( event ) {
			var self = this,
			    con = event.currentTarget,
			// 层id
			id = con.getAttribute('data-id'),
			cooId = con.getAttribute('data-cooId'),
			item = {'id': id, 'coo.id': cooId};
			UI.confirm('',function(){
				//  获取数据集合
				self.collection.url = Global.path + '/picture/deleteAdmPictureInfo.do';
				// 删除
				self.collection.delArea(item, {
					success: function(data) {
						if( data.status == '0' ) {
							UI.alert({ message: Global.lang.m5 });
							// 重新读取渲染
							self.list(1);
						} else {
							UI.alert({message: data.msg,type:'danger' });
						}
					}
				});
			})
			
			return false;
			
		},
		/**
		 * 删除楼层
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		dels: function( event ) {
			var self = this,
				con = (event || window.event).currentTarget,
				// 获取要删除的id checkbox
				$checked = this.$el.find('table>tbody :checked');
			   console.log('$checked',$checked,$checked[0].value,self.collection.deletes);
			// 判断长度
			if ( $checked.length === 0 ) {
				UI.alert({ message: Global.lang.m7, type: 'warning'});
				return false;
			}
			UI.confirm('',function(){
				//  获取数据集合
				self.collection.url = Global.path + '/picture/deleteAdmPictureInfo.do';
				// 删除
				self.collection.deletes($checked, {
					success: function(data) {
						if( data.status == '0' ) {
							UI.alert({ message: Global.lang.m5 });
							// 重新读取渲染
							self.list(1);
							// 刷新缓存
							AreaLinkpage.refresh();
						} else {
							UI.alert({message: data.msg,type:'danger' });
						}
					}
				});
			})
			
			return false;
		},
		/**
		 * 楼层的区域设置
		 * @param  {object} 事件对象 [description]
		 * @return {[type]}       [description]
		 */
		// regionSet: function( event ){
		// 	var // 当前数据ID
		// 		id = event.currentTarget.getAttribute('data-id'),
		// 		// 模型数据
		// 		model = this.collection.get( id ).toJSON(),
		// 		// 实例化
		// 		ins = AreaRegion.add.ins;
		// 	// 实例化添加视图
		// 	!ins ? AreaRegion.add.ins = ins = new AreaRegion.add({ model: new AreaRegion.model() }) : '';
		// 	// 迁移视图
		// 	ins.setElement( $('#areaRegionSet') );
		// 	// 是否需要渲染
		// 	ins.isRender = false;
		// 	// 设置所属层以及幢的id
		// 	ins.$el.find('[name=cooName]').val( model.coo.cooName );
		// 	ins.$el.find('[name=cooId]').val( model.coo.id );
		// 	ins.$el.find('[name=picName]').val( model.picName  );
		// 	ins.$el.find('[name=picId]').val( model.id  );
		// 	// 显示当前弹出层
		// 	ins.show(); 
		// 	return false;
		// }
	});

	// 添加
	AreaFloor.add = Backbone.View.extend({
		el: '#areaFloorAdd',
		events: {
			// 提交添加
			'submit.submit form': 'submit',
			// 上传地图
			'click.upload [data-event=upload]': 'upload',
			// 幢改变
			'change [name=cooId]': 'change'
		},
		initialize: function() {
			// 上下文
			var self = this;
			// 视图容器
			this.$el = $(this.el);
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
			// 层级
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
			// 显示
			UI.dialog( this.$el );
			// 初始化幢select
			AreaLinkpage.init({
				$coo: this.$el.find('select[name=cooId]'),
				handlezIndex: true
			});
			// 初始化监区分监区
			TripleNumberLink.init({
				$pco: this.$el.find('[name=pcoId]'),
				$plo: this.$el.find('[name=ploId]'),
				handlezIndex: true
			});
		},
		/**
		 * 图片上传
		 * @return {[type]} [description]
		 */
		upload: function() {
			var self = this,
				// 容器
				$box = $("#fileUpload"),
				// 成功回调
				success = function(event, data) {
					var json = data.response.data;
					// 设置路径
					self.$el.find('[name=picPath]').val( json.path );
					// 关闭
					$box.find('.bootbox-close-button').trigger('click');
				};
			// 移除原有图片
			$('.fileinput-remove').trigger('click');
			// 绑定上传
			Global.fileUpload( $box, {success: success});	
			// 弹出
			UI.dialog( $box );
		},
		/**
		 * 提交添加
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			// 写入数据
			self.setFormData();
			self.model.unset("pco","silent");
			self.model.unset("plo","silent");
			// 设置URL
			AreaFloor.collection.url = Global.path + '/picture/saveAdmPictureInfo.do'
			// 写入数据
			AreaFloor.collection.insert(self.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						// 判断是否需要渲染
						self.isRender ? AreaFloor.view.ins.list(1) : '';
						// 关闭弹出层
						$('.close').trigger('click');
						// 提示成功
						UI.alert({ message: Global.lang.m4 });
						// 刷新缓存
						AreaLinkpage.refresh();
					} else {
						// 提示异常
						UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
					}
				}
			});
			return false;
		}
	});

	// 修改
	AreaFloor.edit = Backbone.View.extend({
		el: '#areaFloorEdit',
		events: {
			// 弹出坐标选择面
			//'click.select [data-event=select]': 'coordinateHandle',
			// 提交保存
			'submit.submit form': 'submit',
			// 图片上传
			'click.upload [data-event=upload]': 'upload',
			// 幢改变
			'change [name=cooId]': 'change'
		},
		initialize: function() {
			var self = this;
			// 视图容器
			this.$el = $(this.el);
		},
		/**
		 * 幢改变联动楼层数改变
		 * @return {[type]} [description]
		 */
		change: function( event ) {
			var select = event.currentTarget,
				level = $(select).find('option:selected').attr('data-level'),
				options = '',
				i = 1;
			for( ; i <= level; i++ ) {
				options += '<option value="'+ i +'">'+ i +'</option>'
			}
			this.$el.find('[name=picLevel]').html( options );
		},
		//渲染
		// @id 数据ID
		render: function( id ) {
			this.model = this.collection.get( id );
			var model = this.model.toJSON();
			// 渲染
			this.$el.find('.modal-body').html( template( 'areaFloorEditTpl', model ) );
			// 数据绑定
			this.addFormData();
			// 初始化幢select
			AreaLinkpage.init({
				$coo: this.$el.find('select[name=cooId]'),
				cooId: model.coo.id,
				handlezIndex: true
			});
			// 初始化监区分监区
			TripleNumberLink.init({
				$pco: this.$el.find('[name=pcoId]'),
				$plo: this.$el.find('[name=ploId]'),
				pcoId: model.pco && model.pco.id,
				ploId: model.pco && model.plo.id,
				handlezIndex: true
			});
			// UI select
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true}  );
		},
		// 弹出显示容器
		show: function(){
			UI.dialog( this.$el );
		},
		upload: function() {
			var self = this,
				// 容器
				$box = $("#fileUpload"),
				// 成功回调
				success = function(event, data) {
					var json = data.response.data;
					// 设置路径
					self.$el.find('[name=picPath]').val( json.path );
					// 关闭
					$box.find('.bootbox-close-button').trigger('click');
				};
			// 移除原有图片
			$('.fileinput-remove').trigger('click');
			// 绑定上传
			Global.fileUpload( $box, {success: success});	
			// 弹出
			UI.dialog( $box );
		},
	 	// 提交保存数据
	 	submit: function() {
	 		var self = this;
			// 写入数据
			this.setFormData();
			// 设置URL
			AreaFloor.collection.url = Global.path + '/picture/updateAdmPictureInfo.do'
			// 写入数据
			this.model.unset('coo');
			this.model.unset('plo');
			this.model.unset('pco');
			AreaFloor.collection.update(this.model, {
				success: function( data ) {
					if ( data.status == '0' ) {
						AreaFloor.view.ins.refresh();
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
	 	}
	});

	return AreaFloor;
});