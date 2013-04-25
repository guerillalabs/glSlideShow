(function($){
	var methods = {
		init : function(options) {
			// use settings to hold the default class names of the slideshow elements
			// and a couple of other things
			var settings = {
				'slide'		: '.slide',
				'primary'	: '.primary',
				'filmStrip'	: '.film_strip',
				'interval'	: '3500' 
			};
			
			return this.each(function() {
				// if options exist, lets merge them with our default settings
				if (options) { 
					$.extend(settings, options);
				}
				
				// set variables
				var $this = $(this);
				var $slideBox = $this.find(settings.slide);
				var $primarySlide = $slideBox.find(settings.primary);
				var $filmStrip = $this.find(settings.filmStrip);
				var $slideList = $filmStrip.find('ul');
				var $first = $slideList.children("li:first");
				var $next = $slideList.children("li:eq(1)");
				var $previous = $slideList.children("li:last");
				
				// HTML manipulation - extra classes and elements
				$first.addClass('current');
				// create a holding div for the next image
				$slideBox.append('<div class="next_holder"><img src="'+$next.children("a").attr("href")+'" alt="'+$next.children("img").attr("alt")+'"></div>');
				var $nextHolder = $slideBox.find('.next_holder');
				// create a holding div for the previous image
				$slideBox.append('<div class="previous_holder"><img src="'+$previous.children("a").attr("href")+'" alt="'+$previous.children("img").attr("alt")+'"></div>');
				var $previousHolder = $slideBox.find('.previous_holder');
				// create current item frame
				$this.append('<div class="frame"></div>');
				var $frame = $this.find('.frame');
				
				// calculations, dimensions and such
				var slideItems = $slideList.find("li").length;
				var slideBoxWidth = $slideBox.outerWidth();
				var slideWidth = $first.outerWidth(true);
				var frameOffset = ($frame.outerWidth(true) - $first.innerWidth())/2;
				var slideScroll = "yes";
				// see if the film stip should rotate based on the number of items
				if (slideItems <= (slideBoxWidth+12)/slideWidth) {
					slideScroll = "no";
					// if it shouldn't rotate, we need to reset some CSS rules
					$slideList.css({'width' : 'auto', 'margin' : '0 auto', 'display' : 'inline-block'});
				}
				// set the initial position of the film strip
				if (slideScroll === "yes") {
					// we need to scroll it by the width of an item in the film strip
					// the width is calculated above
					$filmStrip.scrollLeft(slideWidth);
				}
				// position the frame
				var firstPosition = $first.position();
				var framePosition = "-9999";
				if (firstPosition.left !== -slideWidth) {
					framePosition = firstPosition.left-frameOffset;
				}
				$frame.css({'left' : framePosition});

				// do the actual rotation
				function rotate(direction) {
					// set all the variables (remember, some are different for forward and reverse)
					var $current, $listEnd, $next, $onDeck, nextHeight, scroll, $nextSequencedHolder, $previousSequencedHolder;
					$current = $slideList.children("li.current");
					// set reverse variables
					if (direction === "reverse") {
						$listEnd = $slideList.children("li:last");
						$next = $current.prev("li");
						if ($next.length === 0) {
							$next = $listEnd;
						}
						$onDeck = $next.prev("li");
						if ($onDeck.length === 0) {
							$onDeck = $listEnd;
						}
						nextHeight = $previousHolder.height();
						scroll = 0;
						$nextSequencedHolder = $previousHolder;
						$previousSequencedHolder = $nextHolder;
					// set forward variables
					} else {
						$listEnd = $slideList.children("li:first");
						$next = $current.next("li");
						if ($next.length === 0) {
							$next = $listEnd;
						}
						$onDeck = $next.next("li");
						if ($onDeck.length === 0) {
							$onDeck = $listEnd;
						}
						nextHeight = $nextHolder.height();
						scroll = slideWidth*2;
						$nextSequencedHolder = $nextHolder;
						$previousSequencedHolder = $previousHolder;
					}

					// Animation
					// change the size of the slide container if the new image is a different size
					$slideBox.stop().animate({
						height : nextHeight
					}, 500);
					// scroll the film strip if there are enough elements to allow for scrolling
					if (slideScroll === "yes") {
						$filmStrip.stop().animate({
						    scrollLeft : scroll
						}, 500, function() {
							// move the last (or first) item to the other end of the list
							$listEnd.remove();
							if (direction === "reverse") {
								$slideList.prepend($listEnd);	
							} else {
								$slideList.append($listEnd);
							}
							// reset the scroll once the last element has been moved
							$filmStrip.scrollLeft(slideWidth);
						});
					}
					// fade-in the new large image
					$nextSequencedHolder.stop(false, true).fadeIn("slow", function() {
						$slideBox.height("auto");
						$previousSequencedHolder.html($primarySlide.children("img"));
						$primarySlide.html($nextSequencedHolder.children("img"));
						$nextSequencedHolder.hide().html('<img src="'+$onDeck.children("a").attr("href")+'" alt="'+$onDeck.children("img").attr("alt")+'">');
					});
					
					// position the frame
					var position = $next.position();
					// if we are scrolling we have to add some additional space for the left item in the list that can't be seen
					var slideOff = 0;
					if (slideScroll === "yes") {
						slideOff = slideWidth;
					}
					var framePosition;
					// if position is 0, we hide the frame completely when scrolling
					if (position.left === 0) {
						if (slideScroll === "yes") {
							framePosition = -9999;
						} else {
							framePosition = -frameOffset;
						}
					} else {
						if (direction === "reverse") {
							framePosition = position.left+slideOff-frameOffset;
						} else {
							framePosition = position.left-slideOff-frameOffset;
						}
					}
					// if the frame is near (but outside) the boundaries of the container, we need to go ahead and hide it completely
					if (direction === "reverse") {
						if (framePosition > slideBoxWidth) {
							framePosition = -9999;
						}
					} else {
						if (framePosition < -frameOffset) {
							framePosition = -9999;
						}
					}
					$frame.css({'left' : framePosition});
					// change out the 'current' class
					$current.removeClass("current");
					$next.addClass("current");
				}

				// start the rotator timer
				var rotateTimer = setInterval(rotate, settings.interval);

				// create and set the functionality for the manual links
				$('<div class="buttons"></div>').appendTo($this).hide();
				var $buttons = $this.find('.buttons');
				// play/pause
				$('<p class="play_button"><a href="#" class="play">pause</a></p>').appendTo($buttons).toggle(function() {
					jQuery(this).children('a').removeClass("play").addClass("pause").text("play");
					clearInterval(rotateTimer);
				}, function() {
					jQuery(this).children('a').removeClass("pause").addClass("play").text("pause");
					rotate();
					rotateTimer = setInterval(rotate, settings.interval);
				});
				// forward			
				$('<p class="next_link"><a href="#">rotate to next</a></p>').appendTo($buttons).click(function(e) {
					e.preventDefault();
					var play_state = $this.find('.play_button a').attr('class');
					if (play_state === "play") {
						clearInterval(rotateTimer);
						rotateTimer = setInterval(rotate, settings.interval);
					}
					rotate();
				});
				// reverse
				$('<p class="previous_link"><a href="#">rotate to previous</a></p>').appendTo($buttons).click(function(e) {
					e.preventDefault();
					var play_state = $this.find('.play_button a').attr('class');
					if (play_state === "play") {
						clearInterval(rotateTimer);
						rotateTimer = setInterval(rotate, settings.interval);
					}
					rotate('reverse');
				});
				// show and hide
				$this.hover(
					function () {
						$buttons.fadeIn("slow");
					}, 
					function () {
						$buttons.fadeOut("slow");
					}
				);

				// click functionality
				$slideList.find("a").live("click", function(e) {
					e.preventDefault();			
					// set variables
					var $current = $slideList.children("li.current");
					var $clicked = $(this).closest('li');
					var $previous = $clicked.prev('li');
					var $onDeck = $clicked.next('li');
					if ($onDeck.length === 0) {
						$onDeck = $slideList.children("li:first");
					}

					// set frame position
					var position = $clicked.position();
					$(this).closest('.slideshow').find('.frame').css({'left' : position.left-frameOffset});

					// swap out what is in the nextHolder to what was clicked on
					$nextHolder.html('<img src="'+$clicked.children("a").attr("href")+'" alt="'+$clicked.children("img").attr("alt")+'">');
					var nextHeight = $nextHolder.height();
					// Animation
					// change the size of the slide container if the new image is a different size
					$slideBox.stop().animate({
						height : nextHeight
					}, 500);
					// fade-in the new large image
					$nextHolder.stop(false, true).fadeIn("slow", function() {
						$slideBox.height("auto");
						$previousHolder.html('<img src="'+$previous.children("a").attr("href")+'" alt="'+$previous.children("img").attr("alt")+'">');
						$primarySlide.html($nextHolder.children("img"));
						$nextHolder.hide().html('<img src="'+$onDeck.children("a").attr("href")+'" alt="'+$onDeck.children("img").attr("alt")+'">');
					});
					// change out the 'current' class
					$current.removeClass("current");
					$clicked.addClass("current");
					// reset the timer, unless we are paused
					var play_state = $('.slideshow .play_button a').attr('class');
					if (play_state === "play") {
						clearInterval(rotateTimer);
						rotateTimer = setInterval(rotate, settings.interval);
					}
				});

				// preload large images
				$slideList.find("a").lwSlideshow('cache');
		    });
		},
	    cache : function() {
			var cache = [];
			return this.each(function() {
				var cacheImage = document.createElement('img');
				cacheImage.src = $(this).attr("href");
				cache.push(cacheImage);
			});
		}
	};

	$.fn.lwSlideshow = function(method) {
		// Method calling logic
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	    } else if (typeof method === 'object' || ! method) {
			return methods.init.apply(this, arguments);
	    } else {
			$.error('Method ' +  method + ' does not exist on jQuery.lwSlideshow');
	    }    
	};
})(jQuery);


jQuery(document).ready(function() {
	jQuery(".slideshow").lwSlideshow();
});