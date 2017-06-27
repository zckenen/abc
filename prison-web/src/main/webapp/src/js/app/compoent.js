
/*****
	jQuery validator 验证
*****/
$.extend($.validator.messages, {
    required: "必填字段",
    remote: "请修正该字段",
    email: "邮箱格式不正确",
    url: "请输入合法的网址",
    date: "请输入合法的日期",
    dateISO: "请输入合法的日期 (ISO).",
    number: "请输入合法的数字",
    digits: "只能输入整数",
    creditcard: "请输入合法的信用卡号",
    equalTo: "请再次输入相同的值",
    accept: "请输入拥有合法后缀名的字符串",
    maxlength: $.validator.format("请输入一个长度最多是 {0} 的字符串"),
    minlength: $.validator.format("请输入一个长度最少是 {0} 的字符串"),
    rangelength: $.validator.format("请输入一个长度介于 {0} 和 {1} 之间的字符串"),
    range: $.validator.format("请输入一个介于 {0} 和 {1} 之间的值"),
    max: $.validator.format("请输入一个最大为 {0} 的值"),
    min: $.validator.format("请输入一个最小为 {0} 的值")
});

// select不能为null   
jQuery.validator.addMethod("isnull", function(value, element) {   
    var key = 'null';

    return !(value === key);
}, "必须选择");


/*!
 * FileInput Chinese Translations
 *
 * This file must be loaded after 'fileinput.js'. Patterns in braces '{}', or
 * any HTML markup tags in the messages must not be converted or translated.
 *
 * @see http://github.com/kartik-v/bootstrap-fileinput
 * @author kangqf <kangqingfei@gmail.com>
 *
 * NOTE: this file must be saved in UTF-8 encoding.
 */
;(function ($) {
    "use strict";

    $.fn.fileinputLocales['zh'] = {
        fileSingle: '文件',
        filePlural: '多个文件',
        browseLabel: '选择 &hellip;',
        removeLabel: '移除',
        removeTitle: '清除选中文件',
        cancelLabel: '取消',
        cancelTitle: '取消进行中的上传',
        uploadLabel: '上传',
        uploadTitle: '上传选中文件',
        msgNo: '没有',
        msgCancelled: '取消',
        msgZoomTitle: '查看详情',
        msgZoomModalHeading: '详细预览',
        msgSizeTooLarge: '文件 "{name}" (<b>{size} KB</b>) 超过了允许大小 <b>{maxSize} KB</b>.',
        msgFilesTooLess: '你必须选择最少 <b>{n}</b> {files} 来上传. ',
        msgFilesTooMany: '选择的上传文件个数 <b>({n})</b> 超出最大文件的限制个数 <b>{m}</b>.',
        msgFileNotFound: '文件 "{name}" 未找到!',
        msgFileSecured: '安全限制，为了防止读取文件 "{name}".',
        msgFileNotReadable: '文件 "{name}" 不可读.',
        msgFilePreviewAborted: '取消 "{name}" 的预览.',
        msgFilePreviewError: '读取 "{name}" 时出现了一个错误.',
        msgInvalidFileType: '不正确的类型 "{name}". 只支持 "{types}" 类型的文件.',
        msgInvalidFileExtension: '不正确的文件扩展名 "{name}". 只支持 "{extensions}" 的文件扩展名.',
        msgUploadAborted: '该文件上传被中止',
        msgValidationError: '验证错误',
        msgLoading: '加载第 {index} 文件 共 {files} &hellip;',
        msgProgress: '加载第 {index} 文件 共 {files} - {name} - {percent}% 完成.',
        msgSelected: '{n} {files} 选中',
        msgFoldersNotAllowed: '只支持拖拽文件! 跳过 {n} 拖拽的文件夹.',
        msgImageWidthSmall: '宽度的图像文件的"{name}"的必须是至少{size}像素.',
        msgImageHeightSmall: '图像文件的"{name}"的高度必须至少为{size}像素.',
        msgImageWidthLarge: '宽度的图像文件"{name}"不能超过{size}像素.',
        msgImageHeightLarge: '图像文件"{name}"的高度不能超过{size}像素.',
        msgImageResizeError: '无法获取的图像尺寸调整。',
        msgImageResizeException: '错误而调整图像大小。<pre>{errors}</pre>',
        dropZoneTitle: '拖拽文件到这里 &hellip;',
        fileActionSettings: {
            removeTitle: '删除文件',
            uploadTitle: '上传文件',
            indicatorNewTitle: '没有上传',
            indicatorSuccessTitle: '上传',
            indicatorErrorTitle: '上传错误',
            indicatorLoadingTitle: '上传 ...'
        }
    };
})(window.jQuery);
/**
 * Simplified Chinese translation for bootstrap-datetimepicker
 * Yuan Cheung <advanimal@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['zh-CN'] = {
			days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
			daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
			daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
			months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			today: "今日",
		suffix: [],
		meridiem: []
	};
}(jQuery));
/**
 * websocket组件
 * ajax 组件
 * 运用队列处理ajax与回到关系
 */
