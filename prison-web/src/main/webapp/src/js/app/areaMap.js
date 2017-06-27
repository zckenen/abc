define(['global'], function(Global){
	var AreaMap = {};

	AreaMap.model = Backbone.Model.extend({
		idAttribute: 'pic_no',
		defaults: {
			id: '',
			picPath: '',
		 	picRatio: '' 
		}
	});

	AreaMap.view = Backbone.View.extend({
		el: '#areaMap',
		events: {
			// 点击出现图片上传dialog
			'click.upload [data-event=upload]': 'upload',
			// 提交
			'submit.submit form': 'submit'
		},
		initialize: function() {
			this.$el = $(this.el);
			// 模板
			this.template = _.template( $('#areaMapTpl').html() );
			// 调用列表
			this.list(); 
		},
		list: function() {
			var self = this;
			$.post( Global.path + '/picture/loadIndexPicture.do', function(data){
				var list = data.data.data.list;
				if ( list ) {
					self.model.set( list[0] );
				} else {
					self.model.set( {picPath: ''} );
				}
				self.render();
			}, 'json');
			
		},
		// 渲染
		render: function() {
			var self = this, 
				$container = self.$el.find('form'),
				model = this.model.toJSON();
			// 设置路径
			model.path = Global.path + model.picPath;
			// 插入
			$container.html( self.template( model ) );
			// UI事件
			UI.tooltips( $container.find('[data-toggle=tooltip]') );
			// 数据绑定
			this.addFormData();
			// 数据验证
			this.validate();
		},
		// 点击出现图片上传
		upload: function() {
			var self = this,
				// 容器
				$box = $("#fileUpload"),
				// 成功回调
				success = function(event, data) {
					var json = data.response.data;
					// 设置路径
					self.$el.find('[name=picPath]').val( json.path );
					self.$el.find('img').attr('src', Global.path + json.path);
					// 关闭
					$box.find('.bootbox-close-button').trigger('click');
				};
			// 移除原有图片
			$('.fileinput-remove').trigger('click');
			// 绑定上传
			Global.fileUpload( $box, {success: success});	
			// 弹出
			UI.dialog( $box );
		},
		// 提交
		submit: function() {
			var self = this;
			// 写入数据
			this.setFormData();
			// 开启进度
			progress.start('L');
			// 修改
			$.post(Global.path + '/picture/updateIndexPicture.do', this.model.toJSON(), function(data){
				progress.end();
				if ( data.status == 0 ) {
					UI.alert({ message: Global.lang.m3});
				} else {
					UI.alert({ message: data.msg, type: 'warning'});
				}
			}, 'json');
		}
	});
	return AreaMap;
});