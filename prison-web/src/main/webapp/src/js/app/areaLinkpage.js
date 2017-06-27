define(['global'], function(Global){
	var AreaLinkpage = {};

	var // 是否已经加载过数据
		_isReady = false,
		// 幢层区等jQuery对象
		_$coo, _$pic, _$loc, _$cam, _$wrk, _$bed,
		// 幢层区等数据
		_coo, _pic, _loc, _cam, _wrk, _bed,
		// 相关id
		_cooId, _picId, _locId, _camId, _wrkId, _bedId,
		//　层级
		_handlezIndex = false;
	/**
	 * 先解绑
	 * @return {[type]} [description]
	 */
	var _unbind = function() {
		_$coo ? _$coo.off('select2:select') : '';
		_$pic ? _$pic.off('select2:select') : '';
		_$loc ? _$loc.off('select2:select') : '';
		_$cam ? _$cam.off('select2:select') : '';
		_$wrk ? _$wrk.off('select2:select') : '';
		_$bed ? _$bed.off('select2:select') : '';
	};
	/**
	 * 绑定联动
	 * @return {[type]} [description]
	 */
	var _bind = function( options ) {
		_$coo = options.$coo;
		_$pic = options.$pic;
		_$loc = options.$loc;
		_$cam = options.$cam;
		_$wrk = options.$wrk;
		_$bed = options.$bed;
		_cooId = options.cooId;
		_picId = options.picId;
		_locId = options.locId;
		_bedId = options.bedId;
		_wrkId = options.wrkId;
		_camId = options.camId;
		_handlezIndex = options.handlezIndex;
		// 渲染幢数据
		_cooRender();
		// 如果有层id渲染层数据
		_picId && _picRender( _cooId );
		// 如果有区域数据渲染区域数据
		_locId && _locRender( _picId );
		// 如果有床位或工位
		_bedId && _bedRender( _locId );
		_wrkId && _wrkRender( _locId );
		// 加载组件
		UI.iselect(_$coo, {handlezIndex: _handlezIndex});
		UI.iselect(_$pic, {handlezIndex: _handlezIndex});
		UI.iselect(_$loc, {handlezIndex: _handlezIndex});
		UI.iselect(_$cam, {handlezIndex: _handlezIndex});
		UI.iselect(_$wrk, {handlezIndex: _handlezIndex});
		UI.iselect(_$bed, {handlezIndex: _handlezIndex});
		// 绑定
		_$coo && _$coo.on('select2:select', function( event ){
			var con = event.target;
			_picRender( con.value );
		});
		_$pic && _$pic.on('select2:select', function( event ){
			var con = event.target;
			_locRender( con.value );
		});
		_$loc && _$loc.on('select2:select', function( event ){
			var con = event.target;
			if ( _$cam ) {
				_camRender( con.value );
			} else if ( _$wrk ) {
				_wrkRender( con.value );
			} else {
				_bedRender( con.value );
			}
		});
	}
	/**
	 * 渲染幢
	 * @return {[type]} [description]
	 */
	var _cooRender = function( data ) {
		var opts = '<option value="">幢</option>';
		_coo.forEach(function(item, i){
			opts += '<option value="'+ item.id +'" '+ (_cooId == item.id ? "selected" : '') +'>'+ item.cooName +'</option>';
		});
		_$coo.html( opts );
		// UI组件
		UI.iselect(_$coo, {handlezIndex: _handlezIndex});
	}
	/**
	 * 渲染层
	 * @param  {String} id 幢id
	 * @return {[type]}    [description]
	 */
	var _picRender = function( id ) {
		var opts = '<option value="">层</option>';
		if ( id && id != 'null' && _$pic ) {
			_pic = _coo.filter(function(item){
				return item.id === id;
			});
			
			_pic = _pic[ 0 ].pictures ? _pic[ 0 ].pictures : [];
			// 遍历层数据
			_pic && _pic.forEach(function(item, i){
				opts += '<option value="'+ item.id +'" '+ (_picId == item.id ? "selected" : '') +' data-pic='+ item.picPath +'>'+ item.picName +'</option>';
			});
		}
		_$pic && _$pic.html( opts );
		// UI组件
		UI.iselect(_$pic, {handlezIndex: _handlezIndex});
	};
	/**
	 * 区域渲染
	 * @param  {String} id 层id
	 * @return {[type]} [description]
	 */
	var _locRender = function( id ) {
		var opts = '<option value="">区域</option>';
		if ( id && id !='null' && _$loc ) {
			_loc = _pic.filter(function(item){
				return item.id === id;
			});
			_loc = _loc[ 0 ].locareas ? _loc[ 0 ].locareas : [];
			// 遍历层数据
			_loc && _loc.forEach(function(item, i){
				opts += '<option value="'+ item.id +'" '+ (_locId == item.id ? "selected" : '') +'>'+ item.locName +'</option>';
			});
		} 
		_$loc && _$loc.html( opts );
		// UI组件
		UI.iselect(_$loc, {handlezIndex: _handlezIndex});		
	}
	/**
	 * 渲染床位
	 * @param  {String} id 区域id
	 * @return {[type]}    [description]
	 */
	var _bedRender = function( id ) {
		var opts = '<option value="">床位</option>';
		if ( id && id!= 'null' && _$bed ) { 
			_bed = _loc.filter(function(item){
				return item.id === id;
			});
			_bed = _bed[ 0 ].bedList ? _bed[ 0 ].bedList : [];
			// 遍历层数据
			_bed && _bed.forEach(function(item, i){
				var bedTypeName = item.bedNum + '号' + (item.bedType == 1 ? '上铺' : '下铺');
				opts += '<option value="'+ item.id +'" '+ (_bedId == item.id ? "selected" : '') +'>'+ bedTypeName +'</option>';
			});
		}
		_$bed && _$bed.html( opts );
		// UI组件
		UI.iselect(_$bed, {handlezIndex: _handlezIndex});
	};
	/**
	 * 渲染工位
	 * @param  {String} id 区域id
	 * @return {[type]}    [description]
	 */
	var _wrkRender = function( id ) {
		var opts = '<option value="">工位</option>';
		if ( id && id != 'null' && _$wrk ) {
			_wrk = _loc.filter(function(item){
				return item.id === id;
			});
			_wrk = _wrk[ 0 ].workerList ? _wrk[ 0 ].workerList : [];
			// 遍历层数据
			_wrk && _wrk.forEach(function(item, i){
				opts += '<option value="'+ item.id +'" '+ (_wrkId == item.id ? "selected" : '') +'>'+ item.wrkName + item.wrkNum +'号</option>';
			});
		}
		_$wrk && _$wrk.html( opts );
		// UI组件
		UI.iselect(_$wrk, {handlezIndex: _handlezIndex});
	};
	/**
	 * 渲染摄像头
	 * @param  {String} id 区域id
	 * @return {[type]}    [description]
	 */
	var _camRender = function( id ) {

	};
	/**
	 * 四级联动
	 * @param {Object} options 四级联动参数
	 * options.$coo => 幢
	 * options.$pic => 层
	 * options.$loc => 区域
	 * options.$camera => 摄像头
	 * options.$worker => 工位
	 * options.$bed => 床位 
	 * @return {[type]} [description]
	 */
	AreaLinkpage.init = function( options ) {
		if ( !_isReady ) {
			$.http({
				url: Global.path + '/main/loadCooPicLoc.do',
				type: 'post',
				dataType: 'json'
			}).done(function(data){
				_coo = data.data;
				// 先解绑
				_unbind();
				// 再重新绑定
				_bind( options );
				// 已加载
				_isReady = true;
			})
		} else {
			// 先解绑
			_unbind();
			// 再重新绑定
			_bind( options );
		};
		// 进行绑定等操作
	};
    /**
     * 刷新幢层区域
     */
	AreaLinkpage.refresh = function() {
		_isReady = false;
	};
	
	return AreaLinkpage;
});