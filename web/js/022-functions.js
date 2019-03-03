(function() {

	var phFl = new PhotoFloat();
	var util = new Utilities();
	var pS = new PinchSwipe();

	/* constructor */
	function Functions() {
	}

	/* Displays */

	Functions.prototype.socialButtons = function() {
		var url, hash, myShareUrl = "";
		var mediaParameter;
		var folders, myShareText, myShareTextAdd;

		if (! isMobile.any()) {
			$(".ssk-whatsapp").hide();
		} else {
			// with touchscreens luminosity on hover cannot be used
			$(".album-button-and-caption").css("opacity", 1);
			$(".thumb-container").css("opacity", 1);
			$(".album-button-random-media-link").css("opacity", 1);
		}

		url = location.protocol + "//" + location.host;
		folders = location.pathname;
		folders = folders.substring(0, folders.lastIndexOf('/'));
		url += folders;
		if (currentMedia === null || currentAlbum !== null && ! currentAlbum.subalbums.length && currentAlbum.media.length == 1) {
			mediaParameter = util.pathJoin([
				Options.server_cache_path,
				Options.cache_album_subdir,
				currentAlbum.cacheBase
				]) + ".jpg";
		} else {
			var reducedSizesIndex = 1;
			if (Options.reduced_sizes.length == 1)
				reducedSizesIndex = 0;
			var prefix = util.removeFolderMarker(currentMedia.foldersCacheBase);
			if (prefix)
				prefix += Options.cache_folder_separator;
			if (currentMedia.mediaType == "video") {
				mediaParameter = util.pathJoin([
					Options.server_cache_path,
					currentMedia.cacheSubdir,
				]) + prefix + currentMedia.cacheBase + Options.cache_folder_separator + "transcoded_" + Options.video_transcode_bitrate + "_" + Options.video_crf + ".mp4";
			} else if (currentMedia.mediaType == "photo") {
				mediaParameter = util.pathJoin([
					Options.server_cache_path,
					currentMedia.cacheSubdir,
					prefix + currentMedia.cacheBase
				]) + Options.cache_folder_separator + Options.reduced_sizes[reducedSizesIndex] + ".jpg";
			}
		}

		myShareUrl = url + '?';
		myShareUrl += 'm=' + mediaParameter;
		hash = location.hash;
		if (hash)
			myShareUrl += '#' + hash.substring(1);

		myShareText = Options.page_title;
		myShareTextAdd = currentAlbum.physicalPath;
		if (myShareTextAdd)
			myShareText += ": " + myShareTextAdd.substring(myShareTextAdd.lastIndexOf('/') + 1);

		jQuery.removeData(".ssk");
		$('.ssk').attr('data-text', myShareText);
		$('.ssk-facebook').attr('data-url', myShareUrl);
		$('.ssk-whatsapp').attr('data-url', location.href);
		$('.ssk-twitter').attr('data-url', location.href);
		$('.ssk-google-plus').attr('data-url', myShareUrl);
		$('.ssk-email').attr('data-url', location.href);

		// initialize social buttons (http://socialsharekit.com/)
		SocialShareKit.init({
		});
		if (! Modernizr.flexbox && util.bottomSocialButtons()) {
			var numSocial = 5;
			var socialWidth = Math.floor(window.innerWidth / numSocial);
			$('.ssk').width(socialWidth * 2 + "px");
		}
	};

	Functions.updateMenu = function() {
		var albumOrMedia;
		// add the correct classes to the menu sort buttons
		if (currentMedia !== null) {
			// showing a media, nothing to sort
			$("#right-menu li.sort").addClass("hidden");
		} else if (currentAlbum !== null) {
			if (currentAlbum.subalbums.length <= 1) {
				// no subalbums or one subalbum
				$("ul#right-menu li.album-sort").addClass("hidden");
			} else {
				$("ul#right-menu li.album-sort").removeClass("hidden");
			}

			if (currentAlbum.media.length <= 1 || currentAlbum.media.length > Options.big_virtual_folders_threshold) {
				// no media or one media or too many media
				$("ul#right-menu li.media-sort").addClass("hidden");
			} else {
				$("ul#right-menu li.media-sort").removeClass("hidden");
			}

			var modes = ["album", "media"];
			for (var i in modes) {
				if (modes.hasOwnProperty(i)) {
					albumOrMedia = modes[i];
					if (currentAlbum[albumOrMedia + "NameSort"]) {
						$("ul#right-menu li." + albumOrMedia + "-sort.by-name").removeClass("active").addClass("selected");
						$("ul#right-menu li." + albumOrMedia + "-sort.by-date").addClass("active").removeClass("selected");
					} else {
						$("ul#right-menu li." + albumOrMedia + "-sort.by-date").removeClass("active").addClass("selected");
						$("ul#right-menu li." + albumOrMedia + "-sort.by-name").addClass("active").removeClass("selected");
					}

					if (
						currentAlbum[albumOrMedia + "NameSort"] && currentAlbum[albumOrMedia + "NameReverseSort"] ||
					 	! currentAlbum[albumOrMedia + "NameSort"] && currentAlbum[albumOrMedia + "DateReverseSort"]
					) {
						$("#right-menu li." + albumOrMedia + "-sort.sort-reverse").addClass("selected");
					} else {
						$("#right-menu li." + albumOrMedia + "-sort.sort-reverse").removeClass("selected");
					}
				}
			}
		}

		$("ul#right-menu li.ui").removeClass("hidden");

		$("ul#right-menu li.hide-title").removeClass("hidden");
		if (Options.hide_title)
			$("ul#right-menu li.hide-title").addClass("selected");
		else
			$("ul#right-menu li.hide-title").removeClass("selected");

		$("ul#right-menu li.hide-bottom-thumbnails").removeClass("hidden");
		if (Options.hide_bottom_thumbnails)
			$("ul#right-menu li.hide-bottom-thumbnails").addClass("selected");
		else
			$("ul#right-menu li.hide-bottom-thumbnails").removeClass("selected");

		if (
			currentMedia !== null ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && currentAlbum.subalbums.length === 0
		) {
			$("ul#right-menu li.slide").addClass("hidden");
		} else {
			$("ul#right-menu li.slide").removeClass("hidden");
			if (Options.albums_slide_style)
				$("ul#right-menu li.slide").addClass("selected");
			else
				$("ul#right-menu li.slide").removeClass("selected");
		}

		if (
			currentMedia !== null && ! $("#album-view").is(":visible") ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && currentAlbum.subalbums.length <= 1 && currentAlbum.media.length <= 1
		) {
			$("ul#right-menu li.spaced").addClass("hidden");
		} else {
			$("ul#right-menu li.spaced").removeClass("hidden");
			if (Options.spacing)
				$("ul#right-menu li.spaced").addClass("selected");
			else
				$("ul#right-menu li.spaced").removeClass("selected");
		}

		if (
			currentMedia !== null ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && currentAlbum.subalbums.length === 0) {
			$("ul#right-menu li.square-album-thumbnails").addClass("hidden");
		} else {
			$("ul#right-menu li.square-album-thumbnails").removeClass("hidden");
			if (Options.album_thumb_type == "square")
				$("ul#right-menu li.square-album-thumbnails").addClass("selected");
			else
				$("ul#right-menu li.square-album-thumbnails").removeClass("selected");
		}

		if (
			currentMedia !== null ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && (currentAlbum.subalbums.length === 0 || ! util.isFolderCacheBase(currentAlbum.cacheBase))
		) {
			$("ul#right-menu li.album-names").addClass("hidden");
		} else {
			$("ul#right-menu li.album-names").removeClass("hidden");
			if (Options.show_album_names_below_thumbs)
				$("ul#right-menu li.album-names").addClass("selected");
			else
				$("ul#right-menu li.album-names").removeClass("selected");
		}

		if (
			currentMedia !== null ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && currentAlbum.subalbums.length === 0 && Options.hide_title
		) {
			$("ul#right-menu li.media-count").addClass("hidden");
		} else {
			$("ul#right-menu li.media-count").removeClass("hidden");
			if (Options.show_album_media_count)
				$("ul#right-menu li.media-count").addClass("selected");
			else
				$("ul#right-menu li.media-count").removeClass("selected");
		}

		if (
			currentMedia !== null ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && (
				currentAlbum.media.length === 0 ||
				! util.isFolderCacheBase(currentAlbum.cacheBase) && currentAlbum.media.length > Options.big_virtual_folders_threshold
			)
		) {
			$("ul#right-menu li.media-names").addClass("hidden");
		} else {
			$("ul#right-menu li.media-names").removeClass("hidden");
			if (Options.show_media_names_below_thumbs)
				$("ul#right-menu li.media-names").addClass("selected");
			else
				$("ul#right-menu li.media-names").removeClass("selected");
		}

		if (
			currentMedia !== null && ! $("#album-view").is(":visible") ||
			util.isAlbumWithOneMedia(currentAlbum) ||
			currentAlbum !== null && (
				currentAlbum.media.length === 0 ||
				! util.isFolderCacheBase(currentAlbum.cacheBase) && currentAlbum.media.length > Options.big_virtual_folders_threshold
			)
		) {
			$("ul#right-menu li.square-media-thumbnails").addClass("hidden");
		} else {
			$("ul#right-menu li.square-media-thumbnails").removeClass("hidden");
			if (Options.media_thumb_type == "square")
			 	$("ul#right-menu li.square-media-thumbnails").addClass("selected");
			else
				$("ul#right-menu li.square-media-thumbnails").removeClass("selected");
		}

		if (
			$("ul#right-menu li.hide-title").hasClass("hidden") &&
			$("ul#right-menu li.hide-bottom-thumbnails").hasClass("hidden") &&
			$("ul#right-menu li.slide").hasClass("hidden") &&
			$("ul#right-menu li.spaced").hasClass("hidden") &&
			$("ul#right-menu li.album-names").hasClass("hidden") &&
			$("ul#right-menu li.media-count").hasClass("hidden") &&
			$("ul#right-menu li.media-names").hasClass("hidden") &&
			$("ul#right-menu li.square-album-thumbnails").hasClass("hidden") &&
			$("ul#right-menu li.square-media-thumbnails").hasClass("hidden")
		) {
			$("ul#right-menu li.ui").addClass("hidden");
		}

		if (
			currentAlbum !== null &&
			(util.isSearchCacheBase(currentAlbum.cacheBase) || currentAlbum.cacheBase == Options.by_search_string)
			||
			Options.search_inside_words ||
			Options.search_any_word ||
			Options.search_case_sensitive ||
			Options.search_accent_sensitive ||
			// Options.search_refine ||
			$("ul#right-menu li#no-search-string").is(":visible") ||
			$("ul#right-menu li#no-results").is(":visible") ||
			$("ul#right-menu li#search-too-wide").is(":visible")
		) {
			$("ul#right-menu li#inside-words").removeClass("hidden");
			$("ul#right-menu li#any-word").removeClass("hidden");
			$("ul#right-menu li#case-sensitive").removeClass("hidden");
			$("ul#right-menu li#accent-sensitive").removeClass("hidden");
			$("ul#right-menu li#album-search").removeClass("hidden");
			// $("ul#right-menu li#refine-search").removeClass("hidden");
			if (Options.search_inside_words)
				$("ul#right-menu li#inside-words").addClass("selected");
			else
				$("ul#right-menu li#inside-words").removeClass("selected");
			if (Options.search_any_word)
				$("ul#right-menu li#any-word").addClass("selected");
			else
				$("ul#right-menu li#any-word").removeClass("selected");
			if (Options.search_case_sensitive)
				$("ul#right-menu li#case-sensitive").addClass("selected");
			else
				$("ul#right-menu li#case-sensitive").removeClass("selected");
			if (Options.search_accent_sensitive)
				$("ul#right-menu li#accent-sensitive").addClass("selected");
			else
				$("ul#right-menu li#accent-sensitive").removeClass("selected");
			if (Options.search_current_album)
				$("ul#right-menu li#album-search").addClass("selected");
			else
				$("ul#right-menu li#album-search").removeClass("selected");
			// if (Options.search_refine)
			// 	$("ul#right-menu li#refine-search").addClass("selected");
			// else
			// 	$("ul#right-menu li#refine-search").removeClass("selected");
		} else {
			$("ul#right-menu li#inside-words").addClass("hidden");
			$("ul#right-menu li#any-word").addClass("hidden");
			$("ul#right-menu li#case-sensitive").addClass("hidden");
			$("ul#right-menu li#accent-sensitive").addClass("hidden");
			$("ul#right-menu li#album-search").addClass("hidden");
			// $("ul#right-menu li#refine-search").addClass("hidden");
		}
	};

	Functions.prototype.initializeSortPropertiesAndCookies = function() {
		// this function applies the sorting on the media and subalbum lists
		// and sets the album properties that attest the lists status

		// album properties reflect the current sorting of album and media objects
		// json files have subalbums and media sorted by date not reversed

		if (currentAlbum.albumNameSort === undefined) {
			currentAlbum.albumNameSort = false;
		}
		if (currentAlbum.albumDateReverseSort === undefined){
			currentAlbum.albumDateReverseSort = false;
		}
		if (currentAlbum.albumNameReverseSort === undefined){
			currentAlbum.albumNameReverseSort = false;
		}

		if (currentAlbum.mediaNameSort === undefined) {
			currentAlbum.mediaNameSort = false;
		}
		if (currentAlbum.mediaDateReverseSort === undefined){
			currentAlbum.mediaDateReverseSort = false;
		}
		if (currentAlbum.mediaNameReverseSort === undefined)
			currentAlbum.mediaNameReverseSort = false;

		// cookies reflect the requested sorting in ui
		// they remember the ui state when a change in sort is requested (via the top buttons) and when the hash changes
		// if they are not set yet, they are set to default values

		if (Functions.getBooleanCookie("albumNameSortRequested") === null)
			Functions.setBooleanCookie("albumNameSortRequested", Options.default_album_name_sort);
		if (Functions.getBooleanCookie("albumDateReverseSortRequested") === null)
			Functions.setBooleanCookie("albumDateReverseSortRequested", Options.default_album_reverse_sort);
		if (Functions.getBooleanCookie("albumNameReverseSortRequested") === null)
			Functions.setBooleanCookie("albumNameReverseSortRequested", Options.default_album_reverse_sort);

		if (Functions.getBooleanCookie("mediaNameSortRequested") === null)
			Functions.setBooleanCookie("mediaNameSortRequested", Options.default_media_name_sort);
		if (Functions.getBooleanCookie("mediaDateReverseSortRequested") === null)
			Functions.setBooleanCookie("mediaDateReverseSortRequested", Options.default_media_reverse_sort);
		if (Functions.getBooleanCookie("mediaNameReverseSortRequested") === null)
			Functions.setBooleanCookie("mediaNameReverseSortRequested", Options.default_media_reverse_sort);
	};

	Functions.prototype.sortAlbumsMedia = function() {
		// this function applies the sorting on the media and subalbum lists
		// and sets the album properties that attest the lists status

		// album properties reflect the current sorting of album and media objects
		// json files have subalbums and media sorted by date not reversed

		var m;

		if (Functions.needAlbumNameSort()) {
			currentAlbum.subalbums = util.sortByPath(currentAlbum.subalbums);
			currentAlbum.albumNameSort = true;
			currentAlbum.albumNameReverseSort = false;
			// $("li.album-sort.by-name").addClass("selected");
		} else if (Functions.needAlbumDateSort()) {
			currentAlbum.subalbums = util.sortByDate(currentAlbum.subalbums);
			currentAlbum.albumNameSort = false;
			currentAlbum.albumDateReverseSort = false;
		}

		if (Functions.needAlbumNameReverseSort() || Functions.needAlbumDateReverseSort()) {
			currentAlbum.subalbums = currentAlbum.subalbums.reverse();
			if (Functions.needAlbumNameReverseSort())
				currentAlbum.albumNameReverseSort = ! currentAlbum.albumNameReverseSort;
			else
				currentAlbum.albumDateReverseSort = ! currentAlbum.albumDateReverseSort;
		}

		if (Functions.needMediaNameSort()) {
			currentAlbum.media = util.sortByName(currentAlbum.media);
			currentAlbum.mediaNameSort = true;
			currentAlbum.mediaNameReverseSort = false;
			if (currentMedia !== null) {
				for (m = 0; m < currentAlbum.media.length; m ++) {
					if (currentAlbum.media[m].cacheBase == currentMedia.cacheBase && currentAlbum.media[m].foldersCacheBase == currentMedia.foldersCacheBase) {
						currentMediaIndex = m;
						break;
					}
				}
			}
		} else if (Functions.needMediaDateSort()) {
			currentAlbum.media = util.sortByDate(currentAlbum.media);
			currentAlbum.mediaNameSort = false;
			currentAlbum.mediaDateReverseSort = false;
			if (currentMedia !== null) {
				for (m = 0; m < currentAlbum.media.length; m ++) {
					if (currentAlbum.media[m].cacheBase == currentMedia.cacheBase && currentAlbum.media[m].foldersCacheBase == currentMedia.foldersCacheBase) {
						currentMediaIndex = m;
						break;
					}
				}
			}
		}
		if (Functions.needMediaDateReverseSort() || Functions.needMediaNameReverseSort()) {
			currentAlbum.media = currentAlbum.media.reverse();
			if (Functions.needMediaNameReverseSort())
				currentAlbum.mediaNameReverseSort = ! currentAlbum.mediaNameReverseSort;
			else
				currentAlbum.mediaDateReverseSort = ! currentAlbum.mediaDateReverseSort;
			if (currentMediaIndex !== undefined && currentMediaIndex != -1)
				currentMediaIndex = currentAlbum.media.length - 1 - currentMediaIndex;
		}
	};

	Functions.prototype.scrollToThumb = function() {
		var media, thumb;

		media = currentMedia;
		if (media === null) {
			media = previousMedia;
			if (media === null)
				return;
		}
		$("#thumbs img.thumbnail").each(function() {
			if (
				(util.isFolderCacheBase(currentAlbum.cacheBase) || currentAlbum.cacheBase == Options.folders_string) && this.title === media.albumName ||
				util.isByDateCacheBase(currentAlbum.cacheBase) && this.title === media.albumName ||
				util.isByGpsCacheBase(currentAlbum.cacheBase) && this.title === media.albumName ||
				util.isSearchCacheBase(currentAlbum.cacheBase) && this.title === media.albumName
			) {
				thumb = $(this);
				return false;
			}
		});
		if (typeof thumb === "undefined")
			return;
		if (currentMedia !== null) {
			var scroller = $("#album-view");
			scroller.stop().animate(
				{ scrollLeft: thumb.parent().position().left + scroller.scrollLeft() - scroller.width() / 2 + thumb.width() / 2 }, "slow"
			);
		} else
			$("html, body").stop().animate({ scrollTop: thumb.offset().top - $(window).height() / 2 + thumb.height() }, "slow");

		if (currentMedia !== null) {
			$(".thumb-container").removeClass("current-thumb");
			thumb.parent().addClass("current-thumb");
		}
	};

	Functions.prototype.videoOK = function() {
	if (! Modernizr.video || ! Modernizr.video.h264)
		return false;
	else
		return true;
	};

	Functions.prototype.addVideoUnsupportedMarker = function(id) {
		if (! Modernizr.video) {
			$(".media-box#" + id + " .media-box-inner").html('<div class="video-unsupported-html5"></div>');
			return false;
		}
		else if (! Modernizr.video.h264) {
			$(".media-box#" + id + " .media-box-inner").html('<div class="video-unsupported-h264"></div>');
			return false;
		} else
			return true;
	};

	Functions.prototype.setOptions = function() {
		var albumThumbnailSize, mediaThumbnailSize;
		albumThumbnailSize = Options.album_thumb_size;
		mediaThumbnailSize = Options.media_thumb_size;
		$("body").css("background-color", Options.background_color);

		$(".title").css("font-size", Options.title_font_size);
		$(".title-anchor").css("color", Options.title_color);
		$(".title-anchor").hover(function() {
			//mouse over
			$(this).css("color", Options.title_color_hover);
		}, function() {
			//mouse out
			$(this).css("color", Options.title_color);
		});
		$(".media-name").css("color", Options.title_image_name_color);
		$(".thumb-and-caption-container").css("margin-right", Options.spacing.toString() + "px").css("margin-bottom", Options.spacing.toString() + "px");

		if (currentMedia !== null || ! Options.show_media_names_below_thumbs)
			$(".media-caption").addClass("hidden");
		else
			$(".media-caption").removeClass("hidden");

		if (Options.show_album_media_count)
			$(".title-count").removeClass("hidden");
		else
			$(".title-count").addClass("hidden");

		if (Options.hide_title)
			$(".title").addClass("hidden-by-option");
		else
			$(".title").removeClass("hidden-by-option");

		if (Options.hide_bottom_thumbnails && (currentMedia != null || util.isAlbumWithOneMedia(currentAlbum))) {
			$("#album-view").addClass("hidden-by-option");
		} else {
			$("#album-view").removeClass("hidden-by-option");
		}
	};

	Functions.prototype.pinchSwipeInitialization = function(containerHeight, containerWidth) {
		pS.initialize();
		pS.setPinchButtonsPosition(containerHeight, containerWidth);
		util.correctPrevNextPosition();
	};

	Functions.getBooleanCookie = function(key) {
		var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
		if (! keyValue)
			return null;
		else if (keyValue[2] == 1)
			return true;
		else
			return false;
	};

	Functions.threeYears = function() {
		// returns the expire interval for the cookies, in seconds
		// = 1000 days, ~ 3 years
		return 1000 * 24 * 60 * 60;
	};

	Functions.setBooleanCookie = function(key, value) {
		var expires = new Date();
		expires.setTime(expires.getTime() + Functions.threeYears() * 1000);
		if (value)
			value = 1;
		else
			value = 0;
		document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
		return true;
	};

	Functions.getCookie = function(key) {
		var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
		if (! keyValue)
			return null;
		else
			return keyValue[2];
	};

	Functions.getNumberCookie = function(key) {
		var keyValue = Functions.getCookie(key);
		if (keyValue === null)
			return null;
		else
			return parseFloat(keyValue);
	};

	Functions.prototype.setCookie = function(key, value) {
		var expires = new Date();
		expires.setTime(expires.getTime() + Functions.threeYears() * 1000);
		document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
		return true;
	};

	// this function refer to the need that the html showed be sorted
	Functions.needAlbumNameSort = function() {
		var result =
			currentAlbum.subalbums.length &&
			! currentAlbum.albumNameSort &&
			Functions.getBooleanCookie("albumNameSortRequested");
		return result;
	};

	Functions.needAlbumDateSort = function() {
		var result =
			currentAlbum.subalbums.length &&
			currentAlbum.albumNameSort &&
			! Functions.getBooleanCookie("albumNameSortRequested");
		return result;
	};

	Functions.needAlbumDateReverseSort = function() {
		var result =
			currentAlbum.subalbums.length &&
			! currentAlbum.albumNameSort &&
			currentAlbum.albumDateReverseSort !== Functions.getBooleanCookie("albumDateReverseSortRequested");
		return result;
	};

	Functions.needAlbumNameReverseSort = function() {
		var result =
			currentAlbum.subalbums.length &&
			currentAlbum.albumNameSort &&
			currentAlbum.albumNameReverseSort !== Functions.getBooleanCookie("albumNameReverseSortRequested");
		return result;
	};

	Functions.needMediaNameSort = function() {
		var result =
			currentAlbum.media.length &&
			! currentAlbum.mediaNameSort &&
			Functions.getBooleanCookie("mediaNameSortRequested");
		return result;
	};

	Functions.needMediaDateSort = function() {
		var result =
			currentAlbum.media.length &&
			currentAlbum.mediaNameSort &&
			! Functions.getBooleanCookie("mediaNameSortRequested");
		return result;
	};

	Functions.needMediaDateReverseSort = function() {
		var result =
			currentAlbum.media.length &&
			! currentAlbum.mediaNameSort &&
			currentAlbum.mediaDateReverseSort !== Functions.getBooleanCookie("mediaDateReverseSortRequested");
		return result;
	};

	Functions.needMediaNameReverseSort = function() {
		var result =
			currentAlbum.media.length &&
			currentAlbum.mediaNameSort &&
			currentAlbum.mediaNameReverseSort !== Functions.getBooleanCookie("mediaNameReverseSortRequested");
		return result;
	};


	// this function is needed in order to let this point to the correct value in phFl.parseHash
	Functions.parseHash = function(hash, callback, error) {
		if (! util.isSearchHash(hash)) {
			// reset current album search flag to its default value
			Options.search_current_album = true;
			Functions.setBooleanCookie("search_current_album", Options.search_current_album);
			Functions.updateMenu();
		}

		if (Object.keys(Options).length > 0) {
			if (! util.isSearchHash(hash))
				// reset the return link from search
				Options.album_to_search_in = phFl.cleanHash(hash);
			//
			// if (! Options.hasOwnProperty('album_to_search_in') || ! Options.album_to_search_in)
			// 	Options.album_to_search_in = Options.folders_string;

			phFl.parseHash(hash, callback, error);
		} else {
			Functions.getOptions(hash, callback, error);
		}
		// phFl.parseHash(hash, callback, error);
	};

	Functions.getOptions = function(hash, callback, error) {
		var ajaxOptions = {
			type: "GET",
			dataType: "json",
			url: "cache/options.json",
			success: function(data) {
				// for map zoom levels, see http://wiki.openstreetmap.org/wiki/Zoom_levels

				for (var key in data)
					if (data.hasOwnProperty(key))
						Options[key] = data[key];
				util.translate();
				// server_cache_path actually is a constant: it cannot be passed as an option, because getOptions need to know it before reading the options
				// options.json is in this directory
				Options.server_cache_path = 'cache';

				maxSize = Options.reduced_sizes[Options.reduced_sizes.length - 1];

				// override according to user selections
				var titleCookie = Functions.getBooleanCookie("hide_title");
				if (titleCookie !== null)
					Options.hide_title = titleCookie;

				var bottomThumbnailsCookie = Functions.getBooleanCookie("hide_bottom_thumbnails");
				if (bottomThumbnailsCookie !== null)
					Options.hide_bottom_thumbnails = bottomThumbnailsCookie;

				var slideCookie = Functions.getBooleanCookie("albums_slide_style");
				if (slideCookie !== null)
					Options.albums_slide_style = slideCookie;

				if (Options.thumb_spacing)
					Options.spacingToggle = Options.thumb_spacing;
				else
					Options.spacingToggle = Options.media_thumb_size * 0.03;

				var spacingCookie = Functions.getNumberCookie("spacing");
				if (spacingCookie !== null) {
					Options.spacing = spacingCookie;
				} else {
					Options.spacing = Options.thumb_spacing;
				}

				var showAlbumNamesCookie = Functions.getBooleanCookie("show_album_names_below_thumbs");
				if (showAlbumNamesCookie !== null)
					Options.show_album_names_below_thumbs = showAlbumNamesCookie;

				var showMediaCountCookie = Functions.getBooleanCookie("show_album_media_count");
				if (showMediaCountCookie !== null)
					Options.show_album_media_count = showMediaCountCookie;

				var showMediaNamesCookie = Functions.getBooleanCookie("show_media_names_below_thumbs");
				if (showMediaNamesCookie !== null)
					Options.show_media_names_below_thumbs = showMediaNamesCookie;

				var squareAlbumsCookie = Functions.getCookie("album_thumb_type");
				if (squareAlbumsCookie !== null)
					Options.album_thumb_type = squareAlbumsCookie;

				var squareMediaCookie = Functions.getCookie("media_thumb_type");
				if (squareMediaCookie !== null)
					Options.media_thumb_type = squareMediaCookie;

				Options.search_inside_words = false;
				var searchInsideWordsCookie = Functions.getBooleanCookie("search_inside_words");
				if (searchInsideWordsCookie !== null)
					Options.search_inside_words = searchInsideWordsCookie;

				Options.search_any_word = false;
				var searchAnyWordCookie = Functions.getBooleanCookie("search_any_word");
				if (searchAnyWordCookie !== null)
					Options.search_any_word = searchAnyWordCookie;

				Options.search_case_sensitive = false;
				var searchCaseSensitiveCookie = Functions.getBooleanCookie("search_case_sensitive");
				if (searchCaseSensitiveCookie !== null)
					Options.search_case_sensitive = searchCaseSensitiveCookie;

				Options.search_accent_sensitive = false;
				var searchAccentSensitiveCookie = Functions.getBooleanCookie("search_accent_sensitive");
				if (searchAccentSensitiveCookie !== null)
					Options.search_accent_sensitive = searchAccentSensitiveCookie;

				Options.search_current_album = true;
				var searchCurrentAlbumCookie = Functions.getBooleanCookie("search_current_album");
				if (searchCurrentAlbumCookie !== null)
					Options.search_current_album = searchCurrentAlbumCookie;

				// Options.search_refine = false;
				// var searchRefineCookie = Functions.getBooleanCookie("search_refine");
				// if (searchRefineCookie !== null)
				// 	Options.search_refine = searchRefineCookie;

				if (! Options.hasOwnProperty('album_to_search_in') || ! Options.album_to_search_in)
					Options.album_to_search_in = Options.folders_string;
				if (! Options.hasOwnProperty('saved_album_to_search_in') || ! Options.saved_album_to_search_in)
					Options.saved_album_to_search_in = Options.folders_string;

				Options.foldersStringWithTrailingSeparator = Options.folders_string + Options.cache_folder_separator;
				Options.byDateStringWithTrailingSeparator = Options.by_date_string + Options.cache_folder_separator;
				Options.byGpsStringWithTrailingSeparator = Options.by_gps_string + Options.cache_folder_separator;
				Options.bySearchStringWithTrailingSeparator = Options.by_search_string + Options.cache_folder_separator;
				Options.byMapStringWithTrailingSeparator = Options.by_map_string + Options.cache_folder_separator;

				// phFl.parseHash(hash, callback, error);
				Functions.parseHash(hash, callback, error);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (errorThrown == "Not Found") {
					$("#album-view").fadeOut(200);
					$("#media-view").fadeOut(200);
					$("#album-view").stop().fadeIn(3500);
					$("#media-view").stop().fadeIn(3500);
					$("#error-options-file").stop().fadeIn(200);
					$("#error-options-file, #error-overlay, #auth-text").fadeOut(2500);
				}
			}
		};
		$.ajax(ajaxOptions);
	};

	Functions.prototype.showMetadataFromMouse = function(ev) {
		if (ev.which == 1 && ! ev.shiftKey && ! ev.ctrlKey && ! ev.altKey) {
			ev.stopPropagation();
			Functions.toggleMetadata();
			return false;
		}
	};

	Functions.focusSearchField = function() {
		if (! isMobile.any())
			$("#search-field").focus();
		else
			$("#search-field").blur();
	};

	Functions.prototype.toggleInsideWordsSearch = function(ev) {
		Options.search_inside_words = ! Options.search_inside_words;
		Functions.setBooleanCookie("search_inside_words", Options.search_inside_words);
		Functions.updateMenu();
		if ($("#search-field").val().trim())
			$('#search-button').click();
		Functions.focusSearchField();
	};

	Functions.prototype.toggleAnyWordSearch = function(ev) {
		Options.search_any_word = ! Options.search_any_word;
		Functions.setBooleanCookie("search_any_word", Options.search_any_word);
		Functions.updateMenu();
		if ($("#search-field").val().trim())
			$('#search-button').click();
		Functions.focusSearchField();
	};

	Functions.prototype.toggleCaseSensitiveSearch = function(ev) {
		Options.search_case_sensitive = ! Options.search_case_sensitive;
		Functions.setBooleanCookie("search_case_sensitive", Options.search_case_sensitive);
		Functions.updateMenu();
		if ($("#search-field").val().trim())
			$('#search-button').click();
		Functions.focusSearchField();

	};
	Functions.prototype.toggleAccentSensitiveSearch = function(ev) {
		Options.search_accent_sensitive = ! Options.search_accent_sensitive;
		Functions.setBooleanCookie("search_accent_sensitive", Options.search_accent_sensitive);
		Functions.updateMenu();
		if ($("#search-field").val().trim())
			$('#search-button').click();
		Functions.focusSearchField();
	};

	Functions.prototype.toggleCurrentAbumSearch = function(ev) {
		Options.search_current_album = ! Options.search_current_album;
		Functions.setBooleanCookie("search_current_album", Options.search_current_album);
		Functions.updateMenu();
		if ($("#search-field").val().trim())
			$('#search-button').click();
		Functions.focusSearchField();
	};

	Functions.toggleMetadata = function() {
		if ($(".media-box .metadata").css("display") == "none") {
			$(".media-box .metadata-show").hide();
			$(".media-box .metadata-hide").show();
			$(".media-box .metadata")
				.stop()
				.css("height", 0)
				.css("padding-top", 0)
				.css("padding-bottom", 0)
				.show()
				.stop()
				.animate({ height: $(".metadata > table").height(), paddingTop: 3, paddingBottom: 3 }, "slow", function() {
					$(this).css("height", "auto");
				});
		} else {
			$(".media-box .metadata-show").show();
			$(".media-box .metadata-hide").hide();
			$(".media-box .metadata")
				.stop()
				.animate({ height: 0, paddingTop: 0, paddingBottom: 0 }, "slow", function() {
					$(this).hide();
				});
		}
	};

	Functions.prototype.toggleMenu = function(ev) {
		$("ul#right-menu").toggleClass("expand");
		if ($("ul#right-menu").hasClass("expand"))
			Functions.focusSearchField();
		Functions.updateMenu();
	};

	Functions.prototype.parseHash = Functions.parseHash;
	Functions.prototype.getOptions = Functions.getOptions;
	Functions.prototype.getBooleanCookie = Functions.getBooleanCookie;
	Functions.prototype.setBooleanCookie = Functions.setBooleanCookie;
	Functions.prototype.updateMenu = Functions.updateMenu;
	Functions.prototype.focusSearchField = Functions.focusSearchField;
	Functions.prototype.toggleMetadata = Functions.toggleMetadata;

	window.Functions = Functions;
}());
