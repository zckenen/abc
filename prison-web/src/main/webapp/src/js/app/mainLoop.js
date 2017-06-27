/**
 * 全局唯一定时器,程序主循环
 * @param  {[type]} ){} [description]
 * @return {[type]}       [description]
 */
define(['global'],function(Global){
		// 回调执行
	var _callback = {},
		// 计数器
		_i = 0;
		_threes = 3000;
	// 建立循环
	var loop = setInterval(function(){
		_.each(_callback, function(item, k){
			(_i % item.times === 0) && item.func.call( item.context, item.param );
		});
		_i += 100;
		_i === 120000 ? _i = 0 : '';
	}, 100);

	return {
		/**
		 * 将需要定时处理的任务放入集合中
		 * @param {[type]} options [description]
		 */
		set: function( option ) {
			var calls = _callback[ option.name ];
			// 判断是否存在
			!calls ? calls = _callback[ option.name ] = {} : '';
			// 插入回调中
			calls.func = option.func; // 回调
			calls.param = option.param; // 回调参数
			calls.times = option.times; // 回调执行的时间间隔
			calls.context = option.context; // 回调执行上下文
		},
		/**
		 * 将不需要定时处理的人删除
		 * @param {String} name 要删除的对应方法
		 * @return {[type]} [description]
		 */
		unset: function() {
			var args = [].slice.call(arguments, 0);
			args.forEach(function(k){
				delete _callback[ k ];
			});
		}
	}
	// var // 计数器
	// 	_i = 1,
	// 	// ws send 方法所以需要的参数
	//    	_param,
	//    	// ws onmessage 回调
	//    	_callback,
	//    	// 执行callback回调上下文
	//    _context,
	//    // 每隔多少秒执行一次
	//    _times = 1;
	// // 首页与楼层推送
	// var ws = $.websocket('ws://'+ Global.host + Global.path +'/allLoccoorCount.do', {
	// 	/**
	// 	 * 建立链接
	// 	 * @return {[type]} [description]
	// 	 */
	// 	open: function() {
	// 		console.log( 'overview connected' );
	// 	},
	// 	/**
	// 	 * 响应后台广播
	// 	 * @return {[type]} [description]
	// 	 */
	// 	message: function() {
	// 		_callback && _callback.apply(_context, arguments);
	// 	},
	// 	/**
	// 	 * 关闭链接
	// 	 * @return {[type]} [description]
	// 	 */
	// 	close: function() {
	// 		console.log( 'overview disconnected' );
	// 	}
	// });	
	// var // 计数器
	// 	_wi = 1,
	// 	// ws send 方法所以需要的参数
	//    	_wparam,
	//    	// ws onmessage 回调
	//    	_wcallback,
	//    	// 执行callback回调上下文
	//    	_wcontext,
	//    	// 每隔多少秒执行一次
	//    	_wtimes = 1;
	// // 车辆推送
	// var wws = $.websocket('ws://'+ Global.host + Global.path +'/vheicleState.do', {
	// 	/**
	// 	 * 建立链接
	// 	 * @return {[type]} [description]
	// 	 */
	// 	open: function() {
	// 		console.log( 'car and warning connected' );
	// 	},
	// 	/**
	// 	 * 响应后台广播
	// 	 * @return {[type]} [description]
	// 	 */
	// 	message: function() {
	// 		_wcallback && _wcallback.apply(_wcontext, arguments);
	// 	},
	// 	/**
	// 	 * 关闭链接
	// 	 * @return {[type]} [description]
	// 	 */
	// 	close: function() {
	// 		console.log( 'car and warning disconnected' );
	// 	}
	// });	
	// // 主循环
	// var _loop = setInterval(function(){
	// 	// 当回调存在且间隔时间正确
	// 	_callback && (_i % _times === 0) && ws.send( _param );
	// 	_wcallback && (_wi % _wtimes === 0) && wws.send( _wparam );
	// 	_i++;
	// 	_wi++;
	// }, 1000);

	// return {
	// 	/**
	// 	 * 设置推送参数以及回调
	// 	 * @param {Object} options 参数对象
	// 	 * options.context 执行callback上下文
	// 	 * options.callback 回调处理socket广播数据
	// 	 * options.param 推送的参数以及所要调用的方法
	// 	 */
	// 	set: function( options ) {
	// 		_callback = options.callback;
	// 		_param = JSON.stringify( options.param );
	// 		_context = options.context;
	// 		_times = options.times;
	// 		// 重置计数器
	// 		_i = 1;
	// 		// 立刻出发一次
	// 		ws.send( _param );
	// 	},
	// 	/**
	// 	 * 设置车辆推送参数以及回调
	// 	 * @param {Object} options 参数对象
	// 	 * options.context 执行callback上下文
	// 	 * options.callback 回调处理socket广播数据
	// 	 * options.param 推送的参数以及所要调用的方法
	// 	 */
	// 	setcar: function( options ) {
	// 		if ( !_wcallback ) {
	// 			_wcallback = options.callback;
	// 			_wparam = JSON.stringify( options.param );
	// 			_wcontext = options.context;
	// 			_wtimes = options.times;
	// 			// 重置计数器
	// 			_wi = 1;
	// 			// 立刻出发一次
	// 			wws.send( _wparam );
	// 		}
	// 	},
	// 	/**
	// 	 * 销毁推送的回调等参数禁止ws.send
	// 	 * @return {[type]} [description]
	// 	 */
	// 	unset: function() {
	// 		_callback = null
	// 		_param = null;
	// 		_context = null;
	// 	},
	// 	/**
	// 	 * 终止主循环
	// 	 * @return {[type]} [description]
	// 	 */
	// 	destory: function() {
	// 		clearInterval(_loop);
	// 		_loop = null;
	// 	},
	// 	/**
	// 	 * 启动主循环
	// 	 * @return {[type]} [description]
	// 	 */
	// 	startup: function() {

	// 	},
	// 	// 在主循环中在添加一个车辆与报警的推送
	// 	add: function() {

	// 	}
	// }

	// return new mainLoop;
});