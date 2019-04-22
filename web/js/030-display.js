var fullScreenStatus = false;
var currentMedia = null;
var currentAlbum = null;
var nextMedia = null, prevMedia = null, upLink = "";
var nextBrowsingModeLink = null, prevBrowsingModeLink = null, bySearchViewLink = null, isABrowsingModeChange = false;
var nextBrowsingModeMessageId = null, prevBrowsingModeMessageId = null;
var windowWidth = $(window).outerWidth();
var windowHeight = $(window).outerHeight();
var fromEscKey = false;
var Options = {};
var isMobile = {
	Android: function() {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function() {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function() {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function() {
		return navigator.userAgent.match(/IEMobile/i);
	},
	any: function() {
		return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	}
};
// this variable permits to take into account the real mobile device pixels when deciding the size of reduced size image which is going to be loaded
var devicePixelRatio = window.devicePixelRatio || 1;

$(document).ready(function() {

	/*
	 * The display is not yet object oriented. It's procedural code
	 * broken off into functions. It makes use of libphotofloat's
	 * PhotoFloat class for the network and management logic.
	 *
	 * All of this could potentially be object oriented, but presently
	 * it should be pretty readable and sufficient. The only thing to
	 * perhaps change in the future would be to consolidate calls to
	 * jQuery selectors. And perhaps it'd be nice to move variable
	 * declarations to the top, to stress that JavaScript scope is
	 * for an entire function and always hoisted.
	 *
	 * None of the globals here polutes the global scope, as everything
	 * is enclosed in an anonymous function.
	 *
	 */

	/* Globals */

	var currentMediaIndex = -1;
	var previousAlbum = null;
	var previousMedia = null;
	var phFl = new PhotoFloat();
	var util = new Utilities();
	var pS = new PinchSwipe();
	var f = new Functions();
	var tF = new TopFunctions();
	var maxSize;
	var language;
	var firstEscKey = true;
	// var nextLink = "", prevLink = "";
	var mediaLink = "";

	// triplicate the #mediaview content in order to swipe the media
	var titleContent = $("#album-view").clone().children().first();
	util.mediaBoxGenerator('left');
	util.mediaBoxGenerator('right');
	$(".media-box#center").prepend(titleContent)[0].outerHTML;

	/* Displays */

	$("#menu-icon").off();
	$("#menu-icon").on("click", f.toggleMenu);

	/* Event listeners */

	$(document).on('keydown', function(e) {
		var isMap = $('#mapdiv').html() ? 1 : 0;
		var isPopup = $('.leaflet-popup').html() ? 1 : 0;
		if (! $("#search-field").is(':focus')) {
			if (! e.ctrlKey && ! e.shiftKey && ! e.altKey) {
				if (e.keyCode === 9) {
					//            tab
					e.preventDefault();
					if (pS.getCurrentZoom() == 1) {
						tF.toggleTitle(e);
						tF.toggleBottomThumbnails(e);
						return false;
					}
				} else if (e.keyCode === 39 && nextMedia && currentMedia !== null && ! isMap) {
					//     arrow right
					pS.swipeLeftOrDrag(nextMedia);
					return false;
				} else if (
					(e.keyCode === 78 || e.keyCode === 13 || e.keyCode === 32) &&
					//             n               return               space
					nextMedia && currentMedia !== null && ! isMap
				) {
					pS.swipeLeft(nextMedia);
					return false;
				} else if (
					(e.keyCode === 80 || e.keyCode === 8) &&
					//             p           backspace
					prevMedia && currentMedia !== null && ! isMap
				) {
					pS.swipeRight(prevMedia);
					return false;
				} else if (e.keyCode === 37 && prevMedia && currentMedia !== null && ! isMap) {
					//             arrow left
					pS.swipeRightOrDrag(prevMedia);
					return false;
				} else if (e.keyCode === 27) {
					//                    esc
					// warning: modern browsers will always exit fullscreen when pressing esc
					if (isMap) {
						if (isPopup) {
							// the popup is there: close it
							$('.leaflet-popup-close-button')[0].click();
							// $('#popup #popup-content').html("");
						} else
							// we are in a map: close it
							$('.modal-close')[0].click();
						return false;
					} else if (pS.getCurrentZoom() > 1 || $(".title").hasClass("hidden-by-pinch")) {
						pS.pinchOut();
						return false;
					} else if (! Modernizr.fullscreen && fullScreenStatus) {
						tF.goFullscreen(e);
						return false;
					} else if (upLink) {
						fromEscKey = true;
						pS.swipeDown(upLink);
						return false;
					}
				} else if ((e.keyCode === 38 || e.keyCode === 33) && upLink && ! isMap) {
					//                arrow up             page up
					pS.swipeDownOrDrag(upLink);
					return false;
				} else if (e.keyCode === 40 || e.keyCode === 34 && ! isMap) {
					//              arrow down           page down
				 	if (mediaLink && currentMedia === null) {
						pS.swipeUp(mediaLink);
						return false;
					} else if (pS.getCurrentZoom() > 1) {
						pS.swipeUpOrDrag(mediaLink);
						return false;
					}
				} else if (e.keyCode === 68 && currentMedia !== null && ! isMap) {
					//                      d
					$("#center .download-link")[0].click();
					return false;
				} else if (e.keyCode === 70 && currentMedia !== null && ! isMap) {
					//                      f
					tF.goFullscreen(e);
					return false;
				} else if (e.keyCode === 77 && currentMedia !== null && ! isMap) {
					//                      m
					f.toggleMetadata();
					return false;
				} else if (e.keyCode === 79 && currentMedia !== null && ! isMap) {
					//                      o
					$("#center .original-link")[0].click();
					return false;
				} else if (e.keyCode === 107 || e.keyCode === 187) {
					//             + on keypad                    +
					if (isMap) {
						// return false;
					} else if (currentMedia !== null) {
						pS.pinchIn();
						return false;
					}
				} else if (e.keyCode === 109 || e.keyCode === 189) {
					//         - on keypad                    -
					if (isMap) {
						// return false;
					} else if (currentMedia !== null) {
						pS.pinchOut();
						return false;
					}
				} else if (
					e.keyCode === 83 &&
					//             s
					! isMap &&
					(
						currentMedia !== null && util.hasGpsData(currentMedia) ||
						currentMedia === null && currentAlbum.positionsAndMediaInTree.length
					)
				) {
					$(".map-popup-trigger")[0].click();
					return false;
				}
			}

			// browsing mode switchers
			if (
				e.keyCode === 220 &&
				//         > or <
				currentMedia !== null &&
				! isMap
			) {
				if (! e.shiftKey && prevBrowsingModeLink !== null) {
					// it's a "<"
					$(".error").stop().hide().css("opacity", 100);
					$("#" + prevBrowsingModeMessageId).show();
					$("#" + prevBrowsingModeMessageId).fadeOut(2500, function(){util.HideId(prevBrowsingModeMessageId)});
					isABrowsingModeChange = true;
					window.location.href = prevBrowsingModeLink;
					return false;
				} else if (e.shiftKey && nextBrowsingModeLink !== null) {
					// it's a ">"
					$(".error").stop().hide().css("opacity", 100);
					$("#" + nextBrowsingModeMessageId).show();
					$("#" + nextBrowsingModeMessageId).fadeOut(2500, function(){util.HideId(nextBrowsingModeMessageId)});
					isABrowsingModeChange = true;
					window.location.href = nextBrowsingModeLink;
					return false;
				}
			}
		}

		if (
			(
				e.target.tagName.toLowerCase() != 'input' && e.keyCode === 69 ||
				//                                                         e: opens (and closes, if focus in not in input field) the menu
				$("ul#right-menu").hasClass("expand") && e.keyCode === 27
				//                                                    esc: closes the menu
			) &&
		 	! e.ctrlKey && ! e.shiftKey && ! e.altKey
		) {
			$("#menu-icon")[0].click();
			return false;
		}
		return true;
	});

	// $("#album-view").on('mousewheel', pS.swipeOnWheel);

	util.setLinksVisibility();
	util.setNextPrevVisibility();

	$(".media-box#center .metadata-show").on('click', f.showMetadataFromMouse);
	$(".media-box#center .metadata-hide").on('click', f.showMetadataFromMouse);
	$(".media-box#center .metadata").on('click', f.showMetadataFromMouse);

	$(".media-box#center .fullscreen").on('click', f.goFullscreenFromMouse);
	$("#next").attr("title", util._t("#next-media-title")).attr("alt", util._t("#next-media-title"));
	$("#prev").attr("title", util._t("#prev-media-title")).attr("alt", util._t("#prev-media-title"));
	$("#pinch-in").attr("title", util._t("#pinch-in-title")).attr("alt", util._t("#pinch-in-title"));
	$("#pinch-out").attr("title", util._t("#pinch-out-title")).attr("alt", util._t("#pinch-out-title"));
	if (isMobile.any()) {
		$("#pinch-in").css("width", "30px").css("height", "30px");
		$("#pinch-out").css("width", "30px").css("height", "30px");
	}
	$("#pinch-in").on("click", pS.pinchIn);
	$("#pinch-out").on("click", pS.pinchOut);

	// binds the click events to the sort buttons

	// search
	$('#search-button').on("click", function() {
		var searchOptions = '';
		var array = phFl.decodeHash(location.hash);
		var albumHash = array[0];

		// save the current hash in order to come back there when exiting from search
		if (util.isSearchCacheBase(albumHash)) {
			// a plain search: get the folder to search in from the search album hash
			Options.album_to_search_in = albumHash.split(Options.cache_folder_separator).slice(2).join(Options.cache_folder_separator);
		} else {
			// it's a subalbum of a search or it's not a search hash: use the current album hash
			Options.album_to_search_in = albumHash;

			Options.saved_album_to_search_in = Options.album_to_search_in;
		}

		if (! Options.hasOwnProperty('album_to_search_in') || ! Options.album_to_search_in)
			Options.album_to_search_in = Options.folders_string;

		var bySearchViewHash = "#!/" + Options.by_search_string;

		// build the search album part of the hash
		var searchTerms = encodeURIComponent($("#search-field").val().normalize().trim().replace(/  /g, ' ').replace(/ /g, '_'));
		if (searchTerms) {
			bySearchViewHash += Options.cache_folder_separator;
			if (Options.search_inside_words)
				searchOptions += 'i' + Options.search_options_separator;
			if (Options.search_any_word)
				searchOptions += 'n' + Options.search_options_separator;
			if (Options.search_case_sensitive)
				searchOptions += 'c' + Options.search_options_separator;
			if (Options.search_accent_sensitive)
				searchOptions += 'a' + Options.search_options_separator;
			if (Options.search_current_album)
				searchOptions += 'o' + Options.search_options_separator;
			// if (Options.search_refine)
			// 	searchOptions += 'e' + Options.search_options_separator;
			bySearchViewHash += searchOptions + searchTerms;
		}

		bySearchViewHash += Options.cache_folder_separator + Options.album_to_search_in;

		window.location.href = bySearchViewHash;

		f.focusSearchField();
		return false;
	});

	$('#search-field').keypress(function(ev) {
		if (ev.which == 13) {
			//Enter key pressed, trigger search button click event
			$('#search-button').click();
			f.focusSearchField();
			return false;
		}
	});

	$("li#inside-words").on('click', f.toggleInsideWordsSearch);
	$("li#any-word").on('click', f.toggleAnyWordSearch);
	$("li#case-sensitive").on('click', f.toggleCaseSensitiveSearch);
	$("li#accent-sensitive").on('click', f.toggleAccentSensitiveSearch);
	$("li#album-search").on('click', f.toggleCurrentAbumSearch);
	// $("li#refine-search").on('click', toggleRefineSearch);
	// function toggleRefineSearch(ev) {
	// 	f.Options.search_refine = ! Options.search_refine;
	// 	f.setBooleanCookie("search_refine", Options.search_refine);
	// 	f.updateMenu();
	// 	if (false && $("#search-field").val().trim())
	// 		$('#search-button').click();
	// 	f.focusSearchField();
	// }

	// subalbums
	$("li.album-sort.by-date").on('click', tF.sortAlbumsByDate);
	$("li.album-sort.by-name").on('click', tF.sortAlbumsByName);
	$("li.album-sort.sort-reverse").on('click', tF.sortAlbumsReverse);
	$("li.media-sort.by-date").on('click', tF.sortMediaByDate);
	$("li.media-sort.by-name").on('click', tF.sortMediaByName);
	$("li.media-sort.sort-reverse").on('click', tF.sortMediaReverse);
	$("ul#right-menu li.hide-title").on('click', tF.toggleTitle);
	$("ul#right-menu li.hide-bottom-thumbnails").on('click', tF.toggleBottomThumbnails);
	$("ul#right-menu li.slide").on('click', tF.toggleSlideMode);
	$("ul#right-menu li.spaced").on('click', tF.toggleSpacing);
	$("ul#right-menu li.album-names").on('click', tF.toggleAlbumNames);
	$("ul#right-menu li.media-count").on('click', tF.toggleMediaCount);
	$("ul#right-menu li.media-names").on('click', tF.toggleMediaNames);
	$("ul#right-menu li.square-album-thumbnails").on('click', tF.toggleAlbumsSquare);
	$("ul#right-menu li.square-media-thumbnails").on('click', tF.toggleMediaSquare);
	$("ul#right-menu li.show-big-albums").on('click', tF.toggleBigAlbumsShow);
	$("#menu-icon").off();
	$("#menu-icon").on("click", f.toggleMenu);


	$(window).hashchange(function() {
		if (isABrowsingModeChange)
			isABrowsingModeChange = false;
		else
			// the image has changed, reset the search link
			bySearchViewLink = null;
		$("#loading").show();
		$("#album-view").removeClass("hidden");
		$("link[rel=image_src]").remove();
		$("link[rel=video_src]").remove();
		$("ul#right-menu").removeClass("expand");
		// if (util.isMapHash(location.hash))
		// 	// map albums are generated passing the data from the map, so here we must exit
		// 	return;
		if (Object.keys(Options).length > 0)
			f.parseHash(location.hash, tF.hashParsed, util.die);
		else
			f.getOptions(location.hash, tF.hashParsed, util.die);
	});
	$(window).hashchange();

	$("#auth-form").submit(function() {
		var password = $("#password");
		password.css("background-color", "rgb(128, 128, 200)");
		phFl.authenticate(password.val(), function(success) {
			password.val("");
			if (success) {
				password.css("background-color", "rgb(200, 200, 200)");
				$(window).hashchange();
			} else
				password.css("background-color", "rgb(255, 64, 64)");
		});
		return false;
	});
});