+(function($){
	$.extend({
		websocketSettings: {
			open: function(){},
			close: function(){},
			message: function(){},
			options: {},
			events: {}
		},
		websocket: function(url, options) {
			// 扩展参数
			var options = $.extend( $.websocketSettings, options );
			// 实例化websocket
			var ws = new WebSocket(url);
			// 打开
			ws.onopen = options.open;
			// 监听
			ws.onmessage = options.message;
			// 监听关闭
			ws.onclose = options.close;
			
			$(window).unload(function(){ ws.close(); ws = null });
			return ws;
		}
	});

}).call(this, jQuery);


+(function($){
	var slice = [].slice;
	/*
     * ajax组件
	 */
	var Http = (function(){
		var Http = function( param ) {
			if ( param instanceof Array ) {
				return new Http.fn.init( param );
			} else {
				return new Http.fn.init( slice.call( arguments ) );
			}
		};


		Http.fn = Http.prototype = {
			constructor: Http,
			init: function( param ) {
				var promise = [], // deffer对象
					success = [], // 成功回调函数对象
					error = [],   // 失败回调函数
					request; // http 请求
				// 遍历
				$.each(param, function(a, b){
					var temp = $.extend({type: 'get', dataType: 'html'}, b);
					request = $.ajax( temp );
					promise.push( request );
					success.push( b.success || function(){} );
					error.push( b.error || function(){} );
				});
				return $.when.apply( $, promise );
			}
		}

		Http.fn.init.prototype = Http.fn;

		return Http;
	})();

	$.http = Http;

}).call(this, jQuery);

/**
 * ajax 进度条组件
 * 此为虚拟进度条没用使用xhr progress进度监听
 */
