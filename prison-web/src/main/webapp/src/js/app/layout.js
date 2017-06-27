var Layout = (function() {
    var $doc = $(document),
    	// body
    	$body = $('body'),
        // 当窗口出现resize时,所需要执行的方法数组
        resizeHandlers = [],
        // 当点击时处理
        cllickHandlers = [],
        // 是否按键
        keydownHandlers = {};
    // 处理布局随着窗口变化
    var handleOnResize = function() {
        var resize;
        $(window).resize(function(){
            resize = setTimeout(function(){
                resizeHandlers.forEach(function(item, i){
                    item.func.call(item.context);
                });
                clearTimeout(resize);
                resize = null;
            });
        });
    };
    // 处理全局点击事件
    var handleDocClick = function() {
        var click;
        $doc.on('click', function(){
            click = setTimeout(function(){
                var i = 0;
                for( ; i < cllickHandlers.length; i++ ) {
                    cllickHandlers[ i ] && cllickHandlers[ i ].call();
                }
                clearTimeout( click );
                click = null;
            });
        });
    };

    // 预定义键位
   var KEY = {
        CTRL: 17
    };
    // 处理是否按下某些键位
    var handleKeydown = function() {
        $doc.on('keydown', function( event ){
           if ( event.which === KEY.CTRL &&  !keydownHandlers.ctrl ) {
                keydownHandlers.ctrl = true;
           }
        }).on('keyup', function(){
            if ( keydownHandlers.ctrl )  keydownHandlers.ctrl = false;
        });
    };
    
    // 关闭弹出层
    var handleDialogClose = function() {
        $doc.on('click.dialog', '.cancel', function(){
            var $box = $(this).closest('.modal-dialog');
            if ( $box.length !== 0 ) {
                $box.find('.close').trigger('click');
            }
            
        });
    };

    // 新菜单处理
    var handleMenu = function() {
        $doc.on('click.menu', '.page-menu-list > li > a', function(){
            if ( this.href ) {
                $(this).parent()
                       .addClass('active')
                       .siblings()
                       .removeClass('active');
            }
        });

        $doc.on('click.subMenu', '.items-list > li > a', function(){
           if ( this.href ) {
                var $itemLi = $(this).closest('li');
                // 第二级
                $itemLi.addClass('active')
                       .siblings()
                       .removeClass('active');                
                // 第一级
                $itemLi.parent()
                       .closest('li')
                       .addClass('active')
                       .siblings()
                       .removeClass('active');
           }
        });

        $doc.on('click.subMenu', '.sub-items-list > li > a', function(){
            var $subLi = $(this).closest('li'),
                $itemLi = $subLi.parent().closest('li'),
                $pageLi = $itemLi.parent().closest('li');
            // 第三级加上激活
            $subLi.addClass('active')
                  .siblings()
                  .removeClass('active');
            // 第二级
            $itemLi.addClass('active')
                   .siblings()
                   .removeClass('active');
            // 第一级
            $pageLi.addClass('active')
                   .siblings()
                   .removeClass('active');
        });
    };

    // 搜索显示与隐藏
    var handleSearch = function() {
        // 全局搜索
        $doc.on('click.search', '.quick-search-toggler > a', function(){
            var $this = $(this);
            // 判断
            if ( !$this.hasClass('on') ) {
                $this.addClass('on');
                $this.prev().width( 150 );
            } else {
                $this.removeClass('on');
                $this.prev().width( 0 );
            }
        });

        // 列表搜索
        $doc.on('click.searchBar', '.open-advance-bar', function(){
            var $box = $(this).closest('.widget-table-action').nextAll('.widget-more-action');
            if ( $box.hasClass('on') ) {
                $(this).html('<i class="iconfont">&#xe638;</i>展开');
                $box.removeClass('on').height('0');
            } else {
                $box.addClass('on').height('50');
                $(this).html('<i class="iconfont">&#xe637;</i>收起');
            }
        });

        // form重置
        $doc.on('click.reset', '.reset', function(){
            var form = $(this).closest('form')[0].reset();
        });
    };

    /**
     * 委托处理自定义弹出层显示与关闭
     * @return { undefined } [ 无返回 ]
     */
    var handleLayer = function() {
        // 点击显示与关闭
        $doc.on('click', '[data-toggle=layer]', function(){
            var $layer = $(this).next();
            // 弹出
            if ( $layer.hasClass('show') ) {
                $layer.removeClass('show');
            } else {
                $layer.addClass('show');
            }
        });
        var leave = function( $layer ) {
                // 添加样式
                $layer.addClass('leave').removeClass('enter');
            },
            enter = function( $layer ) {
                // 移除样式
                $layer.removeClass('leave').addClass('enter');
            };
        $doc.on('click', '[data-hover=layer]', function(){
            // 关闭所有其他的框
            $('.overview .layer').removeClass('show leave');
            var $layer = $(this).nextAll('.layer').eq( 0 );
            // 添加显示样式
            $layer.addClass('show');
            enter( $layer );
        });
        // 移入移出
        $doc.on('mouseenter', '[data-hover=layer]', function(){
            // // 关闭所有其他的框
            // $('.overview .layer').removeClass('show leave');

            // var $layer = $(this).next();
            // // 添加显示样式
            // $layer.addClass('show');
            // enter( $layer );
        }).on('mouseleave', '[data-hover=layer]', function(){
            leave( $(this).next() );
        });
        $doc.on('mouseenter', '[data-layer=hover]', function(){

            // var opacity = $(this).css('opacity');
            // if ( opacity > 0 ) {
            //     enter( $(this) );
            // };
        }).on('mouseleave', '[data-layer=hover]', function(){
            var opacity = $(this).css('opacity');
            if ( opacity > 0 ) {
                leave( $(this) );
            }
        });
        // 点击关闭
        $doc.on('click', '[data-toggle-closed=layer]', function(){
            $(this).closest('.layer')
                   .removeClass('show')
                   .removeClass('leave');
            // 移除遮挡层
            $('.modal-backdrop').remove();

        });
    };

    /**
     * 自定义手风琴伸缩
     * @return { undefined } [ 无返回 ]
     */
    var handleAccordion = function() {
        $doc.on('click', '.collapse.tree', function(){
            var time = (new Date()).getTime();

            var $con = $(this),
                $parent = $con.parent(),
                $bodyer = $parent.next(),
                $box    = $parent.parent();
            // 下拉
            if ( $con.hasClass('open') ) {
                $con.removeClass('open');
                $bodyer.css('height', 0);
                //  // 获取父元素
                // var $parent = $bodyer.prev().closest('.bodyer');
                // if ( $parent.length > 0 ) {
                //     $parent.height( $parent.attr('data-height') );
                // }
            } else {
                $con.addClass('open');
                // 先去掉高度
                $bodyer.css({
                    'height': 'auto',
                    'visibility': 'hidden'
                });
                // console.log( $bodyer );
                // 然后获得其真实高度
                var height = $bodyer.height();
                // 让后再将其高度设置为0
                $bodyer.css({
                    'height': 0,
                    'visibility': 'visible'
                });
                setTimeout(function(){
                    // 最后展开
                    $bodyer.css('height', height);
                    // 获取父元素
                    // var $parent = $bodyer.prev().closest('.bodyer');
                    // if ( $parent.length > 0 ) {
                    //     $parent.height( $parent.attr('data-height') * 1 + height * 1 );
                    // }
                }, 13);
                // 同时隐藏其它
                var $open;
                $box.siblings().each(function(){
                    $open = $(this).find('.open');
                    if ( $open.length > 0 ) {
                        $(this).find('.bodyer').height(0);
                        $open.removeClass('open');
                    }
                });
            }
            // console.log( (new Date()).getTime() - time );
        });
    };

    /**
     * 全局重置按钮
     * @return {[type]} [description]
     */
    var handleReset = function() {
        $doc.on('click', '.reset', function(){
            var $form = $(this).closest('form');
            $form.find('select').each(function(){
                var $option = $(this).find('option:selected');
                $(this).next().find('.select2-selection__rendered').html( $option.text() );              
            });
        });
    };
   
    return {
        init: function() {
            handleOnResize();
            handleDialogClose();
            handleMenu();
            handleSearch();
            handleLayer();
            handleDocClick();
            handleAccordion();
            handleKeydown();
            handleReset();
        },
        addResizeHandler: function(func, context) {
            resizeHandlers.push({func: func, context: context || window});
        },
        addClickHandler: function( func ) {
            cllickHandlers.push( func );
        },
        keydownHandlers: keydownHandlers
    };

}).call(this, jQuery);

