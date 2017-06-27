// 通用方法集合
;(function($){
	var Common = function() {

	};

	Common.fn = Common.prototype = {
		constructor: Common,
		// 获取屏幕的高度
		getWindowClientSize: function() {
			var w = $(window).width(),
				h = $(window).height(),
				s = w / h; 
			return {
				width: w,
				height: h,
				scale: s
			}
		}
	}

	this.Common = new Common;
}).call(this, jQuery);