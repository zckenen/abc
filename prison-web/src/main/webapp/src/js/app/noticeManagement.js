/* 民警管理模块 */
/* eventManagement */
define(['global', 'pagination', 'areaLinkpage', 'tripleNumberLink'], function(Global, Pagination, AreaLinkpage, TripleNumberLink){
	var noticeManagement = {

	};
	
	// 模型
	var model = Backbone.Model.extend({
		idAttribute: 'id'
	});

	// 数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		// 模型名字
		modelName: 'data',
		modelSubName: 'list',
	}))();

	// 视图
	var view = Backbone.View.extend({
		el: '#noticeManagement',
		events: {
			// 搜索
			'click.search [data-event=search]': 'search',
			// 刷新
			'click.refresh [data-event=refresh]': 'refresh',
			'click [data-event=bindWatch]': 'bindWatch',
			'click [data-event=bindBed]': 'bindBed',
			'click [data-event=bindWrk]': 'bindWrk',
			'click [data-event=bindGroup]': 'bindGroup',
			'click [data-event=bindSet]': 'bindSet',
			'click [data-event=ignore]': 'ignore'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
			// 初始化排序
			this.initSort();
			// 获取并渲染数据
			this.list(1);

			// $('#noticeWatchSubmit').on('click', function(){
			// 	var $con = $(this);
			// 	var $form = $con.closest('form');
			// 	$.http({
			// 		url: Global.path + '/watch/bindWatchId.do',
			// 		data: $form.serializeArray(),
			// 		dataType: 'json',
			// 		type: 'post'
			// 	}).done(function(data){
			// 		if (data.status === 0) {
			// 			$con.next().trigger('click');
			// 			self.render();
			// 		} else {
			// 			UI.alert({ message: data.msg, type: 'danger', container: $form });
			// 		}
			// 	});
			// });
			// $('#noticeBedSubmit').on('click', function(){
			// 	var $con = $(this);
			// 	var $form = $con.closest('form');
			// 	$.http({
			// 		url: Global.path + '/a/per/admPeopleInfo/bindBedId',
			// 		data: $form.serializeArray(),
			// 		dataType: 'json',
			// 		type: 'post'
			// 	}).done(function(data){
			// 		if (data.status === 0) {
			// 			$con.next().trigger('click');
			// 			self.render();
			// 		} else {
			// 			UI.alert({ message: data.msg, type: 'danger', container: $form });
			// 		}
			// 	});
			// });
			// $('#noticeWrkSubmit').on('click', function(){
			// 	var $con = $(this);
			// 	var $form = $con.closest('form');
			// 	$.http({
			// 		url: Global.path + '/a/per/admPeopleInfo/bindWorkerId',
			// 		data: $form.serializeArray(),
			// 		dataType: 'json',
			// 		type: 'post'
			// 	}).done(function(data){
			// 		if (data.status === 0) {
			// 			$con.next().trigger('click');
			// 			self.render();
			// 		} else {
			// 			UI.alert({ message: data.msg, type: 'danger', container: $form });
			// 		}
			// 	});
			// });
			// $('#noticeGroupSubmit').on('click', function(){
			// 	var $con = $(this);
			// 	var $form = $con.closest('form');
			// 	$.http({
			// 		url: Global.path + '/a/per/admPeopleInfo/updatePloAndDorm',
			// 		data: $form.serializeArray(),
			// 		dataType: 'json',
			// 		type: 'post'
			// 	}).done(function(data){
			// 		if (data.status === 0) {
			// 			$con.next().trigger('click');
			// 			self.render();
			// 		} else {
			// 			UI.alert({ message: data.msg, type: 'danger', container: $form });
			// 		}
			// 	});
			// });


		},
		bindWatch: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeWatchBind');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=peoId]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
		},
		bindGroup: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeGroupSet');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
		
			TripleNumberLink.init({
				$pco: $container.find('[data-name=pcoId]'),
				$plo: $container.find('[data-name=ploId]'),
				pcoId: con.getAttribute('data-pcoId'),
				ploId: 'null',
				handlezIndex: 10099
			});
		},
		bindBed: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeBedSet');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
			
			var arr = con.getAttribute('data-bedInfo');
			if (arr) {
				arr = arr.split('-');
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					cooId: arr[3],
					picId: arr[2],
					locId: arr[1],
					bedId: arr[0],
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					handlezIndex: true
				});
			}
		},
		bindWrk: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeWrkSet');
			UI.dialog($container);
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));
			
			var arr = con.getAttribute('data-wrkInfo');
			if (arr) {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$wrk: $container.find('[name=workerId]'),
					cooId: arr[3],
					picId: arr[2],
					locId: arr[1],
					wrkId: arr[0],
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$wrk: $container.find('[name=workerId]'),
					handlezIndex: true
				});
			}
		},
		bindSet: function(e) {
			var con = e.currentTarget;
			var $container = $('#noticeSet');
			UI.dialog($container);
			
			$container.find('[data-name=criChgId]').val(con.id);
			$container.find('[name=id]').val(con.getAttribute('data-id'));
			$container.find('[data-name=value]').val(con.getAttribute('data-value'));

			var arr = con.getAttribute('data-bedInfo');
			if (arr) {
				arr = arr.split('-');
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					cooId: arr[3],
					picId: arr[2],
					locId: arr[1],
					bedId: arr[0],
					handlezIndex: true
				});
			} else {
				AreaLinkpage.init({
					$coo: $container.find('[data-name=cooId]'),
					$pic: $container.find('[data-name=picId]'),
					$loc: $container.find('[data-name=locId]'),
					$bed: $container.find('[name=bedId]'),
					handlezIndex: true
				});
			}

			TripleNumberLink.init({
				$pco: $container.find('[data-name=pcoId]'),
				$plo: $container.find('[data-name=ploId]'),
				pcoId: con.getAttribute('data-pcoId'),
				ploId: 'null',
				handlezIndex: 10099
			});

		},
		ignore: function(e) {
			var con = e.currentTarget;
			var self = this;
			$.http({
				url: Global.path + '/a/per/admCriminalChange/save',
				type: 'post',
				dataType: 'json',
				data: {id: con.id, state: 1}
			}).done(function(data){
				if(data.status === 0) {
					self.refresh();
				}
			});
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
		 * 刷新当前页面
		 * @return {[type]} [description]
		 */
		refresh: function() {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(this.pageNo, param);
		},
		/**
		 * 切换
		 * @return {[type]} [description]
		 */
		toggle: function( event ) {
			status = event.currentTarget.getAttribute('data-status');
			// 读取列表
			var param = this.searchFormData();
			// 获取列表数据
			this.list(1, param);
		},
		// 获取列表数据
		// @pageNo 页码
		list: function(pageNo, param) {
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
			self.collection.url = Global.path + '/a/per/admCriminalChange/list';
			self.collection.fetch({
				data: data,
				type: 'post',
				success: function(collection, data, xhr) {
					// 执行渲染
					self.render();
					// 处理分页
					self.pagination({
						codes: self.parsePage( data.data ), 
						$el: self.$el.find('.pagination-container'),
						hash: 'notice/management/list/p'
					}, Pagination);
					// 关闭进度
					progress.end();
				}
			});
		},
		/**
		 * 渲染报警结果
		 * @param  {Object} $container 列表容器
		 * @param  {Object} data       数据
		 * @return {[type]}            [description]
		 */
		render: function() {
			var self = this,
				// 渲染容器
				$container = this.$el.find('tbody'),
				// 渲染内容
				content = '';
				model;
			// 遍历拼接内容
			collection.forEach(function(item, i){
				model = item.toJSON();
				if (model.id) {
					model.index = ++i;
					model.bedInfo = model.peo && model.peo.bedId ? model.bedId : '' + '-' +  model.bedLoc ? model.bedLoc.id : '' + '-' + model.bedPic ? model.bedPic.id : '' + '-' + model.bedCoo ?  model.bedCoo.id : '';
					model.wrkInfo = model.peo && model.peo.workerId ? model.workerId : '' + '-' + model.wrkLoc ? model.wrkLoc.id : '' + '-' + model.wrkPic ? model.wrkPic.id : '' + '-' + model.wrkCoo ? model.wrkCoo.id : '';
					content += template('noticeManagementListTpl', model);
				}
			});
			// 插入渲染容器中
			$container.html( content );
		}
	});


	noticeManagement.model 		= model;
	noticeManagement.collection  = collection;
	noticeManagement.view 		= view;

	return noticeManagement;
});