(function() {
	/* constructor */
	function Utilities() {
		$(document).ready(
			function() {
				var originalMediaBoxContainerHtml = $(".media-box#center")[0].outerHTML;
				if (originalMediaBoxContainerHtml.indexOf('<div class="title">') === -1) {
					var titleContent = $("#album-view").clone().children().first();
					Utilities.originalMediaBoxContainerContent = $(originalMediaBoxContainerHtml).prepend(titleContent)[0].outerHTML;
				} else {
					Utilities.originalMediaBoxContainerContent = originalMediaBoxContainerHtml;
				}
			}
		);
	}
  Utilities.prototype.cloneObject = function(object) {
    return Object.assign({}, object);
  };

  Utilities.prototype.intersect = function(a, b) {
		if (b.length > a.length) {
			// indexOf to loop over shorter
			var t;
			t = b;
			b = a;
			a = t;
		}
		var property = 'albumName';
		if (a.length && ! a[0].hasOwnProperty('albumName'))
			// searched albums hasn't albumName property
			property = 'path';

		return a.filter(function (e) {
			for (var i = 0; i < b.length; i ++) {
				if (this.normalizeAccordingToOptions(b[i][property]) == this.normalizeAccordingToOptions(e[property]))
					return true;
			}
			return false;
		});
	};

	Utilities.prototype.union = function(a, b) {
		var self = this;
		if (a === [])
			return b;
		if (b === [])
			return a;
		// begin cloning the first array
		var union = a.slice(0);

		var property = 'albumName';
		if (a.length && ! a[0].hasOwnProperty('albumName'))
			// searched albums hasn't albumName property
			property = 'path';

		for (var i = 0; i < b.length; i ++) {
			if (! a.some(
				function (e) {
					return self.normalizeAccordingToOptions(b[i][property]) == self.normalizeAccordingToOptions(e[property]);
				})
			)
				union.push(b[i]);
		}
		return union;
	};

  Utilities.prototype.normalizeAccordingToOptions = function(object) {
		var string = object;
		if (typeof object  === "object")
			string = string.join('|');

		if (! Options.search_case_sensitive)
			string = string.toLowerCase();
		if (! Options.search_accent_sensitive)
			string = this.removeAccents(string);

		if (typeof object === "object")
			object = string.split('|');
		else
			object = string;

		return object;
	};

	Utilities.prototype.removeAccents = function(string) {
		string = string.normalize('NFD');
		var stringArray = Array.from(string);
		var resultString = '';
		for (var i = 0; i < stringArray.length; i ++) {
			if (Options.unicode_combining_marks.indexOf(stringArray[i]) == -1)
				resultString += stringArray[i];
		}
		return resultString;
	};

  Utilities.pathJoin = function(pathArr) {
		var result = '';
		for (var i = 0; i < pathArr.length; ++i) {
			if (i < pathArr.length - 1 &&  pathArr[i] && pathArr[i][pathArr[i].length - 1] != "/")
				pathArr[i] += '/';
			if (i && pathArr[i] && pathArr[i][0] == "/")
				pathArr[i] = pathArr[i].slice(1);
			result += pathArr[i];
		}
		return result;
	};

  // see https://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
	Utilities.prototype.sortBy = function(albumOrMediaList, field) {
		return albumOrMediaList.sort(function(a,b) {
			var aValue = a[field];
			var bValue = b[field];
			return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
		});
	};

	 Utilities.prototype.sortByName = function(mediaList) {
		return this.sortBy(mediaList, 'name');
	};

	Utilities.prototype.sortByPath = function(albumList) {
		if (this.isByGpsCacheBase(albumList[0].cacheBase)) {
			if (albumList[0].hasOwnProperty('altName'))
				return this.sortBy(albumList, 'altName');
			else
				return this.sortBy(albumList, 'name');
		} else
			return this.sortBy(albumList, 'path');
	};

	Utilities.prototype.sortByDate = function (albumOrMediaList) {
		return albumOrMediaList.sort(function(a,b) {
			var aValue = new Date(a.date);
			var bValue = new Date(b.date);
			return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
		});
	};

  Utilities.prototype.trimExtension = function(name) {
		var index = name.lastIndexOf(".");
		if (index !== -1)
			return name.substring(0, index);
		return name;
	};

  Utilities.isFolderCacheBase = function(string) {
		return string == Options.folders_string || string.indexOf(Options.foldersStringWithTrailingSeparator) === 0;
	};

  Utilities.prototype.isByDateCacheBase = function(string) {
		return string == Options.by_date_string || string.indexOf(Options.byDateStringWithTrailingSeparator) === 0;
	};

	Utilities.prototype.isByGpsCacheBase = function(string) {
		return string == Options.by_gps_string || string.indexOf(Options.byGpsStringWithTrailingSeparator) === 0;
	};

	Utilities.prototype.isSearchCacheBase = function(string) {
		return string.indexOf(Options.bySearchStringWithTrailingSeparator) === 0;
	};

	Utilities.prototype.isSearchHash = function(hash) {
		hash = PhotoFloat.cleanHash(hash);
		var array = PhotoFloat.decodeHash(hash);
		// array is [albumHash, mediaHash, mediaFolderHash, savedSearchSubAlbumHash, savedSearchAlbumHash]
		if (this.isSearchCacheBase(hash) || array[4] !== null)
			return true;
		else
			return false;
	};

  Utilities.prototype.noResults = function(id) {
		// no media found or other search fail, show the message
		$("ul#right-menu").addClass("expand");
		$("#album-view").addClass("hidden");
		$("#media-view").addClass("hidden");
		if (typeof id === "undefined")
			id = 'no-results';
		$(".search-failed").hide();
		$("#" + id).stop().fadeIn(2000);
		$("#" + id).fadeOut(4000);
	};

	Utilities.prototype.stripHtmlAndReplaceEntities = function(htmlString) {
		// converto for for html page title
		// strip html (https://stackoverflow.com/questions/822452/strip-html-from-text-javascript#822464)
		// and replaces &raquo; with \u00bb
		return htmlString.replace(/<(?:.|\n)*?>/gm, '').replace(/&raquo;/g, '\u00bb');
	};

	Utilities.prototype.transformAltPlaceName = function(altPlaceName) {
		var underscoreIndex = altPlaceName.lastIndexOf('_');
		if (underscoreIndex != -1) {
			var number = altPlaceName.substring(underscoreIndex + 1);
			while (number.indexOf('0') === 0)
				number = number.substr(1);
			var base = altPlaceName.substring(0, underscoreIndex);
			return base + ' (' + _t('.subalbum') + number + ')';
		} else {
			return altPlaceName;
		}
	};

	Utilities.prototype.albumButtonWidth = function(thumbnailWidth, buttonBorder) {
			if (Options.albums_slide_style)
				return Math.round((thumbnailWidth + 2 * buttonBorder) * 1.1);
			else
				return thumbnailWidth + 2 * buttonBorder;
	};

	Utilities.prototype.removeFolderMarker = function (cacheBase) {
		if (this.isFolderCacheBase(cacheBase)) {
			cacheBase = cacheBase.substring(Options.folders_string.length);
			if (cacheBase.length > 0)
				cacheBase = cacheBase.substring(1);
		}
		return cacheBase;
	};

	Utilities.prototype.hasGpsData = function(media) {
		return media.mediaType == "photo" && typeof media.metadata.latitude !== "undefined";
	};

	Utilities.prototype.em2px = function(selector, em) {
		var emSize = parseFloat($(selector).css("font-size"));
		return (em * emSize);
	};

	Utilities.prototype.mapLink = function(latitude, longitude, zoom) {
		var link;
		if (Options.map_service == 'openstreetmap') {
			link = 'http://www.openstreetmap.org/#map=' + zoom + '/' + latitude + '/' + longitude;
		}
		else if (Options.map_service == 'googlemaps') {
			link = 'https://www.google.com/maps/@' + latitude + ',' + longitude + ',' + zoom + 'z';
		}
		else if (Options.map_service == 'osmtools') {
			link = 'http://m.osmtools.de/index.php?mlon=' + longitude + '&mlat=' + latitude + '&icon=6&zoom=' + zoom;
		}
		return link;
	};

	Utilities.prototype.isAlbumWithOneMedia = function(currentAlbum) {
		return currentAlbum !== null && ! currentAlbum.subalbums.length && currentAlbum.media.length == 1;
	};

	Utilities.chooseReducedPhoto = function(media, container, fullScreenStatus) {
		var chosenMedia, reducedWidth, reducedHeight;
		var mediaWidth = media.metadata.size[0], mediaHeight = media.metadata.size[1];
		var mediaSize = Math.max(mediaWidth, mediaHeight);
		var mediaRatio = mediaWidth / mediaHeight, containerRatio;

		chosenMedia = this.originalMediaPath(media);
		maxSize = 0;

		if (container === null) {
			// try with what is more probable to be the container
			if (fullScreenStatus)
				container = $(window);
			else {
				container = $(".media-box#center .media-box-inner");
			}
		}

		containerWidth = container.width();
		containerHeight = container.height();
		containerRatio = container.width() / container.height();

		if (
			mediaRatio >= containerRatio && mediaWidth <= containerWidth * devicePixelRatio ||
			mediaRatio < containerRatio && mediaHeight <= containerHeight * devicePixelRatio
		) {
			// the original media is smaller than the container, use it
		} else {
			for (var i = 0; i < Options.reduced_sizes.length; i++) {
				if (Options.reduced_sizes[i] < mediaSize) {
					if (mediaWidth > mediaHeight) {
						reducedWidth = Options.reduced_sizes[i];
						reducedHeight = Options.reduced_sizes[i] * mediaHeight / mediaWidth;
					} else {
						reducedHeight = Options.reduced_sizes[i];
						reducedWidth = Options.reduced_sizes[i] * mediaWidth / mediaHeight;
					}

					if (
						mediaRatio > containerRatio && reducedWidth < containerWidth * devicePixelRatio ||
						mediaRatio < containerRatio && reducedHeight < containerHeight * devicePixelRatio
					)
						break;
				}
				chosenMedia = this.mediaPath(currentAlbum, media, Options.reduced_sizes[i]);
				maxSize = Options.reduced_sizes[i];
			}
		}
		return chosenMedia;
	};

	Utilities.prototype.chooseMediaReduction = function(media, id, fullScreenStatus) {
		// chooses the proper reduction to use depending on the container size
		var container, mediaSrc;

		if (media.mediaType == "video") {
			if (fullScreenStatus && media.albumName.match(/\.avi$/) === null) {
				// .avi videos are not played by browsers
				mediaSrc = media.albumName;
			} else {
				mediaSrc = this.mediaPath(currentAlbum, media, "");
			}
		} else if (media.mediaType == "photo") {
			if (fullScreenStatus && Modernizr.fullscreen)
				container = $(window);
			else
				container = $(".media-box#" + id + " .media-box-inner");

			mediaSrc = Utilities.chooseReducedPhoto(media, container, fullScreenStatus);
		}

		return mediaSrc;
	};

	Utilities.currentSize = function() {
		// returns the pixel size of the photo in DOM
		// returns 0 if it's the original image

		var result;
		var currentReduction = $(".media-box#center .media-box-inner img").attr("src");

		// default: it's the original image
		result = 0;

		// check if it's a reduction
		for (var i = 0; i < Options.reduced_sizes.length; i ++) {
			if (currentReduction === Utilities.mediaPath(currentAlbum, currentMedia, Options.reduced_sizes[i])) {
				result = Options.reduced_sizes[i];
				break;
			}
		}
		return result;
	};

	Utilities.nextSize = function() {
		// returns the next bigger size of photo in DOM
		// returns 0 if the image in the DOM is the biggest available reduction
		// returns false if in the DOM there is the original image

		var currentPhotoSize = Utilities.currentSize();

		if (currentPhotoSize === 0)
			// default: it's already the original image
			var result = false;
		else if (currentPhotoSize === Options.reduced_sizes[0])
			result = 0;
		else {
			for (var i = 1; i < Options.reduced_sizes.length; i ++) {
				if (currentPhotoSize === Options.reduced_sizes[i]) {
					result = Options.reduced_sizes[i - 1];
					break;
				}
			}
		}

		// return the original image size if the reduction size is bigger than image size
		if (result > Math.max(currentMedia.metadata.size[0], currentMedia.metadata.size[1]))
			result = 0;

		return result;
	};

	Utilities.prototype.nextSizeReduction = function() {
		// returns the file name of the reduction with the next bigger size than the reduction in DOM

		var nextPhotoSize = Utilities.nextSize();

		if (nextPhotoSize === false)
			// it's already the original image
			result = false;
		else if (nextPhotoSize === 0)
			result = currentMedia.albumName;
		else
			result = Utilities.mediaPath(currentAlbum, currentMedia, nextPhotoSize);

		return result;
	};

	Utilities.prototype.createMediaHtml = function(media, id, fullScreenStatus) {
		// creates a media element that can be inserted in DOM (e.g. with append/prepend methods)

		// the actual sizes of the image
		var mediaWidth = media.metadata.size[0], mediaHeight = media.metadata.size[1];
		var mediaSrc, mediaElement, container;
		var attrWidth = mediaWidth, attrHeight = mediaHeight;

		if (media.mediaType == "video") {
			if (fullScreenStatus && media.albumName.match(/\.avi$/) === null) {
				// .avi videos are not played by browsers
				mediaSrc = media.albumName;
			} else {
				mediaSrc = this.mediaPath(currentAlbum, media, "");
			}

			mediaElement = $('<video/>', {controls: true });
		} else if (media.mediaType == "photo") {
			if (fullScreenStatus && Modernizr.fullscreen)
				container = $(window);
			else
				container = $(".media-box#" + id + " .media-box-inner");

			mediaSrc = Utilities.chooseReducedPhoto(media, container, fullScreenStatus);

			if (maxSize) {
				// correct phisical width and height according to reduction sizes
				if (mediaWidth > mediaHeight) {
					attrWidth = maxSize;
					attrHeight = Math.round(mediaHeight / mediaWidth * maxSize);
				} else {
					attrHeight = maxSize;
					attrWidth = Math.round(mediaWidth / mediaHeight * maxSize);
				}
			}

			mediaElement = $('<img/>')
				.attr("title", media.date);
		}

		mediaElement
			.attr("width", attrWidth)
			.attr("height", attrHeight)
			.attr("ratio", mediaWidth / mediaHeight)
			.attr("src", encodeURI(mediaSrc))
			.attr("alt", media.name);

		return mediaElement[0].outerHTML;
	};

	Utilities.prototype.createMediaLinkTag = function(media, mediaSrc) {
		// creates a link tag to be inserted in <head>

		if (media.mediaType == "video") {
			return '<link rel="video_src" href="' + encodeURI(mediaSrc) + '" />';
		} else if (media.mediaType == "photo") {
			return '<link rel="image_src" href="' + encodeURI(mediaSrc) + '" />';
		}
	};

	Utilities.prototype.chooseTriggerEvent = function(media) {
		// choose the event that must trigger the scaleMedia function

		if (media.mediaType == "video") {
			return "loadstart";
		} else if (media.mediaType == "photo") {
			return "load";
		}
	};

	Utilities.originalMediaPath = function(media) {
		return media.albumName;
	};

	Utilities.mediaPath = function(album, media, size) {
		var suffix = Options.cache_folder_separator, hash, rootString = "root-";
		if (
			media.mediaType == "photo" ||
			media.mediaType == "video" && [Options.album_thumb_size, Options.media_thumb_size].indexOf(size) != -1
		) {
			var actualSize = size;
			var albumThumbSize = Options.album_thumb_size;
			var mediaThumbSize = Options.media_thumb_size;
			if ((size == albumThumbSize || size == mediaThumbSize) && devicePixelRatio > 1) {
				actualSize = Math.round(actualSize * Options.mobile_thumbnail_factor);
				albumThumbSize = Math.round(albumThumbSize * Options.mobile_thumbnail_factor);
				mediaThumbSize = Math.round(mediaThumbSize * Options.mobile_thumbnail_factor);
			}
			suffix += actualSize.toString();
			if (size == Options.album_thumb_size) {
				suffix += "a";
				if (Options.album_thumb_type == "square")
					suffix += "s";
				else if (Options.album_thumb_type == "fit")
					suffix += "f";
			}
			else if (size == Options.media_thumb_size) {
				suffix += "t";
				if (Options.media_thumb_type == "square")
					suffix += "s";
				else if (Options.media_thumb_type == "fixed_height")
					suffix += "f";
			}
			suffix += ".jpg";
		} else if (media.mediaType == "video") {
			suffix += "transcoded_" + Options.video_transcode_bitrate + "_" + Options.video_crf + ".mp4";
		}

		hash = media.foldersCacheBase + Options.cache_folder_separator + media.cacheBase + suffix;
		if (hash.indexOf(rootString) === 0)
			hash = hash.substring(rootString.length);
		else {
			if (this.isFolderCacheBase(hash))
				hash = hash.substring(Options.foldersStringWithTrailingSeparator.length);
			else if (this.isByDateCacheBase(hash))
				hash = hash.substring(Options.byDateStringWithTrailingSeparator.length);
			else if (this.isByGpsCacheBase(hash))
				hash = hash.substring(Options.byGpsStringWithTrailingSeparator.length);
			else if (this.isSearchCacheBase(hash))
				hash = hash.substring(Options.bySearchStringWithTrailingSeparator.length);
		}
		if (media.cacheSubdir)
			return this.pathJoin([Options.server_cache_path, media.cacheSubdir, hash]);
		else
			return this.pathJoin([Options.server_cache_path, hash]);
	};

	Utilities.prototype.scaleMedia = function(event) {
		// this function works on the img tag identified by event.data.id
		// it adjusts width, height and position so that it fits in its parent (<div class="bedia-box-inner">, or the whole window)
		// and centers vertically
		var media = event.data.media, mediaElement, container, containerRatio, photoSrc, previousSrc;
		var containerTop = 0, containerBottom = 0, cssWidth, cssHeight;
		var containerHeight = $(window).innerHeight(), containerWidth = $(window).innerWidth();
		var mediaBarBottom = 0;
		var mediaWidth, mediaHeight, attrWidth, attrHeight, ratio;
		var id = event.data.id;
		var albumViewHeight, heightForMedia, heightForMediaAndTitle, titleHeight;

		windowWidth = $(window).innerWidth();
		windowHeight = $(window).innerHeight();
		if ($("#album-view").is(":visible"))
			albumViewHeight = $("#album-view").outerHeight();
		else
			albumViewHeight = 0;
		heightForMediaAndTitle = windowHeight - albumViewHeight;

		if (albumViewHeight)
			// slightly separate media from bottom thumbnails
			heightForMediaAndTitle -= 5;

		// if (Utilities.bottomSocialButtons() && containerBottom < $(".ssk").outerHeight())
		// 	// correct container bottom when social buttons are on the bottom
		// 	heightForMediaAndTitle -= $(".ssk").outerHeight();

		// widths must be set before calculating title height
		if (event.data.resize && id === "center") {
			// this is executed only when resizing, it's not needed when first scaling
			$("#media-box-container").css("width", windowWidth * 3).css("transform", "translate(-" + windowWidth + "px, 0px)");
			$(".media-box").css("width", windowWidth);
			$(".media-box .media-box-inner").css("width", windowWidth);
			$(".media-box").show();
		}
		if ($(".media-box#" + id + " .title").is(":visible"))
			titleHeight = $(".media-box#" + id + " .title").outerHeight();
		else
			titleHeight = 0;

		heightForMedia = heightForMediaAndTitle - titleHeight;
		$("#media-box-container").css("height", heightForMediaAndTitle);
		$(".media-box").css("height", heightForMediaAndTitle);
		$(".media-box .media-box-inner").css("height", heightForMedia);
		$(".media-box").show();

		mediaElement = $(".media-box#" + id + " .media-box-inner img");

		mediaWidth = media.metadata.size[0];
		mediaHeight = media.metadata.size[1];
		attrWidth = mediaWidth;
		attrHeight = mediaHeight;
		ratio = mediaWidth / mediaHeight;

		if (fullScreenStatus && Modernizr.fullscreen)
			container = $(window);
		else {
			container = $(".media-box#" + id + " .media-box-inner");
		}

		containerHeight = heightForMedia;
		containerRatio = containerWidth / containerHeight;

		if (media.mediaType == "photo") {
			previousSrc = mediaElement.attr("src");
			photoSrc = Utilities.chooseReducedPhoto(media, container, fullScreenStatus);

			if (encodeURI(photoSrc) != previousSrc) {
				// resizing had the effect that a different reduction has been choosed

				// chooseReducedPhoto() sets maxSize to 0 if it returns the original media
				if (maxSize) {
					if (mediaWidth > mediaHeight) {
						attrWidth = maxSize;
						attrHeight = Math.round(mediaHeight / mediaWidth * attrWidth);
					} else {
						attrHeight = maxSize;
						attrWidth = Math.round(mediaWidth / mediaHeight * attrHeight);
					}
				}

				$("link[rel=image_src]").remove();
				$('link[rel="video_src"]').remove();
				$("head").append("<link rel=\"image_src\" href=\"" + encodeURI(photoSrc) + "\" />");
				mediaElement
					.attr("src", encodeURI(photoSrc))
					.attr("width", attrWidth)
					.attr("height", attrHeight);
			}
		}

		if (Utilities.bottomSocialButtons()) {
			mediaBarBottom = $(".ssk").outerHeight();
		}
		$(".media-box#" + id + " .media-bar").css("bottom", mediaBarBottom);

		mediaElement.show();
		// $("#media-view").removeClass("hidden");

		if (id === "center") {
			$("#prev").css("left", "");
			if (! fullScreenStatus && currentAlbum.media.length > 1 && Utilities.lateralSocialButtons()) {
				// correct back arrow position when social buttons are on the left
				$("#prev").css("left", (parseInt($("#prev").css("left")) + $(".ssk").outerWidth()) + "px");
			}

			// position next/prev buttons verticallly centered in media-box-inner
			var mediaBoxInnerHeight = parseInt($(".media-box#center .media-box-inner").css("height"));
			titleHeight = parseInt($(".media-box#center .title").css("height"));
			var prevNextHeight = parseInt($("#next").outerHeight());
			$("#next, #prev").css(
				"top",
				titleHeight + (mediaBoxInnerHeight - prevNextHeight) / 2
			);
			// position lateral social buttons verticallly centered in media-box-inner
			if (Utilities.lateralSocialButtons()) {
				var socialHeight = parseInt($(".ssk-left").outerHeight());
				$(".ssk-left").css(
					"top",
					titleHeight + (mediaBoxInnerHeight - socialHeight) / 2 + socialHeight / 2
				);
			} else {
				$(".ssk-left").css("top", "");
			}

			Utilities.setLinksVisibility();
		}

		if (event.data.callback) {
			if (event.data.callback.name !== "pinchSwipeInitialization" || id === "center")
				event.data.callback();
		}
	};

	Utilities.isColliding = function(div1, div2) {
		// from https://gist.github.com/jtsternberg/c272d7de5b967cec2d3d
		// Div 1 data
		var d1_offset             = div1.offset();
		var d1_height             = div1.outerHeight(true);
		var d1_width              = div1.outerWidth(true);
		var d1_distance_from_top  = d1_offset.top + d1_height;
		var d1_distance_from_left = d1_offset.left + d1_width;

		// Div 2 data
		var d2_offset             = div2.offset();
		var d2_height             = div2.outerHeight(true);
		var d2_width              = div2.outerWidth(true);
		var d2_distance_from_top  = d2_offset.top + d2_height;
		var d2_distance_from_left = d2_offset.left + d2_width;

		var not_colliding = ( d1_distance_from_top < d2_offset.top || d1_offset.top > d2_distance_from_top || d1_distance_from_left < d2_offset.left || d1_offset.left > d2_distance_from_left );

		// Return whether it IS colliding
		return ! not_colliding;
	};


	Utilities.lateralSocialButtons = function() {
		return $(".ssk-group").css("display") == "block";
	};

	Utilities.bottomSocialButtons = function() {
		return ! Utilities.lateralSocialButtons();
	};

	Utilities.setLinksVisibility = function() {
		if (isMobile.any()) {
			$(".media-box .links").css("display", "inline").css("opacity", 0.5);
		} else {
			$("#media-view").off();
			$("#media-view").on('mouseenter', function() {
				$(".media-box .links").stop().fadeTo("slow", 0.50).css("display", "inline");
			});
			$("#media-view").on('mouseleave', function() {
				$(".media-box .links").stop().fadeOut("slow");
			});
		}
	};

	Utilities.prototype.setNextPrevVisibility = function() {
		if (isMobile.any()) {
			$("#next, #prev").css("display", "inline").css("opacity", 1);
		} else {
			$("#next, #prev").off('mouseenter mouseleave');
			$("#next, #prev").on('mouseenter', function() {
				$(this).stop().fadeTo("fast", 1);
			});

			$("#next, #prev").on('mouseleave', function() {
				$(this).stop().fadeTo("fast", 0.4);
			});
		}
	};

	Utilities.mediaBoxGenerator = function(id) {
		if (id === 'left')
			$("#media-box-container").prepend(Utilities.originalMediaBoxContainerContent.replace('id="center"', 'id="left"'));
		else if (id === 'right')
			$("#media-box-container").append(Utilities.originalMediaBoxContainerContent.replace('id="center"', 'id="right"'));
	};

	/* make static methods callable as member functions */
	Utilities.prototype.chooseReducedPhoto = Utilities.chooseReducedPhoto;
	Utilities.prototype.originalMediaPath = Utilities.originalMediaPath;
	Utilities.prototype.mediaPath = Utilities.mediaPath;
	Utilities.prototype.isFolderCacheBase = Utilities.isFolderCacheBase;
	Utilities.prototype.pathJoin = Utilities.pathJoin;
	Utilities.prototype.setLinksVisibility = Utilities.setLinksVisibility;
	Utilities.prototype.mediaBoxGenerator = Utilities.mediaBoxGenerator;
	Utilities.prototype.originalMediaBoxContainerContent = Utilities.originalMediaBoxContainerContent;
	Utilities.prototype.currentSize = Utilities.currentSize;
	Utilities.prototype.nextSize = Utilities.nextSize;

  window.Utilities = Utilities;
}());