;(function($){
	var Progress = function() {
		this.$loading = $('#loading');
		this.$progress = $('.pace');
		this.$bar = this.$progress.find('.pace-progress');
		// 同步加载初始化
		this.async.init();
	}

	Progress.prototype = {
		/**
		 * @type
		 * type = L 表示只显示loading
		 * type = P 表示只显示progress进度
		 * @requestCount
		 * 请求数量
		 */
		start: function(type, requestCount) {
			var self = this;
			// 显示类型
			this.type = type || true;
			// 请求数量
			this.requestCount = requestCount || 1;
			// 请求已完成的数量
			this.completeCount = 0;
			// 如果只显示loading
			if ( this.type === 'L' ) {
				this.loadingShow();
			} else if ( this.type === 'P' ) {
				this.progressShow();
			} else {
				this.loadingShow();
				this.progressShow();
			}
			
		},
		clearInter: function( key ) {
			if ( window[ key ] ) {
				clearInterval( window[ key ] );
				window[ key ] = null;
			}
		},
		clearTime: function( key ) {
			if ( window[ key ] ) {
				clearTimeout( window[ key ] );
				window[ key ] = null;
			}
		},
		loadingShow: function() {
			this.$loading.show();
		},
		loadingHide: function() {
			this.$loading.hide();
		},
		progressHandle: function() {
			this.$progress.hide();
			this.$bar.css({width: '0%'});
		},
		progressShow: function() {
			var self = this;
			var _show = function() {
				self.$progress.show();
				self.virtual( );
			}
			// 清除上次可能为完成的计时器
			this.clearInter( 'progressInter' )
			// 如果此时有progress操作
			if ( this.$progress.is(':visible') ) {
				this.progressHandle();
				window.progressTime =  setTimeout(function(){
					_show();
					// 清除当前计时器
					self.clearTime( 'progressTime' );
				}, 900)	
			} else {
				_show();
			}
		},
		progressHide: function() {
			var self = this;
			this.$bar.css({width: '100%'});
			window.progressTime = setTimeout(function(){
				self.progressHandle();
				self.clearTime( 'progressTime' );
			}, 1000);
			self.clearInter( 'progressInter' );
		},
		// 虚拟进度处理
		virtual: function() {
			var self = this, 
				n = 4,
				count = 0,
				after = parseInt( Math.random() * ( 1500 - 250 + 1 ) + 250 ),
				percentage = parseInt( Math.random() * 40 );
			self.$bar.css({width: percentage + '%'});
			window.progressInter = setInterval(function(){
			   if ( count == 4 ) {
			   		self.clearInter( 'progressInter' );
			   		return false;
			   };
			   percentage += parseInt( Math.random() * (100 - percentage) );
			   self.$bar.css({width: percentage + '%'});
			   count++;
			}, after);
		},
		end: function() {
			var self = this;
			this.completeCount++;
			if ( this.completeCount == this.requestCount ) {
				if ( this.type === 'L' ) {
					this.loadingHide();
				} else if ( this.type === 'P') {
					this.progressHide();
				} else {
					this.loadingHide();
					this.progressHide();
				}
			}
		},
		// 同步或其他带百分比进度
		// @state 显示还是隐藏
		// @options 参数
		async: {
			init: function() {
				this.$bar = $('#loading-async');
				this.$box = this.$bar.find('>div');
				// 计算top
				this.$box.css({top: ($(window).height() - this.$box.height()) / 2 + 'px' });
				// 绘图
				var canvas = document.getElementById('loading-async-canvas'),
				context = canvas.getContext('2d');
				context.beginPath();
				context.arc(75, 75, 75, Math.PI * 0, Math.PI * 2, true);
				context.closePath();
				context.fillStyle = 'rgba(53, 152, 220, 0.5)';
				context.fill();
				context.beginPath();
				context.arc(75, 75, 74, Math.PI * 0, Math.PI * 2, true);
				context.closePath();
				context.strokeStyle = 'rgba(62, 101, 155, 0.7)';
				context.stroke();
				context.beginPath();
				context.arc(75, 75, 3, Math.PI * 0, Math.PI * 2, true);
				context.closePath();
				context.fillStyle = 'rgba(62, 101, 155, 1)';
				context.fill();
				
			},
			// 显示
			show: function( text ) {
				this.$bar.show().find('p').text( text );
			},
			// 隐藏
			hide: function() {
				this.$bar.hide();
			}
		},
		/**
		 * 局部进度条
		 * @param  {[type]} bool 显示或隐藏
		 * @param  {[type]} $box dom元素
		 * @param  {[type]} text 默认图案
		 * @return {[type]}      [description]
		 */
		partial: function( bool, $box, text) {
			var prefix = 'partial-loading';
			if ( bool ) {
				var	$div = $('<div>').addClass( prefix ),
					txt = text || '&#xe668;';
				// 插入子元素
				$div.append('<div class="search-bar iconfont">'+ txt +'</div>');
				$box.append( $div );
			} else {
				$('.' + prefix).remove();
			}
		}
	}

	this.progress = this._progress = new Progress;
}).call(this, jQuery);

/**
 * 
 * 自定义checkbox raido组件
 */

