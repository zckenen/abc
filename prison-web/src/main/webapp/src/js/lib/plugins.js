;(function(){
	var srcs = [
	   "./assets/plugins/jquery.min.js",
	   "./assets/plugins/backbone/underscore.js",
	   "./assets/plugins/backbone/backbone.js",
	   "./assets/plugins/jquery-ui/jquery-ui.min.js",
	   "./assets/plugins/jquery-mousewheel/jquery.mousewheel.min.js",
	   "./assets/plugins/d3/d3.min.js",
	   "./assets/plugins/bootstrap/js/bootstrap.js",
	   "./assets/plugins/jquery-validation/js/jquery.validate.min.js",
	   "./assets/plugins/bootstrap-fileinput/fileinput.min.js",
	   "./assets/plugins/bootstrap-timepicker/js/bootstrap-timepicker.min.js",
	   "./assets/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js",
	   "./assets/plugins/jquery-slimscroll/jquery.slimscroll.js",
	   "./assets/plugins/select2/select2.min.js",
	   "./assets/plugins/echarts.min.js",
	   "./assets/plugins/d3/d3.min.js",
	   "./assets/scripts/compoent.js",
	   "./assets/scripts/common.js",
	   "./assets/scripts/layout.js",
	]
	
	var i = 0, len = srcs.length, script, count = 1;
	
	for(; i < len; i++ ) {
		script = document.createElement('script');
		script.src = srcs[ i ];
		script.type = 'text/javascript';
		
		script.onload = function() {
			++count;
			if ( count == len  ) {
				var main = document.createElement('script');
				console.log(main);
				main.src = './assets/plugins/require.js';
				main.setAttribute('data-main', './assets/src/app/main')
				main.type = 'text/javascript';
				
				document.documentElement.appendChild( main );
			}
		}
		document.documentElement.appendChild( script );
	}
	
})();
