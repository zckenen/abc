define(['lang'], function(lang){
	// 码表对照
	var code = {},
		// 获取参数配置
		// ajax同步确保信息加载完全
// 		getConfig = function() {
// 			$.ajax({
// 				url: '/prison/config.xml',
// 				dataType: 'xml',
// 				async: false
// 			}).done(function(xml){
// //				console.log( this, xml );
// 				var // xml文档对象
// 					doc = xml.documentElement,
// 					name, key;
// 				// 遍历
// 				$(doc).find('message>param').each(function(){
// 					name = this.getAttribute('name');
// 					// 判断是否含有属性
// 					!code[ name ] ? code[ name ] = {} : '';
// 					// 遍历子菜单
// 					$(this).find('field').each(function(){
// 						key = this.getAttribute('name');
// 						code[ name ][ key ] = this.getAttribute('value');
// 					}) 				
// 				});
// 			});
// 		},
		//全局颜色和
		colors = {
			important: '255, 0, 0', // '158, 11, 15', //
			general: '0, 100, 0', // '66, 176, 19',
			police: '0, 0, 255', //'35, 88, 100', 
			other: '160, 32, 240' // '170, 74, 135'
		},
		// 处理任务类型
		// @type 人物类型
		handleColor = function( type) {
			if ( type === 1 ) {
				return colors.general;
			} 

			if ( type === 2 ) {
				return colors.important;
			} 

			if ( type === 3 ) {
				return colors.police;
			}

			return colors.other;
		},
		// 处理日期显示
		handleDate = function(date) {
			var today = date ? new Date( date ) : new Date();

			return today.getFullYear() + '-' + (today.getMonth() * 1 + 1) + '-' + today.getDay();
		},
		// 文件上传
		fileUpload =  function( $box, options ) {
			var options = $.extend({
				showUpload: true,
	            showRemove: true,
	            language: 'zh',
	            dropZoneEnabled: true,
	            uploadUrl: hanelePath() + "/picture/upload.do",
	            uploadAsync: true
			}, options);
			// 文件
			var $file = $box.find('[type=file]');
			// 绑定
			$file.fileinput( options );
			// 绑定回调
			$file.on('fileuploaded', options.success);
		},
		/**
		 * [handleContainer description]
		 * @param  {[type]} d1 [description]
		 * @param  {[type]} d2 [description]
		 * @return {[type]}    [description]
		 */
		handleContainer = function() {
			var winHeight = $(window).height(),
				height = winHeight - 75;
			// 找到需要根据屏幕自适应的容器
			var $container = $('.auto.container-box');
			// 计算高度
			$container.height( height );
			// 找到package自适应
			var $package = $container.find('.auto.package');
			// 设置高度并放入滚动条
			if ( $package.length > 0 ) {
				// 遍历
				$.each($package, function(){
					var $this = $(this),
						diff = $this.attr('data-diff');
					// 设置
					$this.find('.iscroll').height( winHeight - (diff || 500) );
					UI.iscroll( $this );
				});
				
			}
			// // 设置视频高
			// var $video = $container.find('.video-block');
			// if ( $video.length > 0 ) {
			// 	var diff = $video.attr('data-diff');
			// 	$video.height( (height - ( diff || 0))  / 2 - 45 );
			// }

			// 判断容器的头部
			var $header = $container.find('.auto.nav-header'),
				$bodyer = $container.find('.auto.tab-bodyer');
			
			$screens = $('.screen.auto');
			if ( $screens.length > 0 ) {
				$screens.height( (winHeight - 260) / 4 );
			}
		},
		/**
		 * 处理自适应
		 * @return {[type]} [description]
		 */
		handleAuto = function() {
			var winHeight = $(window).height(),
				$tree = $('.index-tree.auto'),
				$quick = $('.index-quick.auto');
			// 设置
			$tree.css('maxHeight', winHeight - 450);
			$quick.css('height', winHeight - 200);
		},
		/**
		 * 生成指定范围随机数
		 * @param  {[type]} min [description]
		 * @param  {[type]} max [description]
		 * @return {[type]}     [description]
		 */
		rangeRandom = function(min, max) {
			return Math.floor( min + Math.random() * ( max - min ) );
		},
		/**
		 * 处理生成工程目录
		 * @return {string} 工程名
		 */
		hanelePath = function() {
			var pathname = location.pathname.split('\/');
			// 判断数组长度
			if ( pathname.length > 2 ) {
				return '/' + pathname[ 1 ];
			}
			return '';
		}
	// 日期暴露给全局
	$.handleDate = handleDate;
	// 加入resize
	Layout.addResizeHandler( handleContainer );
	Layout.addResizeHandler( handleAuto );

	return {
		init: function() {
			// getConfig();
		},
		host: window.location.host,
		// 
		code: code,
		// 默认分页页码
		pageSize: 15,
		// 全使用的颜色和
		colors: colors,
		// 处理人物类型
		handleColor: handleColor,
		// 文件上传
		fileUpload: fileUpload,
		// 日期处理
		handleDate: handleDate,
		// 处理容器高度
		handleContainer: handleContainer,
		// 处理高度
		handleAuto: handleAuto,
		// 指定范围随机数
		rangeRandom: rangeRandom,
		// 提示语句[逐渐取代xml配置]
		lang: lang,
		// 工程名称
		path: hanelePath()
	};
});

