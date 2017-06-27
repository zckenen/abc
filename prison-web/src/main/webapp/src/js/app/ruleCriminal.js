define(['global', 'pagination', 'areaLinkpage', 'tripleNumberLink'], function(Global, Pagination, AreaLinkpage, TripleNumberLink){
	var RuleCriminal = {

	};

	// 是否已经获取过人员
	var _isGetPeo = false,
		_peos,
		_getPeo = function() {
			if ( _isGetPeo ) {
				return true;
			} else {
				return $.http({
					url: Global.path + '/main/loadGroupAndpeoInfo.do',
					type: 'post',
					dataType: 'json'
				}).done(function(data){
					_isGetPeo = true;
					_peos = data.data;
				});
			}
		};
	// 是否已经获取过区域
	var _isGetLoc = false,
		_locs,
		_getLoc = function() {
			if ( _isGetLoc ) {
				return true;
			} else {
				return $.http({
					url: Global.path + '/main/loadCooPicLoc.do',
					type: 'post',
					dataType: 'json'
				}).done(function(data){
					_isGetLoc = true;
					_locs = data.data;
				});
			}
		};

	var view = Backbone.View.extend({
		el: '#ruleCriminal',
		events: {
			// 禁区
			'click [data-event=ruleForbidden]': 'ruleForbidden',
			// 逃脱规则
			'click [data-event=ruleEscape]': 'ruleEscape',
			// 独处
			'click [data-event=ruleAlone]': 'ruleAlone',
			// 滞留
			'click [data-event=ruleStranded]': 'ruleStranded',
			// 关闭tab
			'click [data-event=close]': 'close'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 时间组件初始化
		},
		/**
		 * 禁区规则
		 * @return {[type]} [description]
		 */
		ruleForbidden: function() {
			// 重置设置url以及模板
			viewList.ins.set({
				type: '禁区',
				listURL: Global.path + '/rule/forbidden/list',
				saveURL: Global.path + '/rule/forbidden/save',
				delURL: Global.path + '/rule/forbidden/delete',
				viewId: 'ruleForbidden',
				containerId: 'ruleForbiddenList',
				templateId: 'ruleForbiddenListTpl'
			});
			// 展示列表
			viewList.ins.list();
			// this.closeTab();
		},
		/**
		 * 逃脱规则
		 * @return {[type]} [description]
		 */
		ruleEscape: function() {
			// 重置设置url以及模板
			viewList.ins.set({
				type: '逃脱',
				listURL: Global.path + '/rule/escape/list',
				saveURL: Global.path + '/rule/escape/save',
				delURL: Global.path + '/rule/escape/delete',
				viewId: 'ruleEscape',
				containerId: 'ruleEscapeList',
				templateId: 'ruleEscapeListTpl'
			});
			// 展示列表
			viewList.ins.list();
			// this.closeTab();
		},
		/**
		 * 独处规则
		 * @return {[type]} [description]
		 */
		ruleAlone: function() {
			// 重置设置url以及模板
			viewList.ins.set({
				type: '独处',
				listURL: Global.path + '/rule/stayAlone/list',
				saveURL: Global.path + '/rule/stayAlone/save',
				delURL: Global.path + '/rule/stayAlone/delete',
				viewId: 'ruleAlone',
				containerId: 'ruleAloneList',
				templateId: 'ruleAloneListTpl'
			});
			// 展示列表
			viewList.ins.list();
			// this.closeTab();
		},
		/**
		 * 滞留规则
		 * @return {[type]} [description]
		 */
		ruleStranded: function() {
			// 重置设置url以及模板
			viewList.ins.set({
				type: '滞留',
				listURL: Global.path + '/rule/retention/list',
				saveURL: Global.path + '/rule/retention/save',
				delURL: Global.path + '/rule/retention/delete',
				viewId: 'ruleStranded',
				containerId: 'ruleStrandedList',
				templateId: 'ruleStrandedListTpl'
			});
			// 展示列表
			viewList.ins.list();
			// this.closeTab();
		},
		/**
		 * 手动关闭tab
		 * @return {[type]} [description]
		 */
		close: function( event ) {
			var $con = $(event.currentTarget);
			// 移除
			$con.closest('li').remove();
			// 获取类型
			var type = $con.closest('a').attr('data-type');
			// 切换
			this[ type ].call(this);
			// 添加样式
			var $a = this.$el.find('[data-event='+ type +']');
			$a.parent().addClass('active');
			var id = $a.attr('href');
			$(id).addClass('active in').siblings('.active').removeClass('in active');
		}
	});

    var noticeList = Backbone.View.extend({
    	el: '#ruleNotice',
		events: {
			// 禁区
			'click [data-event=submit]': 'submit',
		},
		initialize: function() {
			var self = this;
			this.$el = $(this.el);
			this.$start = this.$el.find('[name=startTime]');
			this.$end = this.$el.find('[name=endTime]');

			UI.timepicker(this.$start);
			UI.timepicker(this.$end);
		},
		render: function() {
			var self = this;
			$.http({
				url: Global.path + '/rule/nightRule/list',
				dataType: 'json',
				type: 'post',
			}).done(function(data){
				var model = data.data[0];
				self.$start.val(model.startTime);
				self.$end.val(model.endTime);
			});
		},
		submit: function() {
			var startTime = this.$start.val();
			var sa = startTime.split(':');
			var endTime = this.$end.val();
			var ea = endTime.split(':');

			if (sa[0] * 1 < 10) {
				startTime = '0' + startTime;
			}

			if (ea[0] * 1 < 10) {
				endTime = '0' + endTime;
			}


			var param = {
				startTime: startTime,
				endTime: endTime
			};
			$.http({
				url: Global.path + '/rule/nightRule/save',
				dataType: 'json',
				data: param,
				type: 'post'
			}).done(function(data){
				if (data.status === 0) {
					UI.alert({ message: data.msg, type: 'success' });
				} else {
					UI.alert({ message: data.msg, type: 'danger', container: $form });
				}
			})
		}
    })

	/**
	 * 清洗数据
	 * @param {Obejct} data 列表数据
	 * @return {Object} 数据清洗
	 */
	var _clean = function( data ) {
		var rs = {};
		data && data.forEach(function(item){
			var tmp;
			if ( !(tmp = rs[ item.remark ]) ) {
				tmp = rs[ item.remark ] = item;
				tmp.peoList = [];
				tmp.ids = [];
				tmp.watNums = [];
				tmp.idWatRom = {};
			}
			tmp.peoList.push( item.peo );
			tmp.ids.push( item.id );
			tmp.watNums.push( item.watNum );
			tmp.idWatRom[ item.watNum ] = item.id;
		});	

		return _.values( rs );
	};

	var viewList = Backbone.View.extend({
		el: '', // #ruleForbidden
		events: {
			// 刷新
			'click [data-event=refresh]': 'refresh',
			// 添加
			'click [data-event=add]': 'add',
			// 删除
			'click [data-event=del]': 'del',
			// 修改
			'click [data-event=edit]': 'edit',
			// 启用与停用
			'click [data-event=changeStatus]': 'changeStatus',
			// 区域详情
			'click [data-event=locView]': 'locView'
		},
		initialize: function() {
			this.$el = $(this.el);
		},
		/**
		 * 设置模板url等信息
		 * @param {Object} options 参数
		 */
		set: function( options ) {
			viewList.ins.setElement( document.getElementById(options.viewId) );
			this.type = options.type;
			this.listURL = options.listURL;
			this.saveURL = options.saveURL;
			this.delURL = options.delURL;
			this.templateId = options.templateId;
			this.viewId = options.viewId;
			// 列表容器
			this.$list = this.$el.find('#' + options.containerId);
			// 将搜索的表单的form元素写入属性中
			this.addFormData();
		},
		/**
		 * 规则列表显示
		 * @return {[type]} [description]
		 */
		list: function(pageNo, param) {
			var self = this;
			// 开启进度
			progress.start('L');
			// 获取数据
			$.http({
				url: this.listURL,
				dataType: 'json',
				type: 'post'
			}).always(function(data){
				self.data = _clean( data.data );
				self.data.type = self.type;
				// 执行渲染
				self.render( self.data );
				// 关闭进度
				progress.end();
			});
		},
		/**
		 * 渲染
		 * @param {Object} data 列表数据
		 * @return {[type]} [description]
		 */
		render: function( data ) {
			var self = this,
				content = '';
			// 遍历渲染
			data && data.forEach(function(item, i){
				item.index = ++i;
				// 判断时间频率
				if ( item.rlTimeRate != 0 ) {
					item.rlTimeRateTxt = '每周' + item.rlTimeRate;
				} else {
					item.rlTimeRateTxt = '每日';
				}
				content += template( self.templateId , item);
			});
			self.$list.html( content );

			UI.tooltips( self.$list.find('[data-toggle=tooltip]') );
		},
		/**
		 * 刷新当前页面
		 * @return {[type]} [description]
		 */
		refresh: function() {
			var param = this.searchFormData();
			// 获取列表数据
			this.list();
		},
		/**
		 * 列表搜索
		 * @return {[type]} [description]
		 */
		search: function () {
			var param = this.searchFormData();
			// 获取列表数据
			this.list(param);
		},
		/**
		 * 添加一条禁区规则
		 * @return {[type]} [description]
		 */
		add: function() {
			!Add.ins ? Add.ins = new Add() : '';
			// 显示添加页面
			Add.ins.show( this );
		},
		/**
		 * [edit description]
		 * @param {Object} event 事件对象
		 * @return {[type]} [description]
		 */
		edit: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			!Edit.ins ? Edit.ins = new Edit() : '';
			// 获取数据
			var data = self.data.filter(function(item){
				return item.id === id;
			});
			// 显示添加页面
			Edit.ins.render( data[0], this );
		},
		/**
		 * 删除一条规则
		 * @param {Object} event [description]
		 * @return {[type]} [description]
		 */
		del: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id'),
				watNum = event.currentTarget.getAttribute('data-watnum');
			// 确认后再删除
			UI.confirm('', function(){
				// 获取数据
				var res = self.data.filter(function(item){
					return item.id == id;
				});

				res = res[0];
				// 参数
				var param = [];
				// 需要传递的参数
				res.ids.forEach(function(id, i){
					var temp = {
						id: id,
						watNum: res.watNums[ i ]
					};
					// 放入primose中
					param.push({
						url: self.delURL,
						type: 'post',
						dataType: 'json',
						data: temp
					});
				});
				$.http(param).done(function(data){
					UI.alert({ message: Global.lang.m5 });
					// 重新读取渲染
					self.list();
				});
			});
		},
		/**
		 * 改变启用与停用状态
		 * @param  {Object} event 事件对象
		 * @return {[type]}       [description]
		 */
		changeStatus: function( event ) {
			var self = this,
				con = event.currentTarget,
				rlState = con.getAttribute('data-status'),
				id = con.getAttribute('data-id');
			// 获取数据
			var data = self.data.filter(function(item){
				return item.id === id;
			});
			data = data[0];
			// 请求改变
			var param = [];
			data.ids.forEach(function(id){
				var temp = {
					id: id,
					rlState: rlState
				};
				// 放入primose中
				param.push({
					url: self.saveURL,
					type: 'post',
					dataType: 'json',
					data: temp
				});
			});
			$.http(param).done(function(data){
				UI.alert({ message: Global.lang.m3 });
				// 重新读取渲染
				self.list();
			});
		},
		/**
		 * 查看区域详情
		 * @return {[type]} [description]
		 */
		locView: function( event ) {
			var self = this,
				ids = $(event.currentTarget).attr('id').split(',');
				rs = _getLoc(),
				$container = $('#ruleLocView'),
				$box = $container.find('.modal-body'),
				content = '';

			var render = function( data, ids ) {
				// 遍历
				data.forEach(function(item, i){
					item.index = i;
					item.locList = ids;
					content += template('ruleLocSetTpl', item);
				});
				$box.find('#locView').html( content );
				// 属性菜单
				UI.tree( $box.find('>div'), {plugins: ['wholerow', 'checkbox', 'types']} );
				// 弹出
				UI.dialog( $container );
			};
			if ( rs !== true ) {
				rs.done(function(data){
					render( data.data, ids );
				});
			} else {
				render( _locs, ids );
			}
		}
	});


	var Add = Backbone.View.extend({
		el: '#ruleCriminalAdd',
		events: {
			// 提交添加保存
			'submit form': 'submit',
			// 增加时间范围
			'click [data-event=addTimeRange]': 'addTimeRange',
			// 删除时间范围
			'click [data-event=delTimeRange]': 'delTimeRange'
		},
		initialize: function() {
			this.$el = $(this.el);
			// tab头部
			this.$tabHeader = $('#ruleTabHeader');
			// 下拉选择
			UI.iselect(this.$el.find('.iselect'));
			// 提示
			UI.tooltips( this.$el.find('[data-toggle=tooltips]') );
			// 时间组件
			UI.timepicker( this.$el.find('.timepicker') );
			// 获取人员
			this.peoSet();
			// 获取区域
			this.locSet();
			// 获取表单
			this.addFormData();
			// 表单验证
			this.validate();
		},
		/**
		 * 增加时间范围
		 * @param {[type]} event [description]
		 */
		addTimeRange: function( event ) {
			var self = this,
				con = event.currentTarget,
				$ul = $(con).next();
			// 增加一个节点
			$ul.append( template('ruleTimeRangeSetTpl', {}) );
		},
		/**
		 * 删除区域范围
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		delTimeRange: function( event ) {
			var self = this,
				con = event.currentTarget;
			$(con).closest('li').remove();
		},
		/**
		 * 人员设置
		 * @return {[type]} [description]
		 */
		peoSet: function() {
			var self = this,
				$container = this.$el.find('#rulePeoSet'),
				content = '';
			// 渲染
			var render = function( data ) {
				// 遍历
				data.forEach(function(item, i){
					item.index = i;
					item.watNums = [];
					content += template('rulePeoSetTpl', item);
				});
				$container.find('>ul').html( content );
				// 属性菜单
				UI.tree( $container, {plugins: ['wholerow', 'checkbox', 'types']} );
			};
			// 获取人员
			var rs = _getPeo();
			if ( rs !== true ) {
				rs.done(function(data){
					render(data.data);
				});
			} else {
				render( _peos );
			}
		},
		/**
		 * 区域设置
		 * @return {[type]} [description]
		 */
		locSet: function() {
			var self = this,
				$container = this.$el.find('#ruleLocSet'),
				content = '';
			// 渲染
			var render = function( data ) {
				// 遍历
				data.forEach(function(item, i){
					item.index = i;
					item.locList = [];
					content += template('ruleLocSetTpl', item);
				});
				$container.find('>ul').html( content );
				// 属性菜单
				UI.tree( $container, {plugins: ['wholerow', 'checkbox', 'types']} );
			};
			// 获取区域
			var rs = _getLoc();
			if ( rs !== true ) {
				rs.done(function(data){
					render(data.data);
				});
			} else {
				render( _peos );
			}
		},
		/**
		 * 显示弹窗
		 * @param {Object} view 列表视图实例
		 * @return {[type]} [description]
		 */
		show: function( view ) {
			// 创建tab标签
			this.$tab = $('<li>');
			this.$a = $('<a>').attr({
				'href': '#tab-rule-add',
				'data-toggle': 'tab',
				'data-type': view.viewId,
				'id': 'tabCloseAdd'
			})
			.addClass('tab-close')
			.appendTo( this.$tab );
			$('<font>').html('规则添加').appendTo( this.$a );
			$('<span>').attr({
				'class': 'glyphicons glyphicons-remove',
				'data-event': 'close'
			}).appendTo( this.$a );
			// 插入
			// 判断是否已经存在标签
			if ( $('#tabCloseAdd').length === 0 ) {
				this.$tab.appendTo( this.$tabHeader );
				// 模拟点击
				this.$a.trigger('click');
			} else {
				$('#tabCloseAdd').trigger('click');
			}
			
			// 更换标题
			this.$el.find('#ruleTypeName').html( view.type );
			this.view = view;
			// 如果是独处或聚众开启人数
			if ( view.viewId == 'ruleAlone' ) {
				this.$el.find('[name=num]').prop('disabled', false);
			} else {
				this.$el.find('[name=num]').val(1).prop('disabled', true);
			}
		},
		/**
		 * 提交保存
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this,
				// 表单
				$form = $(self.form);
			// 获取人员watNum
			var wats = [];
			self.$el.find('#rulePeoSet').jstree().get_checked(true).forEach(function(item){
				var watnum;
				if ( watnum = item['a_attr']['data-watnum'] ) {
					wats.push( watnum );
				}
			});
			// 获取区域id
			var locs = [];
			self.$el.find('#ruleLocSet').jstree().get_checked(true).forEach(function(item){
				var locId;
				if ( locId = item['a_attr']['data-loc'] ) {
					locs.push( locId );
				}
			});
			locs = locs.join(',');
			// 获取时间频率
			var rlTimeRate = $form.find('[name=rlTimeRate]').val();
			if ( rlTimeRate.indexOf('0') > -1 ) {
				rlTimeRate = 0;
			} else {
				rlTimeRate = rlTimeRate.join(',');
			}
			// 获取时间段
			var rlTimeRange = '',
				$start = $form.find('[name=rlTimeRangeStart]'),
				$end = $form.find('[name=rlTimeRangeEnd]');
			$start.each(function(i){
				rlTimeRange += this.value + '-' +  $end[ i ].value + ';';
			});
			// 是否选中启用
			var rlState = $form.find('[name=rlState]')[0];
			rlState.checked ? rlState = 1 : rlState = 0;
			// 其它值
			var rlTimeset = $form.find('[name=rlTimeset]').val(),
				rlType =  $form.find('[name=rlType]').val(),
				remark = (new Date).getTime(),
				num = $form.find('[name=num]').val();
			// 判断是否有区域或人员
			if ( wats.length === 0 ) {
				UI.alert({ message: Global.lang.m23, type: 'warning'});
				return;
			}
			if ( locs.length === 0 ) {
				UI.alert({ message: Global.lang.m27, type: 'warning'});
				return;
			}
			// 需要传递的参数
			var param = [];
			wats.forEach(function(wat){
				var temp = {
					watNum: wat,
					num: num,
					rlTimeRate: rlTimeRate,
					rlTimeRange: rlTimeRange,
					rlTimeset: rlTimeset,
					rlType: rlType,
					rlLocIds: locs,
					rlState: rlState,
					remark: remark
				};
				// 放入primose中
				param.push({
					url: self.view.saveURL,
					type: 'post',
					dataType: 'json',
					data: temp
				});
			});
			// 请求
			$.http(param).done(function(){
				// 提示成功
				UI.alert({ message: Global.lang.m4 });
				// 关闭当前弹窗
				$('#tabCloseAdd').find('[data-event=close]').trigger('click');
			});
			return false;
		}
	});

	var Edit = Backbone.View.extend({
		el: '#ruleCriminalEdit',
		events: {
			// 提交添加保存
			'submit form': 'submit',
			// 增加时间范围
			'click [data-event=addTimeRange]': 'addTimeRange',
			// 删除时间范围
			'click [data-event=delTimeRange]': 'delTimeRange'
		},
		initialize: function() {
			this.$el = $(this.el);
			// tab头部
			this.$tabHeader = $('#ruleTabHeader');
		},
		/**
		 * 渲染修改页面
		 * @param  {Object} data 规则数据
		 * @param {Object} view 列表视图实例
		 * @return {[type]}      [description]
		 */
		render: function( data, view ) {
			// 创建tab标签
			this.$tab = $('<li>');
			this.$a = $('<a>').attr({
				'href': '#tab-rule-edit',
				'data-toggle': 'tab',
				'data-type': view.viewId,
				'id': 'tabCloseEdit'
			})
			.addClass('tab-close')
			.appendTo( this.$tab );
			$('<font>').html('规则修改').appendTo( this.$a );
			$('<span>').attr({
				'class': 'glyphicons glyphicons-remove',
				'data-event': 'close'
			}).appendTo( this.$a );
			// 添加到节点
			if ( $('#tabCloseEdit').length === 0 ) {
				this.$tab.appendTo( this.$tabHeader );
				// 模拟点击
				this.$a.trigger('click');
			} else {
				$('#tabCloseEdit').trigger('click');
			}
			
			// 模拟点击
			this.$a.trigger('click');
			// 设置数据
			this.data = data;
			// 渲染各种数据
			// 渲染各种数据
			if ( typeof data.rlTimeRange !== 'Object' ) {
				var range = this.data.rlTimeRange.split(';'),
					rlTimeRange = [],
					rlTimeRate = this.data.rlTimeRate.split(',');
				// 弹出最后一位
				range.pop();
				// 遍历插入数据
				range.forEach(function(item){
					var temp = item.split('-');
					rlTimeRange.push({
						start: temp[0],
						end: temp[1]
					});
				});
				this.data.rlTimeRange = rlTimeRange;
				this.data.rlTimeRate = rlTimeRate;
			}
			// 渲染
			this.$el.html( template('ruleForbiddenEditTpl', this.data) );
			// 更换标题
			this.$el.find('#ruleTypeName').html( view.type );
			this.view = view;
			// 如果是独处或聚众开启人数
			if ( view.viewId == 'ruleAlone' ) {
				this.$el.find('[name=num]').prop('disabled', false);
			} else {
				this.$el.find('[name=num]').val(1).prop('disabled', true);
			}
			// 下拉选择
			UI.iselect(this.$el.find('.iselect'));
			// 提示
			UI.tooltips( this.$el.find('[data-toggle=tooltips]') );
			// 时间组件
			UI.timepicker( this.$el.find('.timepicker') );
			// 获取人员
			this.peoSet();
			// 获取区域
			this.locSet();
			// 获取表单
			this.addFormData();
			// 表单验证
			this.validate();
		},
		/**
		 * 人员树
		 * @return {[type]} [description]
		 */
		peoSet: function() {
			var self = this,
				$container = self.$el.find('#rulePeoSetEdit'),
				content = '',
				// 人员集合id
				watNums = self.data.watNums;
			// 渲染
			var render = function( data ) {
				// 遍历
				data.forEach(function(item, i){
					item.index = i;
					item.watNums = watNums;
					content += template('rulePeoSetTpl', item);
				});
				$container.find('>ul').html( content );
				// 属性菜单
				UI.tree( $container, {plugins: ['wholerow', 'checkbox', 'types']} );
				
			};
			// 获取人员
			var rs = _getPeo();
			if ( rs !== true ) {
				rs.done(function(data){
					render(data.data);
				});
			} else {
				render( _peos );
			}
		},
		/**
		 * 区域设置
		 * @return {[type]} [description]
		 */
		locSet: function() {
			var self = this,
				$container = this.$el.find('#ruleLocSetEdit'),
				content = '',
				locList = self.data.rlLocIds.split(',');
			// 渲染
			var render = function( data ) {
				// 遍历
				data.forEach(function(item, i){
					item.index = i;
					item.locList = locList;
					content += template('ruleLocSetTpl', item);
				});
				$container.find('>ul').html( content );
				// 属性菜单
				UI.tree( $container, {plugins: ['wholerow', 'checkbox', 'types']} );
			};
			// 获取人员
			var rs = _getLoc();
			if ( rs !== true ) {
				rs.done(function(data){
					render(data.data);
				});
			} else {
				render( _locs );
			}
		},
		/**
		 * 提交保存
		 * @return {[type]} [description]
		 */
		submit: function() {
			var self = this,
				// 修改表单
				$form = $(self.form),
				// 获取人员watNum
				wats = [];
			self.$el.find('#rulePeoSetEdit').jstree().get_checked(true).forEach(function(item){
				var watnum;
				if ( watnum = item['a_attr']['data-watnum'] ) {
					wats.push( watnum );
				}
			});
			// 获取区域id
			var locs = [];
			self.$el.find('#ruleLocSetEdit').jstree().get_checked(true).forEach(function(item){
				var locId;
				if ( locId = item['a_attr']['data-loc'] ) {
					locs.push( locId );
				}
			});
			locs = locs.join(',');
			// 获取时间频率
			var rlTimeRate = $form.find('[name=rlTimeRate]').val();
			if ( rlTimeRate.indexOf('0') > -1 ) {
				rlTimeRate = 0;
			} else {
				rlTimeRate = rlTimeRate.join(',');
			}
			// 获取时间段
			var rlTimeRange = '',
				$start = $form.find('[name=rlTimeRangeStart]'),
				$end = $form.find('[name=rlTimeRangeEnd]');
			$start.each(function(i){
				rlTimeRange += this.value + '-' +  $end[ i ].value + ';';
			});
			// 其它值
			var rlTimeset = $form.find('[name=rlTimeset]').val(),
				rlType =  $form.find('[name=rlType]').val(),
				remark = self.data.remark,
				num = $form.find('[name=num]').val();
			// 需要传递的参数
			var param = [];
			// 集合比对
			var // 交集需要修改的
				watas = _.intersection(wats, self.data.watNums),
				// 差集1,需要增加的人员
				watbs = _.difference(wats, self.data.watNums),
				// 差集2,需要删除的人员
				watcs = _.difference(self.data.watNums, wats);
			// 判断是否有区域或人员
			if ( watas.length === 0 && watbs.length === 0 && watcs.length === 0 ) {
				UI.alert({ message: Global.lang.m23, type: 'warning'});
				return;
			}

			if ( locs.length === 0 ) {
				UI.alert({ message: Global.lang.m27, type: 'warning'});
				return;
			}
			// 修改提交请求
			watas.forEach(function(wat){
				var temp = {
					id: self.data.idWatRom[ wat ],
					watNum: wat,
					num: num,
					rlTimeRate: rlTimeRate,
					rlTimeRange: rlTimeRange,
					rlTimeset: rlTimeset,
					rlType: rlType,
					rlLocIds: locs,
					rlState: 1,
					remark: remark
				};
				// 放入primose中
				param.push({
					url: self.view.saveURL,
					type: 'post',
					dataType: 'json',
					data: temp
				});
			});
			// 添加提交请求
			watbs.forEach(function(wat){
				var temp = {
					watNum: wat,
					num: num,
					rlTimeRate: rlTimeRate,
					rlTimeRange: rlTimeRange,
					rlTimeset: rlTimeset,
					rlType: rlType,
					rlLocIds: locs,
					rlState: 1,
					remark: remark
				};
				// 放入primose中
				param.push({
					url: self.view.saveURL,
					type: 'post',
					dataType: 'json',
					data: temp
				});
			});
			// 删除提交请求
			watcs.forEach(function(wat){
				var temp = {
					id: self.data.idWatRom[ wat ],
					watNum: wat
				};
				// 放入primose中
				param.push({
					url: self.view.delURL,
					type: 'post',
					dataType: 'json',
					data: temp
				});
			});
			// 请求
			$.http(param).done(function(){
				// 提示成功
				UI.alert({ message: Global.lang.m3 });
				// 关闭当前弹窗
				$('#tabCloseEdit').find('[data-event=close]').trigger('click');
			});
			return false;
		}
	});


	RuleCriminal.init = function( pageNo ) {
		// 实例化tab视图
		!view.ins ? view.ins = new view : '';
		// 实例化列表
		!viewList.ins ? viewList.ins = new viewList : '';
		// 重置设置url以及模板
		viewList.ins.set({
			type: '禁区',
			listURL: Global.path + '/rule/forbidden/list',
			saveURL: Global.path + '/rule/forbidden/save',
			delURL: Global.path + '/rule/forbidden/delete',
			viewId: 'ruleForbidden',
			containerId: 'ruleForbiddenList',
			templateId: 'ruleForbiddenListTpl'
		});
		// 展示列表
		viewList.ins.list();
		// 通知
		!noticeList.ins ? noticeList.ins = new noticeList : '';
		noticeList.ins.render();
	};

	return RuleCriminal;
});