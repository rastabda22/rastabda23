(function() {

  var phFl = new PhotoFloat();
  var util = new Utilities();
  var speed = 500;

	/* constructor */
	function PinchSwipe() {
	}

  PinchSwipe.cssWidth = function(mediaSelector) {
    return parseInt($(mediaSelector).css("width"));
  }

  PinchSwipe.cssHeight = function(mediaSelector) {
    return parseInt($(mediaSelector).css("height"));
  }

  PinchSwipe.reductionWidth = function(mediaSelector) {
    return parseInt($(mediaSelector).attr("width"));
  }

  PinchSwipe.reductionHeight = function(mediaSelector) {
    return parseInt($(mediaSelector).attr("height"));
  }

  PinchSwipe.pinched = function(mediaSelector, initialCssWidth) {
    return PinchSwipe.cssWidth(mediaSelector) > initialCssWidth;
  }

  PinchSwipe.scrollMedia = function(distance) {
      $("#media-box-container").css("transition-duration", "0s");

      //inverse the number we set in the css
      var value = (distance <= 0 ? "" : "-") + Math.abs(distance).toString();
      $("#media-box-container").css("transform", "translate(" + value + "px,0)");
  }

  PinchSwipe.swipeMedia = function(distance) {
      $("#media-box-container").css("transition-duration", "0.5s");

      //inverse the number we set in the css
      var value = (distance <= 0 ? "" : "-") + Math.abs(distance).toString();
      $("#media-box-container").css("transform", "translate(" + value + "px,0)");
  }

  // define the actions to be taken on pinch, swipe, tap, double tap
	PinchSwipe.addGesturesDetection = function(detectionSelector) {

    mediaSelector = ".media-box#center .media-box-inner img";
		// get the two initial values:

		// the reduction width and height in the page
		var myCssWidth = PinchSwipe.cssWidth(mediaSelector);
		var myCssHeight = PinchSwipe.cssHeight(mediaSelector);

		// the reduction width and height
		var myReductionWidth = PinchSwipe.reductionWidth(mediaSelector);
		var myReductionHeight = PinchSwipe.reductionHeight(mediaSelector);

    var swipeOptions = {
      triggerOnTouchEnd: true,
      swipeStatus: swipeStatus,
      pinchStatus: pinchStatus,
      // allowPageScroll: "vertical",
      threshold: 75
    };

    /**
     * Catch each phase of the swipe.
     * move : we drag the div
     * cancel : we animate back to where we were
     * end : we animate to the next image
     */
    function swipeStatus(event, phase, direction, distance) {
      var array, savedSearchSubAlbumHash, savedSearchAlbumHash, element, triggerLoad, link, selector, media;
      //If we are moving before swipe, and we are going L or R in X mode, or U or D in Y mode then drag.
      console.log(phase, direction, distance);

      if (
        (true || direction == "left" || direction == "right")
      ) {
        if (phase == "move") {
          if (direction == "left") {
              PinchSwipe.scrollMedia(windowWidth + distance);
          } else if (direction == "right") {
              PinchSwipe.scrollMedia(windowWidth - distance);
          }
        } else if (phase == "cancel") {
          PinchSwipe.swipeMedia(windowWidth);
        } else if (phase == "end") {
          if (direction == "right") {
            PinchSwipe.swipeRight(prevMedia);
          } else if (direction == "left") {
            PinchSwipe.swipeLeft(nextMedia);
          } else if (direction == "down") {
            PinchSwipe.swipeDown(upLink);
          }
        }
      }
    }

    function pinchStatus(event, phase, direction, distance) {
    }


    /**
     * Manually update the position of the imgs on drag
     */

    $(function () {
      $(detectionSelector).swipe(swipeOptions);
    });
	};

  PinchSwipe.prototype.swipeOnWheel = function(event, delta) {
		if (currentMedia === null)
			return true;
		if (delta < 0) {
			PinchSwipe.swipeLeft(nextMedia);
			return false;
		} else if (delta > 0) {
			PinchSwipe.swipeRight(prevMedia);
			return false;
		}
		return true;
	}

	PinchSwipe.swipeRight = function(media) {
		$("#media-box-container").on(
      'webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd',
      function() {
        var array, savedSearchSubAlbumHash, savedSearchAlbumHash;

        $("#media-box-container").off('webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd');
        $("#media-box-container").css("transition-duration", "0s");

        // remove right image and move html code to left side
        $(".media-box#right").remove();
        // $("#media-box-container").css("transform", "translate(0px,0)");
        $(".media-box#center").attr('id', 'right');
        $(".media-box#left").attr('id', 'center');
        util.mediaBoxGenerator('left');
        $(".media-box#left").css("width", $(".media-box#center").attr('width')).css("height", $(".media-box#center").attr('height'));


        array = phFl.decodeHash(location.hash);
        // array is [albumHash, mediaHash, mediaFolderHash, savedSearchSubAlbumHash, savedSearchAlbumHash]
        savedSearchSubAlbumHash = array[3];
        savedSearchAlbumHash = array[4];
        window.location.href = phFl.encodeHash(currentAlbum, media, savedSearchSubAlbumHash, savedSearchAlbumHash);
      }
    );

    PinchSwipe.swipeMedia(0);
	}

	PinchSwipe.swipeLeft = function(media) {
    $("#media-box-container").on(
      'webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd',
      function() {
        var array, savedSearchSubAlbumHash, savedSearchAlbumHash;

        $("#media-box-container").off('webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd');
        $("#media-box-container").css("transition-duration", "0s");

        // remove left image and move html code to right side
        $(".media-box#left").remove();
        $("#media-box-container").css("transform", "translate(0px,0)");
        $(".media-box#center").attr('id', 'left');
        $(".media-box#right").attr('id', 'center');
        util.mediaBoxGenerator('right');
        $(".media-box#right").css("width", $(".media-box#center").attr('width')).css("height", $(".media-box#center").attr('height'));

        array = phFl.decodeHash(location.hash);
        // array is [albumHash, mediaHash, mediaFolderHash, savedSearchSubAlbumHash, savedSearchAlbumHash]
        savedSearchSubAlbumHash = array[3];
        savedSearchAlbumHash = array[4];
        window.location.href = phFl.encodeHash(currentAlbum, media, savedSearchSubAlbumHash, savedSearchAlbumHash);
      }
    );

    PinchSwipe.swipeMedia(windowWidth * 2);
	}

	PinchSwipe.prototype.swipeUp = function(dest) {
		// Actually swiping up is passing from an album to a media, so there is no animation
		// ...or... the media could be let enter from below, as in horizontal swipe... TO DO
    // As is, it doesn't work
		if (dest) {
			$(".media-box#center .media-box-inner").stop().animate(
        {
  				top: "-=" + window.innerHeight,
  			},
        300,
        function() {
  				window.location.href = dest;
  				$(".media-box#center .media-box-inner").hide().css('top', "");
  			}
      );
		}
	}

  PinchSwipe.swipeDown = function(dest) {
		if (dest) {
			$(".media-box#center .media-box-inner").stop().animate(
        {
  				top: "+=" + window.innerHeight,
  			},
        300,
        function() {
  				window.location.href = dest;
  				$("#media-view").hide();
  				$(".media-box#center .media-box-inner").css('top', "");
  			}
      );
		}
	}

  /* make static methods callable as member functions */
	PinchSwipe.prototype.swipeLeft = PinchSwipe.swipeLeft;
	PinchSwipe.prototype.swipeRight = PinchSwipe.swipeRight;
	PinchSwipe.prototype.swipeDown = PinchSwipe.swipeDown;
	PinchSwipe.prototype.addGesturesDetection = PinchSwipe.addGesturesDetection;

  window.PinchSwipe = PinchSwipe;
}());
