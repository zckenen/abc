define(function(){
	// 默认人头像的大小与面积
	var w = 15,
		h = 20,
		s = w * h,
		prefix = 'floor-person-';
	
	return {
		/**
		 * 区域中创建人员位置
		 * @param  {object} 	data     当前区域中的人员信息
		 * @param  {object} 	$region  区域元素jquery对象
		 * @param  {function} 	template 模板渲染函数
		 * @param  {int} 		x        区域宽
		 * @param  {int} 		y        区域长
		 * @return {undefined}  无返回   无返回
		 */
		init: function(data, $region, template, x, y) {
			// 人数长度
			var	len = data.length;
			// 如果区域中并不包含人
			if ( len == 0 ) return;
			var // 区域面积
				measure  = (x - 5) * (y - 5),
				// 单个人所含有的面积
				size = Math.ceil( measure / len ),
				// 单个人的长与框(即iconfont字体的大小)
				font = Math.round( Math.sqrt( size ) ),
				// 修正后的fontsize
				fontSize = Math.round( y / (y / font + 1) ),
				// 人员对象				
				$person;
			// 如果wl大于24则取24
			fontSize > 24 ? fontSize = 24 : fontSize--;
			// 遍历计算插入人员
			_.each(data, function(person, i){
				// 异常处理
				if ( person == '' ) return;
				// 插入区域中
				person.nwarinfo = false;
				$region.append( template(person) );
			});
			$region.find('.person').css({
				fontSize: fontSize + 'px'
			})
		}
	}
});