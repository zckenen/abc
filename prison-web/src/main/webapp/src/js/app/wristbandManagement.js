/* 罪犯轨迹 */
/* wristbandManagement */

define(['global', 'pagination', 'tripleNumberLink', 'areaLinkpage'], function(Global, Pagination, TripleNumberLink, AreaLinkpage){
	var wristbandManagement = {};

	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id', // peoNo
		defaults: {
			
		}
	});
	// 模型集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		// 模型名字
		modelName: 'data',
		modelSubName: 'data',
		modelTreName: 'list'
	}))();

	// 视图
	var view = Backbone.View.extend({
		el: '#wristbandManagement',
		events: {
			'click.bind [data-event=bind]': 'bind',
			'click.unbind [data-event=unbind]': 'unbind',
			'click.change [data-event=change]': 'change',
			'click.edit [data-event=edit]': 'edit',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			// 搜索
			'click.search [data-event=search]': 'search',
			// 设置工位
			'click.setWorker [data-event=setWorker]': 'setWorker',
			// 设置床位
			'click.setBed [data-event=setBed]': 'setBed'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 初始化搜索
			this.initSort();
			// 获取并渲染数据
			this.list(1);
			// select
			UI.iselect( this.$el.find('.search select') );	
			// 加载联动
			TripleNumberLink.init({
				$pco: this.$el.find('[data-name=pcoId]'),
				$plo: this.$el.find('[data-name=ploId]'),
				$dorm: this.$el.find('[data-name=peoDorm]'),
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
				// 列表参数
				data = { pageNo: pageNo, pageSize: Global.pageSize };
			// 扩展搜索条件
			param ? data = $.extend(data, param) : data = $.extend(data, self.searchFormData());
			// 当前页面用于刷新
			self.pageNo = pageNo;
			// 搜索条件
			data = $.extend(data, param);
			// 处理十六进制
			var watNum = data['wat.watNum'];
			if (watNum) {
				data['wat.watNum'] = parseInt(watNum, 16);
			}
			// 开启进度
			progress.start('L');
			// 获取数据
			self.collection.url = Global.path + '/watch/loadAdmWatchInfo.do';
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
						hash: 'wristband/management/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		/**
		 * 已绑定与未绑定的人数统计
		 * 
		 * @return {[type]} [description]
		 */
		count: function( wtotle, ptotle ) {

		},
		/**
		 * 刷新当前页面
		 * @return {[type]} [description]
		 */
		refresh: function() {
			var param = this.searchFormData();
			// 获取列表数据F
			this.list(this.pageNo, param);
		},
		/**
		 * 列表搜索
		 * @return {[type]} [description]
		 */
		search: function() {
			var param = this.searchFormData();
			// 获取列表
			this.list(1, param);
		},
		/**
		 * 渲染
		 * @return {[type]} [description]
		 */
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('#wristbandManagementList'),
				// 首先渲染人物信息
				content = '',
				// 数据模型
				model;
			// 渲染历史轨迹信息
			$.each(this.collection.models, function(i){
				model = this.toJSON();
				model.index = ++i;
				// 人员类型
				model.peoTypeName = Global.lang.peotype[model.peoType];
				// 拼接
				content += template( 'wristbandManagementListTpl', model );
			});
			// 插入渲染容器中
			$container.html( content );
		},
		/**
		 * 显示
		 * @return {[type]} [description]
		 */
		show: function() {
			UI.dialog( this.$el );
		},
		/**
		 * 人员与手环或胸牌绑定
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		bind: function( event ) {
			var id = event.target.getAttribute('data-id');
			if ( !bind.ins ) {
				bind.ins = new bind({collection: collection});
			}
			// 显示
			bind.ins.render( id );
		},
		/**
		 * 手环解除绑定
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		unbind: function( event ) {
			var id = (event || window.event).target.getAttribute('data-id');
			if ( !unbind.ins ) {
				unbind.ins = new unbind({collection: collection});
			}
			// 渲染
			unbind.ins.render( id );
		},
		/**
		 * 手环变更
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		change: function( event ) {
			var id = event.target.getAttribute('data-id');
			if ( !change.ins ) {
				change.ins = new change({collection:collection});
			}
			// 渲染显示
			change.ins.render( id );
		},
		/**
		 * 修改人员列表
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		edit: function( event ) {
			var id = event.target.getAttribute('data-id');
			if ( !edit.ins ) {
				edit.ins = new edit({collection:collection});
			}
			// 渲染显示
			edit.ins.render( id );
		},
		/**
		 * 设置工位
		 * @param {[type]} event [description]
		 */
		setWorker: function( event ) {
			var id = event.target.getAttribute('data-id');
			!SetWorker.ins ? SetWorker.ins = new SetWorker() : '';
			SetWorker.ins.render( id );
		},
		/**
		 * 设置床位
		 * @param {[type]} event [description]
		 */
		setBed: function( event ) {
			var id = event.target.getAttribute('data-id');
			!SetBed.ins ? SetBed.ins = new SetBed() : '';
			SetBed.ins.render( id );
		}
	});
	// 人员设置工位
	var SetWorker = Backbone.View.extend({
		el: '#peoSetWorker',
		initialize: function() {
			this.$el = $(this.el);

		},
		events: {
			'submit form': 'submit'
		},
		/**
		 * 渲染显示幢层区域
		 * @param {String} peoId 人员id
		 * @return {[type]} [description]
		 */
		render: function( peoId ) {
			UI.dialog( this.$el );
			// 设置表单元素
			this.addFormData();
			// 数据验证
			this.validate();
			// 获取人员数据
			var peo = collection.get( peoId ).toJSON();
			// 加载联动信息
			if ( peo.wrk && peo.wrk.loc ) {
				AreaLinkpage.init({
					$coo: this.$el.find('[data-name=cooId]'),
					cooId: peo.wrk.loc.coo.id,
					$pic: this.$el.find('[data-name=picId]'),
					picId: peo.wrk.loc.pic.id,
					$loc: this.$el.find('[data-name=locId]'),
					locId: peo.wrk.loc.id,
					$wrk: this.$el.find('[name=workerId]'),
					wrkId: peo.wrk.id,
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: this.$el.find('[data-name=cooId]'),
					$pic: this.$el.find('[data-name=picId]'),
					$loc: this.$el.find('[data-name=locId]'),
					$wrk: this.$el.find('[name=workerId]'),
					handlezIndex: true
				});
			}
			// 设置人员id
			this.$el.find('[name=id]').val( peoId );
		},
		/**
		 * 提交保存
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this,
				// 序列号参数
				param = $(self.form).serializeArray();
			
			// 绑定
			$.http({
				url: Global.path + '/a/per/admPeopleInfo/bindWorkerId',
				type: 'post',
				dataType: 'json',
				data: param
			}).done(function(data){
				if ( data.status == 0 ) {
					// 重新渲染列表
					view.ins.refresh();
					// 提示成功
					UI.alert({ message: Global.lang.m29 });
					// 关闭弹窗
					self.$el.find('.close').trigger('click');
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			});
		}
	});

	// 人员设置床位
	var SetBed = Backbone.View.extend({
		el: '#peoSetBed',
		initialize: function() {
			this.$el = $(this.el);
		},
		events: {
			'submit form': 'submit'
		},
		/**
		 * 渲染显示幢层区域
		 * @param {String} peoId 人员id
		 * @return {[type]} [description]
		 */
		render: function( peoId ) {
			UI.dialog( this.$el );
			// 设置表单元素
			this.addFormData();
			// 数据验证
			this.validate();
			// 获取人员数据
			var peo = collection.get( peoId ).toJSON();
			// 加载联动信息
			if ( peo.bed && peo.bed.loc ) {
				AreaLinkpage.init({
					$coo: this.$el.find('[data-name=cooId]'),
					cooId: peo.bed.loc.coo.id,
					$pic: this.$el.find('[data-name=picId]'),
					picId: peo.bed.loc.pic.id,
					$loc: this.$el.find('[data-name=locId]'),
					locId: peo.bed.locId,
					$bed: this.$el.find('[name=bedId]'),
					bedId: peo.bed.id,
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: this.$el.find('[data-name=cooId]'),
					$pic: this.$el.find('[data-name=picId]'),
					$loc: this.$el.find('[data-name=locId]'),
					$bed: this.$el.find('[name=bedId]'),
					handlezIndex: true
				});
			}
			// 设置人员id
			this.$el.find('[name=id]').val( peoId );
		},
		/**
		 * 提交保存
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this,
				// 序列号参数
				param = $(self.form).serializeArray();
			// 绑定
			$.http({
				url: Global.path + '/a/per/admPeopleInfo/bindBedId.do',
				type: 'post',
				dataType: 'json',
				data: param
			}).done(function(data){
				if ( data.status == 0 ) {
					// 重新渲染列表
					view.ins.refresh();
					// 提示成功
					UI.alert({ message: Global.lang.m29 });
					// 关闭弹窗
					self.$el.find('.close').trigger('click');
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			});
		}
	});

	// 人员与手环或胸牌绑定
	var bind = Backbone.View.extend({
		el: '#wristbandManagementBind',
		events: {
			// 扫描监听
			'change.scans [data-event=scans]': 'scans',
			// 提交数据
			'submit.submit form': 'submit'
		},
		initialize: function() {
			UI.iselect( this.$el.find('select'), {handlezIndex: true} );
			// 上一次扫描的值
			this.lastWatId = '';
		},
		render: function(id) {
			var self = this;
			self.model = collection.get( id );

			// 数据某型
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				data: {id: id},
				type: 'post'
			}).done(function(data){
				var model = self.model.toJSON();
				model.cri = data.data.cri;
				// 渲染
				self.$el.find('#crimianlBindInfo').html( template('crimianlBindInfoTpl', model) );
				// 显示
				UI.dialog( self.$el );
				// 设置表单元素
				self.addFormData();
				// 数据验证
				self.validate();
			});
		},
		// 扫描
		scans: function( event ) {
			var con = event.currentTarget;
			// 替换掉上次的wat_id
			con.value = con.value.replace( this.lastWatId, '' );
			// 重新变更wat_id值
			this.lastWatId = con.value;
		},
		// 提交绑定保存
		submit: function() {
			var self = this;
			// 写入数据
			this.setFormData();
			// 处理进制
			var param = this.model.toJSON();
			// 进制转换
			param.watNum = parseInt(param.watNum, 16);
			// 开启进度
			progress.start('L');
			// 提交
			$.post( Global.path + '/watch/bindWatchId.do', param, function(data){
				if ( data.status == 0 ) {
					// 重新渲染列表
					view.ins.refresh();
					// 提示成功
					UI.alert({ message: Global.lang.m29});
					// 关闭弹窗
					self.$el.find('.close').trigger('click');
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
				progress.end();
			}, 'json');
		}
	});

	// 解除绑定
	var unbind = Backbone.View.extend({
		el: '#wristbandManagementUnbind',
		events: {
			'submit.submit form': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 表单数据
			this.addFormData();
		},
		render: function( id ) {
			var self = this;
			// 数据模型
			self.model = self.collection.get( id );
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				data: {id: id},
				type: 'post'
			}).done(function(data){
				var model = self.model.toJSON();
				model.cri = data.data.cri;
				// 渲染
				self.$el.find('.modal-body').html( template( 'wristbandManagementUnbindTpl', model ) );
				// iselect
				UI.iselect( self.$el.find('select'), {handlezIndex: true} );
				// 显示
				UI.dialog( self.$el );
				// 删除字段
				self.model.set({wat: ''});
			});
		},
		// 解除绑定
		submit: function() {
			var self = this;
			this.setFormData();
			// param 参数
			var param = $(this.form).serializeArray();
			
			// 开启进度
			progress.start('L');
			
			$.http({
				url: Global.path + '/watch/unBindWatchId.do',
				data: param,
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				if ( data.status == 0 ) {
					view.ins.refresh();
					// 提示成功
					UI.alert({ message: data.msg });
					// 关闭弹窗
					self.$el.find('.close').trigger('click');
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			}).always(function(data){
				// 关闭进度
				progress.start('L');
			});
		}
	});
	// 变更绑定
	var change = Backbone.View.extend({
		el: '#wristbandManagementChange',
		events: {
			// 扫描监听
			// 'change.scans [data-event=scans]': 'scans',
			// 提交数据
			'submit.submit form': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
		},
		render: function( id ) {
			var self = this;
			// 数据模型
			self.model = self.collection.get( id );
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				data: {id: id},
				type: 'post'
			}).done(function(data){
				var model = self.model.toJSON();
				model.cri = data.data.cri;
				// 上一次的id
				// this.lastWatId = model.wat.watId;
				self.lastWatId = model.watNum;
				// 渲染
				self.$el.find('.modal-body').html( template( 'wristbandManagementChangeTpl', model ) );
				// 表单数据
				self.addFormData();
				// 验证
				self.validate();
				// iselect
				UI.iselect( self.$el.find('select'), {handlezIndex: true} );
				// 显示
				UI.dialog( self.$el );
			});
			
		},
		/**
		 * 监听扫描腕带编号
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		scans: function( event ) {
			var con = event.currentTarget;
			// 替换掉上次的wat_id
			con.value = con.value.replace( this.lastWatId, '' );
			// 重新变更wat_id值
			this.lastWatId = con.value;
		},
		/**
		 * 变更提交
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			this.setFormData();
			// param 参数
			var param = $(this.form).serializeArray();
			// 获取重设param中的watNum16进制
			param.forEach(function(item){
				if (item.name === 'newWatNum') {
					item.value = parseInt(item.value, 16);
				}
			});
			// 开启进度
			progress.start('L');
			// 提交
			$.http({
				url: Global.path + '/watch/changeWatchId.do',
				data: param,
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				if ( data.status == 0 ) {
					// 重新渲染列表
					view.ins.refresh();
					// 提示成功
					UI.alert({ message: data.msg });
					// 关闭弹窗
					self.$el.find('.close').trigger('click');
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			}).always(function(data){
				// 开启进度
				progress.end();
			})
		}
	})
	// 修改人员信息
	var edit = Backbone.View.extend({
		el: '#wristbandManagementEdit',
		events: {
			// 扫描监听 sss
			// 'change.scans [data-event=scans]': 'scans',
			// 提交数据
			'submit.submit form': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
		},
		render: function( id ) {
			var self = this;
			// 数据模型
			self.model = self.collection.get( id );
			var model = self.model.toJSON();
			// 渲染
			this.$el.find('.modal-body').html( template( 'wristbandManagementEditTpl', model ) );
			// 表单数据
			this.addFormData();
			// 验证
			this.validate();
			// iselect
			UI.iselect( this.$el.find('select'), {handlezIndex: true} );
			// 显示
			UI.dialog( this.$el );
			// 加载联动
			TripleNumberLink.init({
				$pco: this.$el.find('[data-name=pcoId]'),
				$plo: this.$el.find('[data-name=ploId]'),
				$dorm: this.$el.find('[data-name=peoDorm]'),
				pcoId: model.pco ? model.pco.id : 'null' ,
				ploId: model.plo ? model.plo.id: 'null',
				handlezIndex: 10099
			});
		},
		/**
		 * 监听扫描腕带编号
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		scans: function( event ) {
			var con = event.currentTarget;
			// 替换掉上次的wat_id
			con.value = con.value.replace( this.lastWatId, '' );
			// 重新变更wat_id值
			this.lastWatId = con.value;
		},
		/**
		 * 变更提交
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this;
			this.setFormData();
			// param 参数
			var param = $(this.form).serializeArray();
			// 获取重设param中的watNum16进制
			param.forEach(function(item){
				if (item.name === 'newWatNum') {
					item.value = parseInt(item.value, 16);
				}
			});
			// 开启进度
			progress.start('L');
			// 提交
			$.http({
				url: Global.path + '/a/per/admPeopleInfo/updatePloAndDorm',
				data: param,
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				if ( data.status == 0 ) {
					// 重新渲染列表
					view.ins.refresh();
					// 提示成功
					UI.alert({ message: data.msg });
					// 关闭弹窗
					self.$el.find('.close').trigger('click');
				} else {
					// 提示异常
					UI.alert({ message: data.msg, type: 'danger', container: self.$el.find('.alert-container') });
				}
			}).always(function(data){
				// 开启进度
				progress.end();
			})
		}
	})

	wristbandManagement.model 		= model;
	wristbandManagement.collection 	= collection;
	wristbandManagement.view 		= view;
	wristbandManagement.bind 		= bind;
	wristbandManagement.unbind 		= unbind;
	wristbandManagement.change 		= change;
	wristbandManagement.edit 		= edit;
	return wristbandManagement;

});
