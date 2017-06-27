;(function($, particle){
	// 登录表单
	var $form = $('#login'),
		// 错误内容框
		$error = $('#error'),
		// 用户名与密码
		$username = $form.find('[name=username]'),
		$password = $form.find('[name=password]'),
		// 登录按钮
		$button   = $form.find('button'),
		// 遮罩方法
		/**
		 * 登录过程中遮罩不允许重复登录
		 * @param  {bool} type 显示或隐藏遮罩
		 * @return {[type]}      [description]
		 */
		handleMask = function( type ) {
			var id = 'login-ui-mask';
			if ( type == true ) {
				var div = document.createElement('div');
				div.id = id;
				$(div).css({
					opacity: 0,
					position: 'absolute',
					width: '100%',
					height: '100%',
					zIndex: 11111
				}).appendTo( 'body' );
			} else {
				$('#' + id).remove();
			}
		};
	// 获取主机头
	var pathname = location.pathname.split('\/'), path;
	// 判断数组长度
	if ( pathname.length > 2 ) {
		path = '/' + pathname[ 1 ];
	}
	// 登录校验
	$form.validate({
		rules: {
			username: 'required',
			password: 'required'
		},
		messages: {
			username: '请输入您的用户名',
			password: '请输入您的密码'
		},
		errorPlacement: function(error, element) {
			error.insertAfter( element.parent() );
		},
		highlight: function(element) {
			$(element).addClass('error-element');
		},
		success: function(error, element) {
			$(element).removeClass('error-element');
			error.remove();
		},
		submitHandler: function() {
			$button.find('i')[0].className = 'fa fa-circle-o-notch fa-spin';
			handleMask( true );

			$.post(path + '/a/login', {
				username: $.trim( $username.val() ),
				password: $.trim( $password.val() )
			}, function(data){
				if ( data.status == 0 ) {
					// 设置本地存储
					sessionStorage.session = true;
					sessionStorage.user = JSON.stringify( data.data.data );
					// 请求菜单数据
					$.post(path + '/a/sys/menu/getMenuList', function(data){
						sessionStorage.menu = JSON.stringify( data.data.data );
						location.href = 'index.html';
					}, 'json');
				} else {
					$button.find('i')[0].className = 'fa fa-lock';
					$error.show().find('>span').html( data.msg );
				}
				handleMask( false );
			}, 'json');
			return false;
		}
	});
	// 错误提示框关闭
	$error.find('>a').on('click', function(){
		$(this).parent().hide();
	});
	// 记住密码
	// 初始化背景图动画
	particle('particles', {
		"particles": {
	      "number": {
	        "value": 200,
	        "density": {
	          "enable": true,
	          "value_area": 3000
	        }
	      },
	      "color": {
	        "value": "#ccc"
	      },
	      "shape": {
	        "type": "circle",
	        "stroke": {
	          "width": 0,
	          "color": "#ccc"
	        },
	        "polygon": {
	          "nb_sides": 10
	        },
	        "image": {
	          "src": "img/github.svg",
	          "width": 100,
	          "height": 100
	        }
	      },
	      "opacity": {
	        "value": 0.3,
	        "random": false,
	        "anim": {
	          "enable": false,
	          "speed": 1,
	          "opacity_min": 0.1,
	          "sync": false
	        }
	      },
	      "size": {
	        "value": 15,
	        "random": true,
	        "anim": {
	          "enable": false,
	          "speed": 40,
	          "size_min": 0.1,
	          "sync": false
	        }
	      },
	      "line_linked": {
	        "enable": true,
	        "distance": 350,
	        "color": "#ccc",
	        "opacity": 0.4,
	        "width": 2
	      },
	      "move": {
	        "enable": true,
	        "speed": 1.5,
	        "direction": "none",
	        "random": false,
	        "straight": false,
	        "out_mode": "out",
	        "attract": {
	          "enable": false,
	          "rotateX": 600,
	          "rotateY": 1200
	        }
	      }
	    },
	    "interactivity": {
	      "detect_on": "canvas",
	      "events": {
	        "onhover": {
	          "enable": true,
	          "mode": "repulse"
	        },
	        "onclick": {
	          "enable": true,
	          "mode": "push"
	        },
	        "resize": true
	      },
	      "modes": {
	        "grab": {
	          "distance": 400,
	          "line_linked": {
	            "opacity": 1
	          }
	        },
	        "bubble": {
	          "distance": 400,
	          "size": 40,
	          "duration": 2,
	          "opacity": 8,
	          "speed": 3
	        },
	        "repulse": {
	          "distance": 200
	        },
	        "push": {
	          "particles_nb": 4
	        },
	        "remove": {
	          "particles_nb": 2
	        }
	      }
	    },
	    "retina_detect": true,
	    "config_demo": {
	      "hide_card": false,
	      "background_color": "#666666",
	      "background_image": "",
	      "background_position": "50% 50%",
	      "background_repeat": "no-repeat",
	      "background_size": "cover"
	    }
	})

})(jQuery, particlesJS);