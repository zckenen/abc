define(['global'], function(Global){
	var tripleNumberLink = {};

	var // 监区分监区寝室
		_$pco, _$plo, _$dorm,
		// 监区分监区寝室数据
		_pco, _plo, _dorm,
		// 对应id
		_pcoId, _ploId, _dormId,
		// 数据是否已经请求过
		_isReady = false;

	/**
	 * 解绑
	 * @return {[type]} [description]
	 */
	var _unbind = function() {
		_$pco ? _$pco.off('select2:select') : '';
		_$plo ? _$plo.off('select2:select') : '';
		_$dorm ? _$dorm.off('select2:select') : '';
	}
	/**
	 * 绑定相关数据
	 * @return {[type]} [description]
	 */
	var _bind = function( options ) {
		_$pco = options.$pco;
		_$plo = options.$plo;
		_$dorm = options.$dorm;
		_pcoId = options.pcoId;
		_ploId = options.ploId;
		_dormId = options.dormId;
		_handlezIndex = options.handlezIndex;
		// 渲染监区
		_pcoRender();
		// 如果有分监区id
		_ploId && _ploRender( _pcoId );
		// 如果有小组号
		_dormId && _dormRender( _ploId );
		// UI组件
		UI.iselect(_$pco, {handlezIndex: _handlezIndex});
		UI.iselect(_$plo, {handlezIndex: _handlezIndex});
		UI.iselect(_$dorm, {handlezIndex: _handlezIndex});
		// 绑定
		_$pco && _$pco.on('select2:select', function( event ){
			var con = event.target;
			_ploRender( con.value );
		});
		_$plo && _$plo.on('select2:select', function( event ){
			var con = event.target;
			_dormRender( con.value );
		});
	}

	/**
	 * 渲染监区
	 * @return {[type]} [description]
	 */
	var _pcoRender = function() {
		var opts = '<option value="">监区</option>';
		// 遍历层数据
		_pco.forEach(function(item, i){
			opts += '<option value="'+ item.id +'" '+ (_pcoId == item.id ? "selected" : '') +'>'+ item.pcoName +'</option>';
		});
		_$pco.html( opts );
		// UI组件
		UI.iselect(_$pco, {handlezIndex: _handlezIndex});
	}
	/**
	 * 渲染分监区
	 * @return {[type]} [description]
	 */
	var _ploRender = function( id ) {
		var opts = '<option value="">分监区</option>';
		if ( id && id != 'null' && _$plo ) {
			_plo = _pco.filter(function(item){
				return item.id === id;
			});
			_plo = _plo[ 0 ].ploList || [];
			// 遍历层数据
			_plo && _plo.forEach(function(item, i){
				opts += '<option value="'+ item.id +'" '+ (_ploId == item.id ? "selected" : '') +'>'+ item.ploName +'</option>';
			});
		}
		
		if (_$plo) {
			_$plo.html( opts );
			// UI组件
			UI.iselect(_$plo, {handlezIndex: _handlezIndex});
		}
	}
	/**
	 * 渲染寝室
	 * @return {[type]} [description]
	 */
	var _dormRender = function( id ) {
		var opts = '<option value="">小组</option>';
		if ( id && id != 'null' && _$dorm ) {
			_dorm = _plo.filter(function(item){
				return item.id === id;
			});
			_dorm = _dorm[ 0 ].dormList || [];
			// 遍历层数据
			_dorm && _dorm.forEach(function(item, i){
				opts += '<option value="'+ item.peoDorm +'" '+ (_dormId == item.peoDorm ? "selected" : '') +'>第'+ item.peoDorm +'组</option>';
			});
			
		}
		_$dorm.html( opts );
		// UI组件
		UI.iselect(_$dorm, {handlezIndex: _handlezIndex});
	}
	/**
	 * 监区分监区小组联动
	 * @param {Object} options 监区信息
	 * @return {[type]} [description]
	 */
	tripleNumberLink.init = function( options ) {
		_$pco = options.$pco;
		_$plc = options.$plo;
		_$dorm = options.$dorm;

		if ( !_isReady ) {
			$.http({
				url: Global.path + '/main/loadGroupAndpeoInfo.do',
				dataType: 'json',
				type: 'post'
			}).done(function(data){
				_pco = data.data;
				// 先解绑
				_unbind();
				// 再重新绑定
				_bind( options );
				// 已加载
				_isReady = true;
			});
		} else {
			// 先解绑
			_unbind();
			// 再重新绑定
			_bind( options );
		}
	}

	return tripleNumberLink;
});