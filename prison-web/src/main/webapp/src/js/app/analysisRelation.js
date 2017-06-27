/**
 * 人员关系分析
 * @param  {[type]} Global){} [description]
 * @return {[type]}             [description]
 */
define(['global'], function(Global){
	var analysisRelation = {};

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
		url: Global.path + '/main/selRelations.do'
			//url: Global.path + '/main/selRelations.do'

	}))();

	// 总视图
	var view = Backbone.View.extend({
		el: '#analysisRelation',
		events: {
			// 搜索
			'click.search [data-event=search]': 'search',
			// 从搜索结果中获取详细信息
			'click.find [data-event=find]': 'find',
			// 检索人员活动轨迹
			'click.retrieval [data-event=retrieval]': 'retrieval',
			// 关闭图标
			'click.slide [data-event=slide]': 'slide',
			// 渲染全部数据
			'click.all [data-event=all]': 'all',
			// 排序
			'click.sort [data-event=sort]': 'sort',
			// 放大
			'click.enlarge [data-event=enlarge]': 'enlarge',
			// 挂壁放大
			'click.unlarge [data-event=unlarge]': 'unlarge',
			//人员么关系网收起/展开
			'click.toggleRelation [data-event=toggleRelation]': 'toggleRelation',
		},
		initialize: function() {
			var self = this;
			this.$el = $(this.el);
			// 搜索条件框,搜索结果容器,模板
			this.$condition = this.$el.find('[name=condition]');
			this.$personList = this.$el.find('#personList');
			// this.personListTpl = _.template( $('#relationPersonListTpl').html() );
			// 人员详细信息容器模板
			this.$personInfo = this.$el.find('#personInfo');
			// this.personInfoTpl = _.template( $('#relationPersonInfoTpl').html() ); 
			// 活动范围内容区
			this.$container = this.$el.find('#container');
			// 列表容器与模板
			this.$data = this.$el.find('#relationData');
			// 页面初始化缓存
			this.cache = {
				person: this.$personInfo.html(),
				personlist: this.$personList.html()
			}
			// 处理高度
			Global.handleContainer();
			// 时间插件
			UI.datetimepicker( this.$el.find('.datetimepicker') );
			// 自适应
			self.$data.height( $(window).height() - 450 );
			Layout.addResizeHandler(function(){
				self.$data.height( $(window).height() - 450 );
			}, self);
		},
		load: function() {

		},
		/**
		 * 搜索人员
		 * @return {[type]} [description]
		 */
		search: function( ) {
			var self = this,
				content = self.cache.personlist,
				model,
				condition = $.trim(self.$condition.val());
			if ( condition != '' ) {
				persons.fetch({
					data: {condition: condition},
					type: 'post',
					success: function(collection, data, xhr) {
						if (data.data) {
							content = '';
							// 遍历
							$.each(persons.models, function(){
								model = this.toJSON();
								// 模板的拼接
								content += template('relationPersonListTpl', model);
							});
						}
						// 渲染
						self.$personList.show().html(content);
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
				self.$condition.val( data.data.peo_name );
				// 渲染人物信息
				self.$personInfo.html(template('relationPersonInfoTpl', data.data)); 
				// 隐藏
				self.$personList.hide();
				// 作为属性
				self.personModel = data.data;
				
			});
		},
		render: function( data ) {
			var self = this,
				content = '';
			// 遍历
			_.each(data, function(model, i){
				// 索引
				model.index = ++i;
				// 百分比
				model.percentage = (model.time / self.maxTime) * 100 + '%';
				// 换算成小时
				model.hour = (model.time / 3600000).toFixed( 2 );
				// 拼接内容字符串
				content += template('relationDataTpl', model);
			});
			// 渲染
			self.$data.find('tbody').html( content );
			// 滚动条
			UI.iscroll( self.$data );
		},
		/**
		 * 检索人员活动轨迹
		 * @return {[type]} [description]
		 */
		retrieval: function(){
			var self = this,
				// 参数
				param = {
					startTime: this.$el.find('[name=startTime]').val(),
					endTime: this.$el.find('[name=endTime]').val(),
					id: this.$el.find('[name=id]').val()
				};
			// 内容字符串
			$.http({
			    url: collection.url,
				dataType: 'json',
				data: param,
				type: 'post'
			}).done(function(data){
				//console.log("人员关系："+collection.url);
				self.data = data.data;
				self.codes = data.codes;
				self.coo = data.coo;
				// 默认按时间排序
				var codes = self.codes,
					len = self.codes.length,
					i = 0, j, swap;
				for( ; i < len - 1; i++ ) {
					for( j = 0; j < len - i - 1; j++ ) {
						if ( codes[j+1].time > codes[j].time ) {
							swap = codes[j];
							codes[j] = codes[j+1];
							codes[j+1] = swap;
						}
					}
				}
				// self.codes.sort(function(a, b){
				// 	return b.time * 1 - a.time * 1;
				// });
				// 最大相遇时间
				self.maxTime = codes[0].time;
				// 渲染轨迹
				//console.log(data);
				self.$container.html( template('relationRangeTpl', data) );
				// 需要添加滚动条容器
				var $ul = self.$container.find('.iscroll');
				// 计算高度 添加滚动条
				UI.iscroll( $ul.height( $(window).height() - 620 ) );
				// 渲染
				self.render( self.codes );
				// 排名前五的颜色
				var colors = [ '#F3BD00',  '#2B62C3',  '#408BCF',  '#F36E12', '#919191' ];
				// 五个人的时间总和
				var total = 0, unlimited = 4;
				// 遍历计算总和
				$.each(codes, function(i){
					if ( self.personModel.peo_id === this.peo_id ) {
						unlimited = 5;
					} else {
						total += this.time * 1;
					}
					if ( i == unlimited ) return false;
				});
				//----------------------------------
				//-这个是关系网图---------------------
				//----------------------------------
				// 关系数据
				console.log("ddd:"+self.personModel.peoName);
				var series = [{
					name: self.personModel.peoName,
					value: 0,
					x: 140,
					y: 120,
					symbol: 'rect',
					symbolSize: [50, 50],
					itemStyle: {
						normal: {
							color: '#FF0000'
						}
					}
				}], 
				// 指向数据
				links = [];  
				var x, y, p, text, color;
				$.each(codes, function(i){
					if ( self.personModel.peo_id === this.peo_id ) {
						return true
					};
					// 所占总时间的百分比
					p = this.time / total;
					// 奇偶判断计算位置
					if ( i == 0 ) {
						x = p * 240;
					} else if( i % 2 == 0 ) {
						// x轴位置
						x = p * 350;
					} else {
						x = 140 + p * 350;
					}
					// y轴位置
					if ( i == 0 ) {
						y = 70;
					} else {
						y = (i + 1) * 37;
					}
					// 压入数据
					series.push({
						name: this.peo_name,
						value: 0,
						x: x,
						y: y,
						symbol: 'circle',
						symbolSize: [40, 40],
						itemStyle: {
							normal: { color: (i == 4 ? '#FF0000' : colors[i]) }
						}
					});
					// 线标题
					//console.log("this.time:"+this.time);
				//	text = '相处' + (this.time / 3600000).toFixed(2) + '小时';
					text = '相处' + this.time + '小时';
					//console.log(text);
					color = '#999';
					
					// 压入指向数据
					links.push({
						source: self.personModel.peoName,
						'target': this.peo_name,
						label: {
							normal: {
								show: true,
								formatter: text,
								textStyle: {
									color: color,
									fontWeight: 600
								}
							}
						},
						lineStyle: {
							normal: { curveness: p, color: colors[i], width: p * 20 }
						}
					});
					if ( i == unlimited ) return false;
				});
				// 关系密切相关人员数据
				var netData = {
					    title: {
					        text: '与关'+ self.personModel.peoName +'系最密切的人',
					        textStyle: {
					        	fontSize: 16,
					        	fontWeight: 600
					        },
					        right: 0
					    },
					    tooltip: {},
					    animationDurationUpdate: 1500,
					    animationEasingUpdate: 'quinticInOut',
					    series : [
					        {
					            type: 'graph',
					            layout: 'none',
					            symbolSize: 50,
					            roam: true,
					            label: {
					                normal: {
					                    show: true,
					                    textStyle: {
					                    	fontSize: 10
					                    }
					                }
					            },
					            edgeLabel: {
					                normal: {
					                    textStyle: {
					                        fontSize: 10
					                    }
					                }
					            },
					            data: series,
					            links: links,
					            lineStyle: {
					                normal: {
					                    opacity: 0.9,
					                    width: 2,
					                    curveness: 0
					                }
					            }
					        }
					    ]
					};	
					// 获取容器
					var net = document.getElementById('relation-graph-net');
					// 初始化图标
					var netChart = echarts.init( net );
					// 渲染
					netChart.setOption( netData );
					//----------------------------------
					//-这个是饼图-----------------------
					//----------------------------------
					var legend = [], series = [], name;
					
					$.each(self.codes, function(i){
						// name = this.peo_name + '-' + this.time + '小时-' + (this.time * 100 / total).toFixed(2) + '%';
						legend.push( this.peo_name );
						series.push({
							value: this.time,
							name: this.peo_name,
							itemStyle: {
								normal: {
									color: colors[i]
								},
								emphasis: {
									color: colors[i]
								}
							}
						});

						if ( i == 4 ) return false;
					});

					var pieData = {
						title: {
							text: '与'+ self.personModel.peoName +'相处时长top5(小时)',
							x: 'left'
						},
						tooltip : {
							trigger: 'item',
							formatter: "{a} <br/>{b} : {c} ({d}%)"
						},
						legend: {
					        orient: 'vertical',
					        left: '56%',
					        top: 50,
					        data: legend
					    },
					    series: [{
							name: '姓名',
							type: 'pie',
							radius: '70%',
							center: ['30%', '60%'],
							data: series,
							itemStyle: {
								emphasis: {
									shadowBlur: 10,
									shadowOffsetX: 0,
									shadowColor: 'rgba(0, 0, 0, 0.5)'
								}
							},
							markPoint: {
								symbol: 'circle',
								symbolSize: 60
							}
						}]
					};

					var pie = document.getElementById('relation-graph-pie');
					var pieChart = echarts.init( pie ); 
						pieChart.setOption( pieData );

					//----------------------------------
					//-这个是柱状图---------------------
					//----------------------------------
					// 柱状图按次数排序
					self.codes.sort(function(a, b){
						return b.times * 1 - a.times * 1;
					});
					var yAxis = [], series = [];

					$.each(self.codes, function(i){
						yAxis.unshift( this.peo_name );
						series.unshift({
							value: this.times,
							itemStyle: {
								normal: {
									color: colors[i]
								}
							}
						});

						if ( i == 4 ) return false;
					});

					var colData = {
						    title: {
						        text: '与'+ self.personModel.peoName +'相遇次数TOP5(次)'
						    },
						    tooltip: {
						        trigger: 'axis',
						        axisPointer: {
						            type: 'shadow'
						        }
						    },
						    grid: {
						        left: '3%',
						        right: '4%',
						        bottom: '3%',
						        containLabel: true
						    },
						    xAxis: {
						    	name: '次',
						        type: 'value',
						        boundaryGap: [0, 0.1]
						    },
						    yAxis: {
						    	name: '姓名',
						        type: 'category',
						        data: yAxis
						    },
						    series: [
						        {
						            name: '2016/5/8-2016/5/10',
						            type: 'bar',
						            data: series,
						            barWidth: 20,
						            center: ['30%', '60%']
						        }
						    ]
						};
						var col= document.getElementById('relation-graph-column');

						var colChart = echarts.init( col ); 
							colChart.setOption( colData );
			})
		},
		/**
		 * 分析与某个具体的人相处时间
		 * @return {[type]} [description]
		 */
		analysis: function( event ) {
			var id = event.currentTarget.getAttribute('data-id'),
				canvas = document.getElementById('relation-graph-sis'),
				$layer = $(canvas).closest('.layer'),
				chart = echarts.init( canvas ),
				json;

			// 遍历获取
			$.each(this.codes, function(){
				if ( this.peo_id == id ) {
					json = this; 
					return false;
				}
			});

			var dates = [], data1 = [], data2 = [];
			$.each(json.timeinfo, function(){
				dates.push( this.datetime );
				data1.push( this.onetime );
				data2.push( this.alltime );
			});

			option = {
				title: {
			        text: '与'+ json.peo_name + '相处时长',
			        textStyle: {
			        	fontWeight: 600,
			        	fontSize: 14,
			        	color: '#333'
			        }
			    },
			    tooltip: {
        			trigger: 'axis'
    			},
    			legend: {
			        data:['相遇时长', '累计相遇时长']
			    },
			    xAxis: {
			            type: 'category',
			            boundaryGap: true,
			            data: dates,
			            name: '日期'
			        },
			    yAxis: {
			            type: 'value',
			            scale: true,
			            name: '相遇时长',
			            min: 0,
			            boundaryGap: [0.2, 0.2]
			        },
			    series: [
			        {
			            name:'累计时长',
			            type:'line',
			            data: data2,
			            itemStyle: {
		    				normal: {
		    					color: '#5B9BD5'
		    				}
		    			},
		    			lineStyle: {
		    				normal: {
		    					color: '#5B9BD5'
		    				}
		    			}
			        },
			        {
			            name:'当天时长',
			            type:'bar',
			            data: data1,
			            itemStyle: {
		    				normal: {
		    					color: '#ED7D31'
		    				}
		    			},
		    			barWidth: 20
			        }
			    ]
			};

			chart.setOption( option );
			// 显示
			$layer.addClass('show');
		},
		/**
		 * 关闭图表
		 * @return {[type]} [description]
		 */
		slide: function( event ) {
			var $con  = $(event.currentTarget),
				$box = $con.next();
			if ( $con.hasClass('on') ) {
				$con.removeClass('on');
				$box.height(300);
				$con.html('&#xe65b;');
				self.$data.css('height', '-=300px');
			} else {
				$con.addClass('on');
				$box.height(0);
				$con.html('&#xe669;');
				self.$data.css('height', '+=300px');
			}
			// 重新渲染滚动条
			UI.iscroll( self.$data );
		},
		/**
		 * [all description]
		 * @return {[type]} [description]
		 */
		all: function() {
			this.render( this.codes );
		},
		/**
		 * 选择处理单个
		 * @return {[type]} [description]
		 */
		choose: function( event ) {
			var i = event.currentTarget.getAttribute('data-index'),
				data = this.data[ i ];
			this.render( data.info );
		},
		sort: function( event ) {
			var $con = $(event.currentTarget),
				$th = $con.closest('th');
				field = $con.attr('data-field');
			// 移除相邻列的样式
			$th.siblings().find('.sort').removeClass('desc asc');

			if ( $con.hasClass('desc') ) {
				$con.removeClass('desc').addClass('asc');
				this.codes.sort(function(a, b){
					return a[ field ] * 1 - b[ field ] * 1;
				});
			} else {
				$con.removeClass('asc').addClass('desc');
				this.codes.sort(function(a, b){
					return b[ field ] * 1 - a[ field ]* 1;
				});
			};

			this.render( this.codes );
		},
		toggleRelation: function( event) {
			var self = this;
			var $con = $(event.currentTarget);
			$con.parent().toggleClass('slideUp');
			var $ul = self.$container.find('.iscroll');
			if ($con.parent().attr('class').indexOf('slideUp')>-1){
				// 计算高度 添加滚动条
				UI.iscroll( $ul.height( $(window).height() - 370 ) );
			}else{
				// 计算高度 添加滚动条
				UI.iscroll( $ul.height( $(window).height() - 620 ) );
			}
			$con.parent().next().slideToggle(300);
			//console.log('展开啊啊啊啊===',$con.parent().attr('class').indexOf('slideUp'));
		}
	});

	analysisRelation.init = function(){
		if ( !view.ins ) {
			view.ins = new view();
		}

		view.ins.load();
	};

	return analysisRelation;
});