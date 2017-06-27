
require.config({
	paths: {
		// 全局信息
		global: 'global',
		// 初始化
		app: 'app'
	}
});

require(['app', 'global'], function(app, global){
	global.init();
	app.init();
});
