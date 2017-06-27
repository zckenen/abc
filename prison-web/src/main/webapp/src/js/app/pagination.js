/*****
分页 Start
*****/
define(function(){
	var Pagination = {};

	Pagination.model = Backbone.Model.extend({
		initialize: function() {
			// 设置获取相关参数
			var pageNo = this.get('PageNo'),
				pageCount = this.get('PageCount'),
				prev = (pageNo - 2 < 1 ? 1 : pageNo - 2),
				next = (pageNo + 2 > pageCount ? pageCount : pageNo + 2 ),
				begin = 0, end = 0;
			
			if ( next - 5 > 0 ) {
				begin = next - 4;
			} else {
				begin = 1;
			}

			if ( prev + 5 > pageCount ) {
				end = pageCount;
			} else {
				end = prev + 4;
			}

			this.set({ begin: begin, end: end });

		},
		defaults: {
			PageCount: '',
			Count: '',
			PageSize: '',
			PageNo: '',
			LastPage: '',
			NextPage: ''
		}
	});

	Pagination.view = Backbone.View.extend({
		events: {
			// 跳页功能
			'keyup [data-event=change]': 'change'
		},
		initialize: function() {
			var self = this;
			// 初始化模板
			this.template = _.template( $('#paginationTpl').html() );
		},
		render: function() {
			var self = this;
			// 渲染
			this.$el.empty().append( this.template( this.model.toJSON() ) );
			// 判断有无hash
			if ( this.model.get('hash') ) {
				this.$jump = this.$el.find('[data-elem=jump]');
			} else {
				this.list = this.model.get('method');
				this.context = this.model.get('context');
				// 绑定事件
				this.$el.find('[data-event=page]').off('click').on('click', function(){
					var pageNo = this.getAttribute('data-page');
					// 执行
					self.list.call(self.context, pageNo);
				});
			}
		},
		/**
		 * 改变页码
		 * @return {[type]} [description]
		 */
		change: function( event ) {
			var con = event.currentTarget,
				// 跳转
				$jump = this.$el.find('[data-elem=jump]'),
				// 替换字符
				num = con.value = con.value.replace(/[^\d]/g,'') * 1,
				// 处理
				data = this.model.toJSON();
			// 判断数据
			if ( num == NaN || num <= 0 || num > data.PageCount ) {
				num = con.value = data.PageNo;
			}
			// 改变值
			$jump.attr('href', '#' + data.hash + num);
		}
	});
	


	return Pagination;
});