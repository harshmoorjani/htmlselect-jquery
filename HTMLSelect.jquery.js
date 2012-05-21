(function($) {
	$.fn.HTMLSelect = function(options, functions) {
		var defaults = {
			options : {
				visibleOptions : -1,
				charWidth : -1,
				useHiddenInput : false,
				useJSHover : false,
				useJSFocus : false,
				inputClass : 'HTMLSelect',
				inputFocusClass : 'HTMLSelectFocus',
				wrapperClass : 'HTMLSelectOptionsWrapper',
				optionClass : 'HTMLSelectOption',
				optionSelectedClass : 'HTMLSelectOptionSelected',
				optionHoverClass : 'HTMLSelectOptionHover'
			},
			functions : {
				makeInputBox : function() {
					return $("<input type='text' readonly=''/>");
				},
				makeHiddenInputBox : function() {
					return $("<input type='hidden' name=''/>");
				},
				makeWrapperBox : function() {
					return $("<div></div>");
				},
				formatOptionRow : function(option) {
					return $("<a name='" + option.val() + "'>" + option.text() + "</a>");
				},
				detectCharWidth : function detectCharWidth(fontFamily, fontSize) {
					var text = "a b c d e f 1 2 3 4 5 6 A B C D E F ! ! %";
					var span = $("<span style='background:none; margin:0; padding:0; border:0; overflow:visible; width:auto; color:#FFFFFF; font-family:"+fontFamily+"; font-size:"+fontSize+";'>"+text+"</span>");
					$("body").append(span);
					var width = span.width()/text.length;
					span.remove();
					return width;
				},
				getFittingText : function getFittingText(charWidth, width, text) {
					return text.substr(0, Math.min(text.length, parseInt(width/charWidth)));
				}
			}
		};

		var o = $.extend(defaults.options, options);
		var f = $.extend(defaults.functions, functions);

		return this.each(function() {
			var browser = $(window);
			var selectBox = $(this);
			var inputBox = f.makeInputBox().addClass(o.inputClass);
			var wrapperBox = f.makeWrapperBox().addClass(o.wrapperClass);

			var totalOptions = $("option", selectBox).length;
			var selectedOption = $("option:selected", selectBox);
			var selectedIndex = $("option", selectBox).index(selectedOption);
			
			var hovering = false;
			var wrapperVisible = false;
			var charWidth = (o.charWidth != -1 && typeof o.charWidth == "number")?charWidth:f.detectCharWidth(inputBox.css("font-family"), inputBox.css("font-size"));

			var events = {
				focus :		function(e) {
								inputBox.get(0).selectionStart = inputBox.get(0).selectionEnd = -1;
								if(o.useJSFocus) {
									inputBox.addClass(o.inputFocusClass);
								}
							},
				blur :		function(e) {
								if(!hovering) {
									actions.close();
									if(o.useJSFocus) {
										inputBox.removeClass(o.inputFocusClass);
									}
								}
							},
				click :		function(e) {
								inputBox.get(0).selectionStart = inputBox.get(0).selectionEnd = -1;
								switch(wrapperVisible) {
									case true: actions.close(); break;
									case false: actions.open(); break;
								}
							},
				keydown :	function(e) {
								switch(e.keyCode) {
									case 9: // TAB
										actions.close();
										return;
									case 13: // ENTER
									case 27: // ESCAPE
										actions.close();
										break;
									case 37: // LEFT
									case 38: // UP
										if(selectedIndex != 0) {
											actions.accept(selectedIndex-1);
										}
										break;
									case 39: // RIGHT
									case 40: // DOWN
										if(selectedIndex != totalOptions-1) {
											actions.accept(selectedIndex+1);
										}
										break;
									case 33: // PAGEUP
									case 36: // HOME
										actions.accept(0);
										break;
									case 34: // PAGEDOWN
									case 35: // END
										actions.accept(totalOptions-1);
										break;
								}
								e.preventDefault();
							},
				select :	function(e) {
								var target = $(e.target);
								if(!target.hasClass(o.optionClass)) {
									target = target.parents("."+o.optionClass)[0];
									if(!target) {
										inputBox.focus();
										return;
									}
								}
								if(o.useJSFocus) {
									inputBox.removeClass(o.inputFocusClass);
								}
								actions.accept($(target));
								actions.close();
							},
				mouseover :	function(e) {
								$("."+o.optionSelectedClass, wrapperBox).removeClass(o.optionSelectedClass);
								hovering = true;

								if(o.useJSHover) {
									$("."+o.optionClass, wrapperBox).removeClass(o.optionHoverClass);
									var target = $(e.target);
									if(!target.hasClass(o.optionClass)) {
										target = target.parents("."+o.optionClass)[0];
										if(!target) {
											return;
										}
									}
									$(target).addClass(o.optionHoverClass);
								}
							},
				mouseout :	function(e) {
								if(o.useJSHover) {
									$("."+o.optionClass, wrapperBox).removeClass(o.optionHoverClass);
								}
								$("."+o.optionClass+":eq("+selectedIndex+")", wrapperBox).addClass(o.optionSelectedClass);
								hovering = false;
							}
			};

			var actions = {
				accept :	function(option) {
								if(typeof option == "number") {
									selectedIndex = option;
									option = $("."+o.optionClass+":eq("+selectedIndex+")", wrapperBox);
								}
								else {
									selectedIndex = $("."+o.optionClass, wrapperBox).index(option);
								}

								switch(o.useHiddenInput) {
									case true: hiddenInputBox.val(option.data('data').val); break;
									case false: $("option:eq("+selectedIndex+")", selectBox).attr("selected","selected"); break;
								}

								inputBox.val(f.getFittingText(charWidth, inputBox.width(), option.data('data').text));
								inputBox.get(0).selectionStart = inputBox.get(0).selectionEnd = -1;
								$("."+o.optionClass, wrapperBox).removeClass(o.optionSelectedClass).eq(selectedIndex).addClass(o.optionSelectedClass);
								actions.scroll();
							},
				open :		function() {
								var offset = inputBox.offset();
								wrapperBox.css({"top":offset.top+inputBox.outerHeight(), "left":offset.left});
								$("."+o.optionClass, wrapperBox).removeClass(o.optionSelectedClass).eq(selectedIndex).addClass(o.optionSelectedClass);
								wrapperBox.show();

								var willScroll = false;
								var firstOption = $("."+o.optionClass+":eq(0)", wrapperBox);
								if(o.visibleOptions != -1 && typeof o.visibleOptions == "number" && o.visibleOptions < totalOptions) {
									wrapperBox.css("height", o.visibleOptions*firstOption.outerHeight());
									willScroll = true;
								}

								if(wrapperBox.data("width") == null)
								{
									wrapperBox.css("overflow-y", "hidden");

									willScroll = willScroll || (wrapperBox.innerHeight() < firstOption.outerHeight()*totalOptions);
									var extraWidth = willScroll?20:0;
									var minWidth = inputBox.outerWidth()-2;
									$("."+o.optionClass, wrapperBox).each(function() {
										minWidth = Math.max(minWidth, $(this).outerWidth()+extraWidth);
									});

									wrapperBox.data("width", minWidth);
									wrapperBox.css("overflow-y", "auto");
								}
								wrapperBox.css("width", wrapperBox.data("width"));
								
								if(offset.top + inputBox.outerHeight() + wrapperBox.outerHeight() - browser.scrollTop() > browser.height()) {
									wrapperBox.css("top", offset.top - wrapperBox.outerHeight());
								}
								
								if(offset.left + wrapperBox.outerWidth() > browser.width()) {
									wrapperBox.css("left", offset.left + inputBox.outerWidth() - wrapperBox.outerWidth());
								}

								actions.scroll();
								wrapperVisible = true;
							},
				close :		function() {
								wrapperBox.hide();
								wrapperVisible = false;
							},
				scroll :	function() {
								var selectedOption = $("."+o.optionSelectedClass+":eq(0)", wrapperBox);
								if(selectedOption[0]) {
									selectedOption = $(selectedOption[0]);
									if(wrapperBox.height() < selectedOption.position().top + selectedOption.outerHeight() || selectedOption.position().top < 0) {
										wrapperBox.scrollTop(selectedOption.position().top + selectedOption.outerHeight() - wrapperBox.height() + wrapperBox.scrollTop());
									}
								}
							}
			};

			$("option", selectBox).each(function() {
				var thisOption = $(this);
				wrapperBox.append(f.formatOptionRow(thisOption).addClass(o.optionClass).data('data', {'text':thisOption.text(), 'val':thisOption.val()}));
			});

			selectBox.before(inputBox);
			selectBox.before(wrapperBox);
			
			inputBox.css("width", selectBox.outerWidth() - parseInt(inputBox.css("padding-right")) - parseInt(inputBox.css("padding-left")) - parseInt(inputBox.css("border-right-width")) - parseInt(inputBox.css("border-left-width")));
			inputBox.val(f.getFittingText(charWidth, inputBox.width(), selectedOption.text()));

			switch(o.useHiddenInput) {
				case true: 
					var hiddenInputBox = f.makeHiddenInputBox();
					hiddenInputBox.attr("name", selectBox.attr("name"));
					hiddenInputBox.val(selectedOption.val());
					selectBox.before(hiddenInputBox);
					selectBox.remove();
					break;
				case false:
					selectBox.hide();
					break;
			}
			
			inputBox.bind("focus.HTMLSelect", events.focus)
					.bind("blur.HTMLSelect", events.blur)
					.bind("click.HTMLSelect", events.click)
					.bind("keydown.HTMLSelect", events.keydown);
			
			wrapperBox.bind("click.HTMLSelect", events.select)
						.bind("mouseover.HTMLSelect", events.mouseover)
						.bind("mouseout.HTMLSelect", events.mouseout);
		});
	}
})(jQuery);