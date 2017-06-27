/**
 * 生活习惯分析
 * @param  {[type]} Global){} [description]
 * @return {[type]}             [description]
 */
define(['global'], function(Global){
	var analysisHabit = {};


	// 人员模型
	var person = Backbone.Model.extend({
		idAttribute: 'peo_id',
		defaults: {
			cri_picpath: '',
			name: '',
			cri_charge: '',
			cri_startdate: '',
			peo_groupid: '',
			cri_sex: 0
		}
	});

	// 人员数据集合
	var persons = new (Backbone.Collection.extend({
		model: person,
		modelName: 'data',
		url: Global.path + '/main/findPeopleInfoByIdOrName.do'
	}))();

	var temp = {
            "peo_type": 1,
            "cri_no": 7,
            "peo_name": "张三",
            "peo_coo": "第一监区",
            "peo_id": "5906162753408182",
            "cri_prisonarea": "第一监区",
            "cri_beforename": "张三",
            "peo_no": 7,
            "cri_picpath": "assets/img/photo3.jpg",
            "peo_groupid": "3",
            "peo_loc": "二分监区",
            "locinfo": {
            	"coo_name": '科技楼'
            }
		}

	// 大数据模型
	var model = Backbone.Model.extend({
		
	});

	// 大数据集合
	var collection = new (Backbone.Collection.extend({
		model: model,
		modelName: 'data',
		modelSubName: 'data',
		url: Global.path + '/main/selHabits.do'
		//url: Global.path + '/a/da/traCriminalloc/findCriLife'
		//http://192.68.75.4:8080/prison-web/main/selHabits
			///prison-web/a/da/traCriminalloc/findCriLife

		
	}))();


	var view = Backbone.View.extend({
		el: '#analysisHabit',
		events: {
			// 搜索
			'click.search [data-event=search]': 'search',
			// 从搜索结果中获取详细信息
			'click.find [data-event=find]': 'find',
			// 检索人员活动轨迹
			'click.retrieval [data-event=retrieval]': 'retrieval',
			// 排序
			'click.sort [data-event=sort]': 'sort'
		},
		initialize: function(){
			var self = this;
			// 搜索条件框,搜索结果容器,模板
			this.$condition = this.$el.find('[name=condition]');
			this.$personList = this.$el.find('#personList');
			// 人员详细信息容器模板
			this.$personInfo = this.$el.find('#personInfo');
			// this.personInfoTpl = _.template( $('#habitPersonInfoTpl').html() ); 
			// 列表容器与模板
			this.$data = this.$el.find('#habitData');
			// this.dataTpl = _.template( $('#habitDataTpl').html() );
			// 页面初始化缓存
			this.cache = {
				person: this.$personInfo.html(),
				personlist: this.$personList.html()
			}
			// 处理高度
			Global.handleContainer();
			// UI
			UI.iselect( this.$el.find('.iselect'), {handlezIndex: true} );
			UI.datetimepicker( this.$el.find('.datetimepicker') );
			// 自适应
			self.$data.height( $(window).height() - 450 );
			Layout.addResizeHandler(function(){
				self.$data.height( $(window).height() - 450 );
			}, self);
			// 开始时间结束时间
			this.$start = this.$el.find('[name=startTime]');
			this.$end = this.$el.find('[name=endTime]');
		},
		/**
		 * 搜索人员
		 * @return {[type]} [description]
		 */
		search: function( ) {
			var self = this,
				content = self.cache.personlist,
				model,
				condition = $.trim( self.$condition.val() );
			if ( condition != '' ) {
				persons.fetch({
					data: { condition: condition },
					type: 'post',
					success: function(condition, data, xhr) {
						if ( data.data ) {
							content = '';
							// 遍历
							$.each(persons.models, function(){
								model = this.toJSON();
								// 模板的拼接
								content += template('habitPersonListTpl', model);
							});
						}
						// 渲染
						self.$personList.show().html( content )
						// 请求结束可以进行下一次请求
						isRequest = false;
					},
					error: function() {
						// 请求结束可以进行下一次请求
						isRequest = false;
					}
				});
			}
		},
		/**
		 * 显示人员详细
		 * @return {[type]} [description]
		 */
		find: function( event ) {
			var self = this,
				id = event.currentTarget.getAttribute('data-id');
			$.http({
				url: Global.path + '/main/loadInfoByCondition.do',
				dataType: 'json',
				type: 'post',
				data: {id: id}
			}).done(function(data){
				self.$condition.val( data.data.peoName );
				// 渲染人物信息
				self.$personInfo.html( template( 'habitPersonInfoTpl', data.data ) ); 
				// 隐藏
				self.$personList.hide();
				// 作为属性
				self.personModel = data.data;
			});
		},
		/**
		 * 处理x轴日期显示
		 * @return {[type]} [description]
		 */
		handleDate: function( start, end ) {
			var data = [],
				i = 0,
				startStamp = (new Date( start )).getTime(),
				lastDay = start,
				dayStamp = 86400000;
			while( lastDay < end ) {
				lastDay = (new Date( startStamp + dayStamp * i )).Format('yyyy-MM-dd');
				data.push( lastDay );
				i++;
			}
			data.pop();
			return data;
		},
		/**
		 * 检索人员活动轨迹
		 * @return {[type]} [description]
		 */
		retrieval: function(){
			console.log(collection.url);
			var self = this,
				// 起始与结束时间
				startTime = this.$start.val(),
				endTime = this.$end.val();
			// 参数
			var param = {
				clocStarttime: startTime,
				clocEndtime: endTime,
				clocCriid: this.$el.find('[name=id]').val(),
				pageNo: 1,
				pageSize: 10000
			};
			// 内容字符串
			$.http({
				url: collection.url,
				//url:'http://192.68.75.28:8800/maven_spring/selHabitsDemo.do',
				dataType: 'json',
				type: 'post',
				data: param
			}).done(function(data){
				// 返回数据
				self.data = data.data;
				self.codes=data.codes[0];
				//console.log( data.data+"--"+data.data.length);
				// 图标所需要的数据
				var legend = [], series = [],
					// x轴日期时间数据
					datax = self.handleDate( startTime, endTime ),
					dataItem1=[],dataItem2=[],dataItem3=[],
					dataItem4=[],dataItem5=[],dataItem6=[],
					dataItem=[
					  dataItem1,
					  dataItem2,
					  dataItem3,
					  dataItem4,
					  dataItem5,
					  dataItem6
				   ];
				// 遍历组装数据
				var temp = {peo_name:self.$el.find('[name=condition]').val()};
				var lgName=["监舍","晒衣间","活动室","阅览室","淋浴间","储藏室"];
				var lgName2=["jianshe","saiyijian","huodongshi","yuelanshi","linyujian","chucangshi"]
				
				_.each(self.data, function(model, i){
					//console.log(model+"--"+i);
					var id = i,
					name = lgName[i];
					/*var id = model.area.id,
					name = model.area.locName;*/
					dataItem1.push(model.jianshe*1);
					dataItem2.push(model.chucangshi*1);
					dataItem3.push(model.saiyijian*1);
					dataItem5.push(model.huodongshi*1);
					dataItem6.push(model.yuelanshi*1);
					dataItem4.push(model.linyujian*1);
					if ( _.indexOf( legend, name ) === -1 ) {
						
						temp[ name ] = {};
						legend.push( name );
						if(i<lgName.length){
						series.push({
							name: name,
							type: 'line',
							smooth: true,
						/*	data:[model.jianshe,model.chucangshi,
								model.saiyijian,model.huodongshi,
								model.yuelanshi,model.linyujian]*/
							data:dataItem[id]
							
						})
						}
					}
					
					var culTime = temp[ name ],
						date = (new Date( model.clocStarttime )).Format('yyyy-MM-dd');
					if ( !culTime[ date ] ) {
						culTime[ date ] = 0;
					}
					culTime[ date ] += (new Date( model.clocEndtime ).getTime() - new Date( model.clocStarttime ).getTime()) / 3600000;
					
				});	
				legend.pop();
				datax.pop();
				_.each(series, function(s,i){
					//不明所以的地方？？？
				   //s.data=dataItem[i];
					/*var a = temp[ s.name ];
						arr = s.data;
				
					_.each(datax, function( x ){
						if ( a[ x ] ) {
							arr.push( Math.abs(a[x].toFixed(2)) );	
						} else {
							arr.push( 0 );
						}
					});*/
				});
				var option = {
				    title: {
				        text: temp.peo_name + '生活习惯统计'
				    },
				    tooltip: {
				        trigger: 'axis'
				    },
				    legend: {
				        data: legend
				    },
				    grid: {
				        left: '3%',
				        right: '4%',
				        bottom: '3%',
				        containLabel: true
				    },
				    toolbox: {
				        feature: {
				            saveAsImage: {}
				        }
				    },
				    xAxis: {
				        type: 'category',
				        boundaryGap: false,
				        name: '日期',
				        data: datax
				    },
				    yAxis: {
				        type: 'value',
				        axisLabel: {
				        	 formatter: '{value}h'
				        },
				        max: 'dataMax',
				        boundaryGap: false,
				        splitLine: {
				        	show: false
				        },
				        axisLine: {
		                	lineStyle: {
		                    	color: '#d2d2d2'
		                	}
		           		},
		           		axisTick: {
		           			lineStyle: {
		                    	color: '#d2d2d2'
		                	}
		           		}
				    },
				    series: series
				};

				// 获取容器
				var line = document.getElementById('babit-graph-line');
				// 初始化图标
				var lineChart = echarts.init( line );
				// 渲染图表
				lineChart.setOption( option );
				// 渲染列表
				self.datax = datax;
				self.series = series;
				self.legend = legend;
				self.render();
			});
		},
		load: function() {

		},
		render: function() {
			var self = this,
				content = '',
				contentHeader = '',
				dataList = [];
			_.each(self.datax, function( x, i ){
				var model = {};
				model.datetime = x;
				model.fields = [];
				model.total = 0;
				
				
				_.each(self.series, function(s){
					model.fields.push( s.data[ i ] );
					model.total += s.data[ i ] * 1;
				})
				model.i = i++;
				model.total = (model.total).toFixed(2);
				//console.log('total',model.total);
				content += template( 'habitDataTpl', model );
			});
			// 头部统计
			var header = _.clone( self.legend );
			header.push('总计');
			header.unshift('日期');
			header.unshift('序号');
			_.each(header, function( name, i ){
				contentHeader += template( 'habitDataHeaderTpl', {name: name} );
			});
			
			// 渲染
			self.$data.find('thead > tr').html( contentHeader );
			self.$data.find('tbody').html( content );
			// 滚动条
			UI.iscroll( self.$data );
		},
		sort: function( event ) {
			var $con = $(event.currentTarget),
				$th = $con.closest('th'),
				field = $con.attr('data-field'),
				$tbody = this.$data.find('tbody'),
				index = $th.index();
			// 移除相邻列的样式
			$th.siblings().find('.sort').removeClass('desc asc');
			var $trs = $tbody.find('tr'),
				len = $trs.length,
				content = '',
				trs = [].slice.apply($trs, [0, len]),
				i = 0;
			if ( $con.hasClass('desc') ) {
				$con.removeClass('desc').addClass('asc');
				for( ; i < len - 1; i++ ) {
					for( var j = 0; j < len-i-1; j++ ) {
						var a = $(trs[j]).find('td')[index],
							av = $(a).text().replace(/\D/gim, ''),
							b = $(trs[j+1]).find('td')[index],
							bv = $(b).text().replace(/\D/gim, ''),
							swap;
						if ( av > bv ) {
							swap = trs[j];
							trs[j] = trs[j+1];
							trs[j+1] = swap;
						}
					}
				}
			} else {
				$con.removeClass('asc').addClass('desc');
				for( ; i < len - 1; i++ ) {
					for( var j = 0; j < len - i - 1; j++ ) {
						var a = $(trs[j]).find('td')[index],
							av = $(a).text().replace(/\D/gim, ''),
							b = $(trs[j+1]).find('td')[index],
							bv = $(b).text().replace(/\D/gim, ''),
							swap;
						if ( av < bv ) {
							swap = trs[j];
							trs[j] = trs[j+1];
							trs[j+1] = swap
						}
					}
				}
			};
			// console.log( $trs );
			_.each(trs, function(tr){
				content += $(tr).prop('outerHTML');
			})
			$tbody.html( content );
		}
	});

	analysisHabit.init = function() {
		if ( !view.ins ) {
			view.ins = new view();
		}

		view.ins.load();
	};

	return analysisHabit;
}); 