/****
相关UI插件初始化
****/
UI = (function($){
    var // 修正参数
        revise = function( selector ) {
            if ( typeof selector === 'string' ) {
                return $(selector);
            } else if ( selector instanceof Array ) {
                return selector;
            } else if ( typeof selector === 'object' ) {
                return $(selector);
            } else {
                return selector;
            }
        },
        // 获得唯一ID编号
        uniqueID = function( prefix ) {
          return 'prefix_' + Math.floor(Math.random() * (new Date()).getTime());
        };

    return {
        // 自定义滚动条
        iscroll: function( selector, options ) {
            var defaults = $.extend({
                allowPageScroll: true, // allow page scroll when the element scroll is ended
                size: '7px',
                color: '#bbb',
                wrapperClass: 'slimScrollDiv',
                railColor: '#eaeaea',
                position: 'right',
                alwaysVisible: false,
                railVisible: false,
                disableFadeOut: true
            }, options || {});
            // 修正参数
            var $elem = revise( selector, options );

            return $elem.each(function(){
                defaults.height = parseInt( $(this).css('max-height') );
                $(this).slimScroll( defaults );  
            });
        },
        // 日期与时间组件
        datetimepicker: function(selector, options) {
            var defaults = $.extend({
                format: "yyyy-mm-dd hh:ii:ss",
                autoclose: true,
                pickerPosition: "bottom-right",
                minuteStep: 1,
                todayBtn: true,
                language: 'zh-CN'
            }, options || {});
            // 修正参数
            var $elem = revise( selector, options );

            return $elem.datetimepicker(defaults);
        },
        // 日期组件
        datepicker: function(selector, options){
            var defaults = $.extend({
                dateFormat: 'yy-mm-dd',
                defaultDate: new Date()
            }, options || {});
            // 修正参数
            var $elem = revise( selector, options );

            return $elem.datepicker(defaults);
        },
        // bootstrap fileupload
        fileupload: function(selector, options) {
            var defaults = $.extend({
                showUpload: true,
                showRemove: true,
                language: 'zh',
                dropZoneEnabled: false
            }, options);
            // 修正参数
            var $elem = revise( selector, options );
            // 
            $elem.fileinput( defaults );
        },
        // tooltips
        tooltips: function(selector, options) {
            var $elem = revise( selector, options );
            // 绑定
            $elem.tooltip();
        },
        // jQuery 下拉选择
        iselect: function(selector, options) {
            if ( !selector ) return;

            var defaults = $.extend({
                handlezIndex: false
            }, options || {});

            var $elem = revise( selector, options );

            // return $elem.selectmenu();
            // 生成并
            $elem.select2(defaults);
            // 如果是IE兼容宽度
            if ( navigator.userAgent.match(/MSIE/) ) {
                $elem.css({width: '-=26px'});
            }
            // 绑定open事件
            $elem.on('select2:open', function(){
                var $list = $('.select2-container.select2-container--default.select2-container--open');
                 // 处理z-index问题
                if ( defaults.handlezIndex ) {
                    $list.css({'z-index': 10089});
                } else {
                    $list.css({'z-index': 100});
                }
            });
            // 绑定change事件
            if ( defaults.callback ) {
                var context = defaults.context || this;
                $elem.on('select2:select', function(){
                    defaults.callback.apply(context, arguments);
                });
            }
            return $elem;
        },
        // 时间选择
        timepicker: function(selector, options) {
            var defaults = $.extend({
                autoclose: true,
                minuteStep: 1,
                showSeconds: false,
                showMeridian: false
            }, options || {});

            var $elem = revise( selector, options );
            
            $elem.timepicker(defaults);
        },
        // 模态窗口
        dialog: function( selector, options ) {
            var defaults = $.extend({
                
            }, options || {});

            $elem = revise( selector, options );
            // 屏幕宽高
            var clientHeight = $(window).height(),
                clientWidth = $(window).width();
            // 获取宽高且判断是否存在自定义宽高
            var width = $elem.attr('data-width') || $elem.width(), 
                height = $elem.attr('data-height') || $elem.height();
            // left与top初始化
            var left = 0, top = 0;
            // 判断大小是否超出屏幕位大小
            if ( clientWidth > width ) {
                // style left
                left = (clientWidth - width) / 2;
            } else {
                width = clientWidth;
            }

            if ( clientHeight > height ) {
                top = ( clientHeight - height ) / 2;
            } else {
                height = clientHeight;
            }
                
            if ( top > 150 ) top = 150;
            // 可拖拽绑定
            $elem.draggable({
                  handle: ".modal-header"
            });
            // 弹窗
            $elem.css({
                left: left, 
                top: top,
                width: width,
                height: height
            }).modal( options );
            return $elem;
        },
        /**
         * 操作确认框
         * @return {[type]} [description]
         */
        confirm: function(message, callback) {
            var $layer = $('#confirm-frame'),
                $confirm = $layer.find('#confirm'),
                $content = $layer.find('#detail');
            // 消息提示
            $content.text( message );
            // 显示确认框
            $layer.addClass('show').css({'z-index': 10089});
            // 添加遮罩层
            $backdrop = $('<div>').addClass('modal-backdrop fade in').appendTo('body');
            // 确定事件绑定
            $confirm.on('click.confirm', function(){
                // 执行回调
                callback();
                // 解绑事件
                $confirm.off('click.confirm');
                // 隐藏
                $layer.removeClass('show');
                // 移除遮罩层
                $backdrop.remove();
            });
        },
        /**
         * 树组件
         * @param {object} [selector] 选择器或jquery或原生对象
         * @param  {object} options 参数配置
         * @return {[type]}         [description]
         */
        tree: function( selector, options, callback ) {
            var defaults = $.extend(true, {
                core : {
                    themes : {
                        responsive: false
                    }            
                },
                types : {
                    'default' : {
                        icon : "fa fa-folder icon-state-warning icon-lg"
                },
                file : {
                    icon : "fa fa-file icon-state-warning icon-lg"
                }
             },
             plugins: ["types"]
            }, options);

            $elem = revise( selector, options );

            $elem.jstree( defaults );
        },
        /**
         * 修改下提示框
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        alert: function( options ) {
            var defaults = $.extend({
                container: '',
                type: 'success',
                message: '',
                close: true,  // 是否需要手动关闭
                reset: true,
                focus: true,
                closeInSeconds: 3000,
                // icon: 'glyphicons glyphicons-ok-sign'
                icon: '&#xe61f;'
            }, options);
            var title = '成功';


            var $layer = $('#alert-frame'),
                $alert = $layer.find('.layer-alert'),
                $icon = $layer.find('#icon'),
                $title = $layer.find('#title'),
                $detail = $layer.find('#detail');

            if ( options.type === 'danger' ) {
                defaults.icon = '&#xe620;';
                $alert.attr('class', '').addClass('danger layer-alert');
                var title = '警告';
            } else if ( options.type === 'warning' ) {
                defaults.icon = '&#xe620;';
                $alert.attr('class', '').addClass('warning layer-alert');
                var title = '警告';
            } else if ( options.type === 'info' ) {
                $alert.attr('class', '').addClass('info layer-alert');
                var title = '信息';
                defaults.icon = '&#xe622';
            } else {
                defaults.icon = '&#xe61f;';
                $alert.attr('class', '').addClass('success layer-alert');
                var title = '成功';
            }


            $layer.addClass('show').css({'z-index': 10089});
            $icon.html( defaults.icon );
            $title.html( title );
            $detail.html( defaults.message );

            if ( defaults.close === true ) {
                setTimeout(function(){
                    $layer.removeClass('show');
                }, defaults.closeInSeconds);
            }
        }
    };
}).call(this, jQuery);