+(function(){
	var checkHandle = function( event ) {
		// 当前checkbox
		var con = (event || window.event).currentTarget;
		// 当前checkbox父label
			label = con.parentElement;
		// 如果选中
		if ( con.checked ) {
			$(label).addClass('checked');
		} else {
			$(label).removeClass('checked');
		}
	};
	// 委托点击事件
	$(document).on('click.icheck', '.icheck-box', checkHandle);

	var raidoHandle = function( event ) {
			// 当前被点击的radio
		var con = (event || window.event).currentTarget,
			// 被点击radio的name
			name = con.name,
			// 获取所有同name的radio
			$raido = $(':radio[name='+ name +']');
		// 去掉所有选中
		$raido.closest('.checked.iradio').removeClass('checked');
		// 选中当前被点击项
		$(con).closest('.iradio').addClass('checked');

	};
	// 委托点击点击事件
	$(document).on('click.iradio', '.iradio-box', raidoHandle);

	var tableHandle = function( event) {
		// 当前checkbox
		var con = (event || window.event).currentTarget,
			// 当前table
			$table = $(con).closest('table'),
			// 当前checkbox的父tr
			$tr = $(con).closest('tr');
		if ( $table.length > 0 ) {
			// 判断是否是全选按钮
			if ( $(con).hasClass('all') ) {
				if ( con.checked ) {
					$table.find('>tbody>tr')
						  .addClass('checked')
						  .find('.icheck')
						  .addClass('checked')
						  .find('.icheck-box')
						  .each(function(){
						  	this.checked = true;
						  })

				} else {
					$table.find('>tbody>tr')
						  .removeClass('checked')
						  .find('.icheck')
						  .removeClass('checked')
						  .find('.icheck-box')
						  .each(function(){
						  	this.checked = false;
						  })
				}
			} else {
				var len = $table.find('>tbody>tr').length,
					l = $table.find('>tbody :checked').length;

				if ( con.checked ) {
					$tr.addClass('check');
				} else {
					$tr.removeClass('check');
				}
				// 判断是否满足全选
				if ( len == l ) {
					$table.find('>thead>tr')
						  .find('.icheck')
						  .attr('checked', false)
						  .addClass('checked')
						  .find('.icheck-box')
						  .attr('checked', true);
				} else {
					$table.find('>thead>tr')
						  .find('.icheck')
						  .attr('checked', true)
						  .removeClass('checked')
						  .find('.icheck-box')
						  .attr('checked', true);
				}
			}
		} 
	};

	// table事件处理
	$(document).on('click.table', '.icheck-box', tableHandle);

	// 委托点击事件
	$(document).on('click.check', '.check-items', function(){
		var $table = $(this).closest('table'),
			$checkbox = $table.find('>tbody :checkbox');
		if ( this.checked ) {
			$checkbox.prop('checked', true);
		} else {
			$checkbox.prop('checked', false);
		}
	});

	$(document).on('click.check', '.icheck-item', function(){
		var $table = $(this).closest('table'),
			$all = $table.find('>thead :checkbox'),
			len = $table.find('>tbody :checkbox').length,
			lened = $table.find('>tbody :checked').length;
		// 判断长度
		if ( len == lened ) {
			$all.prop('checked', true);
		} else {
			$all.prop('checked', false);
		}
	});
}).call(this);


/**
 * Project: Bootstrap Hover Dropdown
 * Author: Cameron Spear
 * Contributors: Mattia Larentis
 *
 * Dependencies: Bootstrap's Dropdown plugin, jQuery
 *
 * A simple plugin to enable Bootstrap dropdowns to active on hover and provide a nice user experience.
 *
 * License: MIT
 *
 * http://cameronspear.com/blog/bootstrap-dropdown-on-hover-plugin/
 */
!function(e,n){var o=e();e.fn.dropdownHover=function(t){return"ontouchstart"in document?this:(o=o.add(this.parent()),this.each(function(){var i,r=e(this),s=r.parent(),d={delay:500,instantlyCloseOthers:!0},a={delay:e(this).data("delay"),instantlyCloseOthers:e(this).data("close-others")},h="show.bs.dropdown",u="hide.bs.dropdown",l=e.extend(!0,{},d,t,a);s.hover(function(e){return s.hasClass("open")||r.is(e.target)?(o.find(":focus").blur(),l.instantlyCloseOthers===!0&&o.removeClass("open"),n.clearTimeout(i),s.addClass("open"),void r.trigger(h)):!0},function(){i=n.setTimeout(function(){s.removeClass("open"),r.trigger(u)},l.delay)}),r.hover(function(){o.find(":focus").blur(),l.instantlyCloseOthers===!0&&o.removeClass("open"),n.clearTimeout(i),s.addClass("open"),r.trigger(h)}),s.find(".dropdown-submenu").each(function(){var o,t=e(this);t.hover(function(){n.clearTimeout(o),t.children(".dropdown-menu").show(),t.siblings().children(".dropdown-menu").hide()},function(){var e=t.children(".dropdown-menu");o=n.setTimeout(function(){e.hide()},l.delay)})})}))},e(document).ready(function(){e('[data-hover="dropdown"]').not(".hover-initialized").each(function(){e(this).dropdownHover(),e(this).addClass("hover-initialized")})})}(jQuery,this);


// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}