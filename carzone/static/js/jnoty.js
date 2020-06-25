(function($) {
    /** jnoty Wrapper - Establish a base jnoty Container for compatibility with older releases. **/
    $.jnoty = function( m , o ) {
        // To maintain compatibility with older version that only supported one instance we'll create the base container.
        if ( $('#jnoty').length === 0 )
            $('<div id="jnoty"></div>').addClass( (o && o.position) ? o.position : $.jnoty.defaults.position ).appendTo( (o && o.appendTo) ? o.appendTo : $.jnoty.defaults.appendTo );

        // Create a notification on the container.
        $('#jnoty').jnoty(m,o);
    };


    /** Raise jnoty Notification on a jnoty Container **/
    $.fn.jnoty = function( m , o ) {
        // Short hand for passing in just an object to this method
        if ( o === undefined && $.isPlainObject(m) ) {
            o = m;
            m = o.mesage;
        }

        if ( $.isFunction(this.each) ) {
            var args = arguments;

            return this.each(function() {
                /** Create a jnoty Instance on the Container if it does not exist **/
                if ( $(this).data('jnoty.instance') === undefined ) {
                    $(this).data('jnoty.instance', $.extend( new $.fn.jnoty(), { notifications: [], element: null, interval: null } ));
                    $(this).data('jnoty.instance').startup( this );
                }

                /** Optionally call jnoty instance methods, or just raise a normal notification **/
                if ( $.isFunction($(this).data('jnoty.instance')[m]) ) {
                    $(this).data('jnoty.instance')[m].apply( $(this).data('jnoty.instance') , $.makeArray(args).slice(1) );
                } else {
                    $(this).data('jnoty.instance').create( m , o );
                }
            });
        }
    };

    $.extend( $.fn.jnoty.prototype , {

        /** Default jnoty Settings **/
        defaults: {
            pool:               0,
            header:             '',
            group:              '',
            sticky:             false,
            position:           'top-right',
            appendTo:           'body',
            glue:               'after',
            theme:              'default',
            themeState:         'highlight',
            corners:            '10px',
            check:              250,
            life:               3000,
            closeDuration:      'normal',
            openDuration:       'normal',
            easing:             'swing',
            closer:             false,
            closeTemplate:      '&times;',
            closerTemplate:     '<div>[ close all ]</div>',
            log:                function() {},
            beforeOpen:         function() {},
            afterOpen:          function() {},
            open:               function() {},
            beforeClose:        function() {},
            close:              function() {},
            click:              function() {},
            animateOpen:        {
                opacity:        'show'
            },
            animateClose:       {
                opacity:        'hide'
            }
        },

        notifications: [],

        /** jnoty Container Node **/
        element:                null,

        /** Interval Function **/
        interval:               null,

        /** Create a Notification **/
        create: function( message , options ) {
            var o = $.extend({}, this.defaults, options);

            /* To keep backward compatibility with 1.24 and earlier, honor 'speed' if the user has set it */
            if (typeof o.speed !== 'undefined') {
                o.openDuration = o.speed;
                o.closeDuration = o.speed;
            }

            this.notifications.push({ message: message , options: o });

            o.log.apply( this.element , [this.element,message,o] );
        },

        render: function( n ) {
            var self = this;
            var message = n.message;
            var o = n.options;

            // Support for jQuery theme-states, if this is not used it displays a widget header
            o.themeState = (o.themeState === '') ? '' : 'ui-state-' + o.themeState;

            var notification = $('<div/>')
                .addClass('jGrowl-notification alert ' + o.themeState + ' ui-corner-all' + ((o.group !== undefined && o.group !== '') ? ' ' + o.group : ''))
                .append($('<button/>').addClass('jGrowl-close').html(o.closeTemplate))
                .append($('<div/>').addClass('jGrowl-header').html(o.header))
                .append($('<div/>').addClass('jGrowl-message').html(message))
                .data("jGrowl", o).addClass(o.theme).children('.jGrowl-close').bind("click.jGrowl", function() {
                    $(this).parent().trigger('jGrowl.beforeClose');
                    return false;
                })
                .parent();

            var notification = $('<div/>')
                .addClass('jnoty-container ' + o.themeState + '')
                .append($('<button/>').addClass('jnoty-close').html(o.closeTemplate))
                .append($('<div/>').addClass('jnoty-content')
                    .append($('<div/>').addClass('jnoty-header')
                        .append($('<span/>').addClass('jnoty-icon')
                            .append($('<i/>').addClass(o.icon)))
                        .append($('<span/>').addClass('jnoty-title').html(o.header)))
                    .append($('<div/>').addClass('jnoty-message').html(message)))
                .data("jnoty", o).addClass(o.theme).children('.jnoty-close').bind("click.jnoty", function () {
                    $(this).parent().trigger('jnoty.beforeClose');
                    return !1
                }).parent();


            /** Notification Actions **/
            $(notification).bind("mouseover.jnoty", function() {
                $('.jnoty-notification', self.element).data("jnoty.pause", true);
            }).bind("mouseout.jnoty", function() {
                $('.jnoty-notification', self.element).data("jnoty.pause", false);
            }).bind('jnoty.beforeOpen', function() {
                if ( o.beforeOpen.apply( notification , [notification,message,o,self.element] ) !== false ) {
                    $(this).trigger('jnoty.open');
                }
            }).bind('jnoty.open', function() {
                if ( o.open.apply( notification , [notification,message,o,self.element] ) !== false ) {
                    if ( o.glue == 'after' ) {
                        $('.jnoty-container:last', self.element).after(notification);
                    } else {
                        $('.jnoty-container:first', self.element).before(notification);
                    }

                    $(this).animate(o.animateOpen, o.openDuration, o.easing, function() {
                        // Fixes some anti-aliasing issues with IE filters.
                        if ($.support.opacity === false)
                            this.style.removeAttribute('filter');

                        if ( $(this).data("jnoty") !== null && typeof $(this).data("jnoty") !== 'undefined') // Happens when a notification is closing before it's open.
                            $(this).data("jnoty").created = new Date();

                        $(this).trigger('jGrowl.afterOpen');
                    });
                }
            }).bind('jnoty.afterOpen', function() {
                o.afterOpen.apply( notification , [notification,message,o,self.element] );
            }).bind('click', function() {
                o.click.apply( notification, [notification,message,o,self.element] );
            }).bind('jnoty.beforeClose', function() {
                if ( o.beforeClose.apply( notification , [notification,message,o,self.element] ) !== false )
                    $(this).trigger('jnoty.close');
            }).bind('jnoty.close', function() {
                // Pause the notification, lest during the course of animation another close event gets called.
                $(this).data('jnoty.pause', true);
                $(this).animate(o.animateClose, o.closeDuration, o.easing, function() {
                    if ( $.isFunction(o.close) ) {
                        if ( o.close.apply( notification , [notification,message,o,self.element] ) !== false )
                            $(this).remove();
                    } else {
                        $(this).remove();
                    }
                });
            }).trigger('jnoty.beforeOpen');

            /** Optional Corners Plugin **/
            if ( o.corners !== '' && $.fn.corner !== undefined ) $(notification).corner( o.corners );

            /** Add a Global Closer if more than one notification exists **/
            if ($('.jnoty-container:parent', self.element).length > 1 &&
                $('.jnoty-closer', self.element).length === 0 && this.defaults.closer !== false ) {
                $(this.defaults.closerTemplate).addClass('jnoty-closer ' + this.defaults.themeState + ' ui-corner-all').addClass(this.defaults.theme)
                    .appendTo(self.element).animate(this.defaults.animateOpen, this.defaults.speed, this.defaults.easing)
                    .bind("click.jnoty", function() {
                        $(this).siblings().trigger("jnoty.beforeClose");

                        if ( $.isFunction( self.defaults.closer ) ) {
                            self.defaults.closer.apply( $(this).parent()[0] , [$(this).parent()[0]] );
                        }
                    });
            }
        },

        /** Update the jnoty Container, removing old jnoty notifications **/
        update: function() {
            $(this.element).find('.jnoty-container:parent').each( function() {
                if ($(this).data("jnoty") !== undefined && $(this).data("jnoty").created !== undefined &&
                    ($(this).data("jnoty").created.getTime() + parseInt($(this).data("jnoty").life, 10))  < (new Date()).getTime() &&
                    $(this).data("jnoty").sticky !== true &&
                    ($(this).data("jnoty.pause") === undefined || $(this).data("jnoty.pause") !== true) ) {

                    // Pause the notification, lest during the course of animation another close event gets called.
                    $(this).trigger('jnoty.beforeClose');
                }
            });

            if (this.notifications.length > 0 &&
                (this.defaults.pool === 0 || $(this.element).find('.jnoty-container:parent').length < this.defaults.pool) )
                this.render( this.notifications.shift() );

            if ($(this.element).find('.jnoty-container:parent').length < 2 ) {
                $(this.element).find('.jnoty-closer').animate(this.defaults.animateClose, this.defaults.speed, this.defaults.easing, function() {
                    $(this).remove();
                });
            }
        },

        /** Setup the jnoty Notification Container **/
        startup: function(e) {
            this.element = $(e).addClass('jnoty').append('<div class="jnoty-container"></div>');
            this.interval = setInterval( function() {
                // some error in chage ^^
                var instance = $(e).data('jnoty.instance');
                if (undefined !== instance) {
                    instance.update();
                }
            }, parseInt(this.defaults.check, 10));
        },

        /** Shutdown jnoty, removing it and clearing the interval **/
        shutdown: function() {
            $(this.element).removeClass('jnoty')
                .find('.jnoty-container').trigger('jnoty.close')
                .parent().empty()
            ;

            clearInterval(this.interval);
        },

        close: function() {
            $(this.element).find('.jnoty-container').each(function(){
                $(this).trigger('jnoty.beforeClose');
            });
        }
    });

    /** Reference the Defaults Object for compatibility with older versions of jnoty **/
    $.jnoty.defaults = $.fn.jnoty.prototype.defaults;

})(jQuery);