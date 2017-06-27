define(['global'],function(Global){
	// 是否执行过
	var isInit = false;
	/**
	 * 菜单树解析
	 * @param  {[type]} collections 所有的菜单集合
	 * @param  {[type]} ids         选中的菜单集合
	 * @return {[type]}             [description]
	 */
	var parseMenu = function(collections, ids) {
		var first = [],
			second = [],
			third = [];

		_.each(collections, function(model, index, list){
			var data = model;
			// 权限过滤
			if (data.permission) return true;

			if (data.parentId == '0') {

			} else if (data.parentId == '1') {
				first.push( data );
				data.child = [];
			} else {
				data.ids = data.parentIds.split(',');
				data.ids.pop();
				data.ids.shift();
				if ( data.ids.length == 2 ) {
					second.push( data );
					data.child = [];
				} else if ( data.ids.length == 3 ) {
					third.push( data )
				}
			}
			data.selected = true;
			data.treeState = '{"opened": true}';

			if ( ids ) {
				if ( ids.indexOf( data.id ) > -1 ) {
					data.treeState = '{"opened": true, "selected": true}';
				}
			}
		});
		_.each(third, function(a){
			_.each(second, function(b){
				if ( a.parentId == b.id ) {
					b.child.push( a )
				}
			});
		});
		_.each(second, function(a){
			_.each(first, function(b){
				if ( a.parentId == b.id ) {
					b.child.push( a );
				}
			});
		});
		return first;
	}

	var logout = function() {
		$('#logout').on('click', function(){
			$.post(Global.path + '/a/Logout', function(data){
				if ( data.status == 0 ) {
					location.href = 'login.html';
					sessionStorage.session = null;
				}
			}, 'json')
		});
	};

	/**
	 * [init description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	var init = function(callback) {
		if ( !isInit ) {
			// 渲染用户信息
			var user = JSON.parse( sessionStorage.user );
			$('#userName').html( user.loginName );
			$('#roleName').html( user.name );
			// 渲染菜单信息
			var menus = {}; 
			menus.child = parseMenu( JSON.parse( sessionStorage.menu  ) );
			// 渲染
			$('#meunView').html( template('meunViewTpl', menus) );
			// 执行回调
			callback && callback();
			// 找到并选中菜单
			var hash = location.hash;
			$('#meunView').find('a').each(function(){
				var $this = $(this);
				if ($this.attr('href') === '#' + hash) {
					try {
						$this.closest('li')
						     .addClass('active')
						     .closest('li')
						     .addClass('active')
						     .closest('li')
						     .addClass('active');
					} catch (e){

					}
					return true;
				}
			});
			// 绑定退出
			logout();
			// 初始化完成
			isInit = true;
		}
	};
	init.parseMenu = parseMenu;

	return init;
});