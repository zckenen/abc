define(['global'], function(Global){
	var // 判断当前窗口是否已经初始化过视频插件
		_isInitObject = [],
		// 当前选中的窗口
		_windowIndex = 0,
		// 当前ip是否登录
		_isIpLogin = [],
		// 需要登录的摄像头集合
		_needLoginCam = {},
		// 总共需要登录的数量
		_needLoginNum = 0,
		// 已登录成功的数量
		_loginTrueNum = 0;

	var videoControl = function( DOMid ) {
		var status = WebVideoCtrl.I_CheckPluginInstall();
		// 初始化视频窗口
		if ( status == -1 || status == -2 ) {
			var html = '<div>';
			html += '<p>您的浏览器版本过低或视频控件未安装，为了保证正常使用，请 ';
			html += '<a id="compoentDownload" href="'+ Global.path +'/upload/firefox.rar">点击下载控件</a></p>'
			html += '</div>';
			UI.alert({ message: html, type: 'warning', close: false});
			// 设置状态
			this.status = false;
			return;
		}
		this.status = true;
		// 初始化插件以及插入插件
		WebVideoCtrl.I_InitPlugin('100%', '100%', {
	        iWndowType: 1,
	        cbSelWnd: function (xmlDoc) {
	        	_windowIndex = $(xmlDoc).find("SelectWnd").eq(0).text();
			}
		});
		// 初始化窗口
		WebVideoCtrl.I_InsertOBJECTPlugin( DOMid );
		// 记录状态
		_isInitObject.push( DOMid );
		// 初始化绑定各按钮
		this.bind( DOMid );
	}

	videoControl.prototype = {
		/**
		 * 初始化绑定全屏关闭停止各按钮
		 * @param {string} DOMid 播放窗口
		 * @return {[type]} [description]
		 */
		bind: function( DOMid ) {
			// 绑定事件
			var self = this;
			self.$view = $('#' + DOMid).closest('[data-view]');
			self.$view.find('[data-event]').each(function(){
				var $this = $(this),
					fun = $this.attr('data-event');
				// 解绑后重新绑定
				$this.on('click', function(){
					return self[ fun ].apply( self, arguments );	
				});
			});
		},
		/**
		 * 最大化
		 * @return {[type]} [description]
		 */
		max: function( event ) {
			var con = event.currentTarget;
			this.$view.removeClass('min');
			if ( this.$view.hasClass('max') ) {
				this.$view.removeClass('max');
				$(con).find('i').html('&#xe67d;');
			} else {
				this.$view.addClass('max');
				$(con).find('i').html('&#xe67e;');
			}
		},
		/**
		 * 最小化
		 * @return {[type]} [description]
		 */
		min: function( event ) {
			var con = event.currentTarget;
			this.$view.removeClass('max');
			if ( this.$view.hasClass('min') ) {
				this.$view.removeClass('min');
			} else {
				this.$view.addClass('min');
			}
		},
		/**
		 * 关闭
		 * @param  {[type]} event [description]
		 * @return {[type]}       [description]
		 */
		close: function( event ) {
			this.$view.hide();
			// 调用停止
			this.stop();
		},
		/**
		 * 停止播放
		 * @return {[type]} [description]
		 */
		stop: function() {
			WebVideoCtrl.I_Stop();
		},
		/**
		 * 开始播放
		 * @return {[type]} [description]
		 */
		start: function() {

		},
		/**
		 * 视频播放
		 * @param {object} cameras 摄像机集合
		 * @param {int} 播放模式 1=>实时(默认) 2=>回放
		 * @param {string} startTime 开始时间
		 * @param {string} endTime 结束时间
		 * @return {[type]} [description]
		 */
		playlive: function( cameras, type, startTime, endTime ) {
			var self = this,
				// 摄像头个数
				len = cameras.length,
				// 窗体类型
				iWndowType;
			// 需要登陆的摄像头
			_needLoginCam = {};
			// 需要登录的数量
			_needLoginNum = 0;
			// 初始化登录成功数量
			_loginTrueNum = 0;
			// 设置播放模式与摄像头数据
			this.type = type || 1;
			this.cameras = cameras;
			// 判断是否设置时间
			if ( type == 2 ) {
				this.startTime = startTime;
				this.endTime = endTime;
			}
			// 判断该使用何种窗体
			if ( len == 1 ) {
				iWndowType = 1;
			} else if ( len > 1 && len < 5 ) {
				iWndowType = 2;
			} else if ( len > 4 && len < 10 ) {
				iWndowType = 3
			} else {
				iWndowType = 4;
			}
			// 窗口切割
			WebVideoCtrl.I_ChangeWndNum( iWndowType );
			// 停止所有剩余窗口的视频
			var i,j;
			i = j = Math.pow(iWndowType, 2);;
			for(; i >= len; i-- ) {
				// 设置窗口索引
				GetSelectWndInfo('<?xml version="1.0"?><RealPlayInfo><SelectWnd>'+ (j - i) +'</SelectWnd><ChannelNumber>-1</ChannelNumber><RealPlaying>0</RealPlaying><Recording>0</Recording></RealPlayInfo>');
				// 窗口播放状态
				var	oWndInfo = WebVideoCtrl.I_GetWindowStatus( _windowIndex );
				// 如果已经正在播放不重新播放
				if ( oWndInfo != null ) {
					WebVideoCtrl.I_Stop()
				} 
			}
			// 遍历判断登录
			cameras.forEach(function(camera, i){
				var ip = camera.cam_recevie_ip || camera.camRecevieIp;
				if (_.indexOf(_isIpLogin, ip) === -1 && !_needLoginCam[ip]) {
					_needLoginCam[ip] = camera;
					_needLoginNum++;
				}
			});
			// console.log(cameras);
			// 如果已经全部登录就直接调取视频
			if (_needLoginNum === 0) {
				cameras.forEach(function(camera, i){
					var ip = camera.cam_recevie_ip || camera.camRecevieIp,
						channel = camera.cam_channel || camera.camChannel;
					// 直接播放
					setTimeout(function(){
						self.action(ip, channel, i);
					}, i * 300);
				});
			} else {
				_.each(_needLoginCam, function(camera, k){
					self.login(camera);
				});
			}
		},
		/**
		 * 摄像头登录
		 * @param  {object} camera 摄像头信息
		 * @param {int} windowIndex 
		 * @return {[type]}         [description]
		 */
		login: function(camera, windowIndex) {
			var self = this,
				ip = camera.cam_recevie_ip || camera.camRecevieIp,
				name = camera.cam_login_name || camera.camLoginName,
				pwd = camera.cam_login_pwd || camera.camLoginPwd,
				channel = camera.cam_channel || camera.camChannel;
			// 登录
			var iRet = WebVideoCtrl.I_Login(ip, 1, 80, name, pwd, {
				success: function(xmlDoc) {
					_loginTrueNum++;
					if (_loginTrueNum === _needLoginNum) {
						self.cameras.forEach(function(camera, i){
							var ip = camera.cam_recevie_ip || camera.camRecevieIp,
								channel = camera.cam_channel || camera.camChannel;
							// 直接播放
							setTimeout(function(){
								self.action(ip, channel, i);
							}, i * 300);
						});
					}
					// 已登录ip状态写入
					_isIpLogin.push( ip );
				}
			});
		},
		/**
		 * 播放
		 * @return {[type]} [description]
		 */
		action: function(ip, channel, windowIndex, type) {
			var self = this,
				iStreamType = type || parseInt(1, 10),
				iChannelID = channel;
			// 设置窗口索引
			GetSelectWndInfo( '<?xml version="1.0"?><RealPlayInfo><SelectWnd>'+ windowIndex +'</SelectWnd><ChannelNumber>-1</ChannelNumber><RealPlaying>0</RealPlaying><Recording>0</Recording></RealPlayInfo>' );
			// 窗口播放状态
			var	oWndInfo = WebVideoCtrl.I_GetWindowStatus( windowIndex );
			// 如果已经正在播放不重新播放
			if ( oWndInfo != null ) {
				WebVideoCtrl.I_Stop()
			}
			if ( self.type == 2 ) {
				var iRet = WebVideoCtrl.I_StartPlayback(ip, {
					iChannelID: iChannelID,
					szStartTime: self.startTime,
					szEndTime: self.endTime
				});
			} else {
				var iRet = WebVideoCtrl.I_StartRealPlay(ip, {
					iStreamType: iStreamType,
					iChannelID: iChannelID
				});
			}
		}
	};

	/**
	 * [init description]
	 * @return {[type]} [description]
	 */
	videoControl.init = function( DOMid ) {
		return new videoControl( DOMid );
	}

	// 供外部释放用
	videoControl.isInitObject = _isInitObject;

	return videoControl;

});
