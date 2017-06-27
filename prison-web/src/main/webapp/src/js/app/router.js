define([
		'global',
		'init',
		'mainLoop',
		'overview',
		'fullTextSearch', 
		'areaFlat', 
		'areaBuilding', 
		'areaMap', 
		'areaFloor', 
		'areaRegion',
		'ruleCriminal',
		'rulePolice',
		'criminalManagement',
		'policeManagement',
		'wristbandManagement',
		'aerialManagement',
		'receptorManagement',
		'cameraManagement',
		'dataserverManagement',
		'realtimeMonitor',
		'realtimePlayback',
		'realtimeTrack',
		'realtimeViptrack',
		'eventManagement',
		'noticeManagement',
		'eventReview',
		'analysisRelation',
		'analysisHabit',
		'systemRole',
		'systemMenu',
		'systemUser',
		'placeWorker',
		'placeBed'
	],
	function(
		Global,
		Init,
		MainLoop,
		Overview,
		FullTextSearch, 
		AreaFlat, 
		AreaBuilding, 
		AreaMap, 
		AreaFloor,
		AreaRegion,
		RuleCriminal,
		RulePolice,
		CriminalManagement,
		PoliceManagement,
		WristbandManagement,
		AerialManagement,
		ReceptorManagement,
		CameraManagement,
		DataserverManagement,
		RealtimeMonitor,
		RealtimePlayback,
		RealtimeTrack,
		RealtimeViptrack,
		EventManagement,
		NoticeManagement,
		EventReview,
		AnalysisRelation,
		AnalysisHabit,
		SystemRole,
		SystemMenu,
		SystemUser,
		PlaceWorker,
		PlaceBed
	){
		// 上一调用的方法
		var lastClass = '';
		// 路由
		var Router = Backbone.Router.extend({
			routes: {
				'': 'overview', // 首页
				'overview': 'overview',  // 首页
				'area/building/list/p:page': 'areaBuilding', // 单幢建筑参考系
				'area/flat/:id': 'areaFlat', // 每一幢中所有的层
				'area/map/list': 'areaMap', // 坐标系原点
				'area/floor/list/p:page': 'areaFloor', // 楼层设置
				'area/region/list/p:page': 'areaRegion', // 楼层区域设置
				'rule/criminal/list/p:page': 'ruleCriminal', // 所有罪犯规则管理
				'rule/stranded/list/p:page': 'ruleStranded', // 罪犯滞留规则管理
				'rule/forbidden/list/p:page': 'ruleForbidden', // 罪犯禁区规则管理
				'rule/alone/list/p:page': 'ruleAlone', // 罪犯独处规则
				'rule/escape/list/p:page': 'ruleEscape', // 罪犯逃脱规则
				'rule/police/list/p:page': 'rulePolice', // 民警规则管理
				'criminal/management/list/p:page': 'criminalManagement', // 罪犯管理
				'police/management/list/p:page': 'policeManagement', // 民警管理
				'wristband/management/list/p:page': 'wristbandManagement', // 手环/胸牌管理
				'aerial/management/list/p:page': 'aerialManagement', // 天线管理
				'receptor/management/list/p:page': 'receptorManagement', // 接收机管理
				'camera/management/list/p:page': 'cameraManagement', // 接收机管理cameraManagement
				'dataserver/management/list/p:page': 'dataserverManagement', // DT服务器
				'realtime/monitor/:id': 'realtimeMonitor', // 实时视频监控
				'realtime/monitor': 'realtimeMonitor', // 实时视频监控
				'realtime/playback/:id': 'realtimePlayback', // 实时视频回放
				'realtime/viptrack': 'realtimeViptrack', // 重点罪犯追踪
				'realtime/track/:id': 'realtimeTrack', // 实时最终
				'event/management/list/p:page': 'eventManagement', // 报警时间回顾
				'notice/management/list/p:page': 'noticeManagement', // 报警时间回顾
				'event/review/:id': 'eventReview', // 时间回放
				'analysis/relation': 'analysisRelation', // 人员关系分析
				'analysis/habit': 'analysisHabit', // 生活习惯
				'system/role': 'systemRole', // 角色管理
				'system/menu': 'systemMenu', // 菜单管理
				'system/user/list/p:page': 'systemUser', // 用户管理	
				'place/worker/list/p:page': 'placeWorker', // 工位设置		
				'place/bed/list/p:page': 'placeBed',	// 床位设置
			},
			initialize: function() {
				this.main = $('#main');
				location.hash = '';
			},
			/**
			 * 显示与隐藏相关容器
			 * @param  {String} name 容器ID
			 * @return {[type]}      [description]
			 */
			show: function(name) {
				this.main.find('#' + name).show().siblings('div.content-box').hide();
				// 隐藏历史轨迹
				$('#historyRange').find('[data-event=hide]').trigger('click');
				// 所有视频暂停播放
				var videos = document.getElementsByTagName('video');

				$.each(videos, function(){
					this.pause();
				});
			},
			/**
			 * 用于有table列表页面
			 * @param  {[type]} options [description]
			 * // @options = { url, name,  collection}
				// @options.url 静态模板路径
				// @options.name 视图名
				// @options.collection 数据模型集合实例
				// @options.pageNo 当前页码
				 * @return {[type]}         [description]
			 */
			handleList: function( options ) {
				var self = this,
					// 视图
					view = options.kclass.view,
					// 模型集合
					collection = options.kclass.collection,
					// 处理返回页面
					promise = self.handleTpl( options.url, options.name );
				// promise返回修正
				if ( promise === true ) {
					view.ins.list( options.pageNo || 1 );
				} else {
					promise.done(function(){
						view.ins = new view({collection: collection});
					});
				}
			},
			/**
			 * 销毁视频播放器
			 * @return {[type]} [description]
			 */
			destory: function( name ) {
				if ( name !== 'realtimePlayback' ) {
					RealtimePlayback.view.ins ? RealtimePlayback.view.ins.destory(): '';
				}
				if ( name !== 'realtimeMonitor' ) {
					RealtimeMonitor.view.ins ? RealtimeMonitor.view.ins.destory(): '';
				}
				if ( name !== 'realtimeViptrack' ) {
					RealtimeViptrack.view.ins ? RealtimeViptrack.view.ins.stopTrack( true ) : ''; 
				}
				if ( name !== 'areaFlat' ) {
					AreaFlat.view.ins ? AreaFlat.view.ins.destory() : '';
				}
				if ( name !== '' && name !== 'overview' && name !== 'eventReview' ) {
					Overview.view.ins ? Overview.view.ins.destory() : '';
				}
			},
			/**
			 * [handleTpl description]
			 * @param  {String} url  页面路径
			 * @param  {String} name  content-box容器id
			 * @return {[type]}      [description]
			 */
			handleTpl: function( url, name ) {
				var self = this;
				// 调用销毁
				this.destory( name );
				// 判断页面是否已经存在
				if ( self.main.find('#' + name).length === 0 ) {
					return $.http({url: url}).done(function(html){
						// 加载模板
						self.main.append(html);
						// 显示当前模板容器并隐藏其他容器
						self.show( name );
					});
				} 
				// 显示当前模板容器并隐藏其他容器
				self.show( name );
				return true;
			},
			/**
			 * 首页
			 * @return {[type]} [description]
			 */
			overview: function() {
				var self = this;
				// 执行初始化
				Init();
				// 销毁实例
				this.destory('overview');
				// 实例化首页面视图
				if ( !Overview.view.ins ) {
					Overview.view.ins = new Overview.view();
					// 实例化搜索
					FullTextSearch.init();
				};
				Overview.view.ins.monitorStart();
				// 显示当前视图
				self.show('overview');
			},
			/**
			 * 幢管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			areaBuilding: function(pageNo) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/area/building.html', 
					name: 'areaBuilding',
					kclass: AreaBuilding,
					pageNo: pageNo
				});
			},
			/**
			 * 区域(监舍楼)楼层平面图
			 * @param  {[type]} id [description]
			 * @return {[type]}    [description]
			 */
			areaFlat: function( id ) {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/area/flat.html', 'areaFlat' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						AreaFlat.view.ins = new AreaFlat.view({collection: AreaFlat.collection});
						AreaFlat.view.ins.monitorStart( id );
					});
				}

				AreaFlat.view.ins.monitorStart( id );
			},
			/**
			 * 首页地图
			 * @return {[type]} [description]
			 */
			areaMap: function() {
				// 执行初始化
				Init();
				var promise = this.handleTpl( Global.path + '/src/tmpl/area/map.html', 'areaMap' );
				if ( promise !== true ) {
					return promise.done(function(){
						AreaMap.view.ins = new AreaMap.view({model: new AreaMap.model});
					});
				}
			},
			/**
			 * 楼层添加与设置
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			areaFloor: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/area/floor.html', 
					name: 'areaFloor',
					kclass: AreaFloor,
					pageNo: pageNo
				});
			},
			/**
			 * 楼层中的区域设置
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			areaRegion: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/area/region.html',
					name: 'areaRegion',
					kclass: AreaRegion,
					pageNo: pageNo
				})
			},
			/**
			 * 规则管理罪犯管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			ruleCriminal: function( pageNo ) {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/rule/criminal.html', 'ruleCriminal' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						RuleCriminal.init( pageNo )
					});
				}
			},
			/**
			 * 民警规则管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			rulePolice: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/rule/police.html',
					name: 'rulePolice',
					kclass: RulePolice,
					pageNo: pageNo
				})
			},
			/**
			 * 罪犯列表
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			criminalManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/criminal/management.html',
					name: 'criminalManagement',
					kclass: CriminalManagement,
					pageNo: pageNo
				})
			},
			/**
			 * 民警列表
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			policeManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/police/management.html',
					name: 'policeManagement',
					kclass: PoliceManagement,
					pageNo: pageNo
				})
			},
			/**
			 * 手环绑定解绑等操作
			 * 人员工位以及床位设置
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			wristbandManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/wristband/management.html',
					name: 'wristbandManagement',
					kclass: WristbandManagement,
					pageNo: pageNo
				})
			},
			/**
			 * 天线管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			aerialManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/aerial/management.html',
					name: 'aerialManagement',
					kclass: AerialManagement,
					pageNo: pageNo
				})
			},
			/**
			 * 接收机管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			receptorManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/receptor/management.html',
					name: 'receptorManagement',
					kclass: ReceptorManagement,
					pageNo: pageNo
				})
			},
			/**
			 * 摄像头管理
			 * @param  {int} pageNo 页码
			 * @return {[type]}        [description]
			 */
			cameraManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/camera/management.html',
					name: 'cameraManagement',
					kclass: CameraManagement,
					pageNo: pageNo
				})
			},
			/**
			 * DT服务器管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			dataserverManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/dataserver/management.html',
					name: 'dataserverManagement',
					kclass: DataserverManagement,
					pageNo: pageNo
				})
			},
			/**
			 * 视频实时监控
			 * @return {undefined} [no return]
			 */
			realtimeMonitor: function( id ) {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/realtime/monitor.html', 'realtimeMonitor' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						RealtimeMonitor.init( id );
					});
				};
				RealtimeMonitor.init( id );
			},
			/**
			 * 视频回顾回放
			 * @return {undefined} [no return]
			 */
			realtimePlayback: function( id ) {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/realtime/playback.html', 'realtimePlayback' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						RealtimePlayback.init( id );
					});
				};
				RealtimePlayback.init( id );
			},
			/**
			 * 重犯实时追踪
			 * @return {[type]} [description]
			 */
			realtimeViptrack: function() {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/realtime/viptrack.html', 'realtimeViptrack' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						RealtimeViptrack.init();
					});
				};
				RealtimeViptrack.init();
			},
			/**
			 * 实时追踪
			 * @param  {int} id 人物id
			 * @return {[type]}    [description]
			 */
			realtimeTrack: function( id ) {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/realtime/track.html', 'realtimeTrack' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						RealtimeTrack.init( id );
					});
				};
			},
			/**
			 * 事件管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			eventManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/event/management.html',
					name: 'eventManagement',
					kclass: EventManagement,
					pageNo: pageNo
				});
			},
			/**
			 * 通知管理
			 * @param  {[type]} pageNo [description]
			 * @return {[type]}        [description]
			 */
			noticeManagement: function( pageNo ) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/notice/management.html',
					name: 'noticeManagement',
					kclass: NoticeManagement,
					pageNo: pageNo
				});
			},
			/**
			 * 报警事件回顾
			 * @param  {[type]} id [description]
			 * @return {[type]}    [description]
			 */
			eventReview: function( id ) {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/event/review.html', 'eventReview' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						EventReview.init( id );
					});
				}
				EventReview.init( id );
			},
			/**
			 * 人员关系分析
			 * @return {[type]} [description]
			 */
			analysisRelation: function() {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/analysis/relation.html', 'analysisRelation' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						AnalysisRelation.init();
					});
				};
			},
			/**
			 * 生活习惯分析
			 * @return {[type]} [description]
			 */
			analysisHabit: function() {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/analysis/habit.html', 'analysisHabit' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						AnalysisHabit.init();
					});
				};
			},
			/**
			 * 系统角色管理
			 * @return {[type]} [description]
			 */
			systemRole: function() {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/system/role.html',
					name: 'systemRole',
					kclass: SystemRole,
					pageNo: 1
				})
			},
			/**
			 * 系统菜单管理
			 * @return {[type]} [description]
			 */
			systemMenu: function() {
				// 执行初始化
				Init();
				// 判断页面是否存在
				var	promise = this.handleTpl( Global.path + '/src/tmpl/system/menu.html', 'systemMenu' );
				// 判断promise返回
				if ( promise !== true ) {
					return promise.done(function(){
						SystemMenu.init();
					});
				};
			},
			/**
			 * 系统用户管理
			 * @return {[type]} [description]
			 */
			systemUser: function(pageNo) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/system/user.html',
					name: 'systemUser',
					kclass: SystemUser,
					pageNo: pageNo
				})
			},
			/**
			 * 工位床位设置
			 * @param  {int} pageNo 页码
			 * @return {[type]}        [description]
			 */
			placeWorker: function(pageNo) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/place/worker.html',
					name: 'placeWorker',
					kclass: PlaceWorker,
					pageNo: pageNo
				})
			},
			/**
			 * 工位床位设置
			 * @param  {int} pageNo 页码
			 * @return {[type]}        [description]
			 */
			placeBed: function(pageNo) {
				// 执行初始化
				Init();
				this.handleList({
					url: Global.path + '/src/tmpl/place/bed.html',
					name: 'placeBed',
					kclass: PlaceBed,
					pageNo: pageNo
				})
			}
		});
		return Router;
});