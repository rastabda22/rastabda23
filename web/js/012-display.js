var windowWidth = $(window).width();
var windowHeight = $(window).height();
var windowOrientation;
if (windowWidth > windowHeight)
	windowOrientation = "landscape";
else
	windowOrientation = "portrait";
windowMaxSize = Math.max(windowWidth, windowHeight);
windowMinSize = Math.min(windowWidth, windowHeight);


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
	
	currentAlbum = null;
	currentMedia = null;
	var currentMediaIndex = -1;
	var previousAlbum = null;
	var previousMedia = null;
	var originalTitle = document.title;
	var photoFloat = new PhotoFloat();
	var maxSizeSet = false;
	Options = {};
	
	/* Displays */
	
	function language() {
		if (Options['language'])
			return Options['language'];
		else {
			var userLang = navigator.language || navigator.userLanguage;
			return userLang.split('-')[0];
		}
	}
	
	function translate() {
		
		if($('.translation-' + language()).length) {
			$('.translation').removeClass('translation-active');
			$('.translation-' + language()).addClass('translation-active');
		} else {
			$('.translation-en').addClass('translation-active');
		}
	}
	
	function translationsToTranslatedString(translations) {
		translationsLines = translations.split("\n");
		for (var i in translationsLines) {
			if (translationsLines[i].indexOf("translation-active") != -1)
				return translationsLines[i].replace(/<\/?[^>]+(>|$)/g, "").trim();
		}
	}


	function setTitle() {
		var title = "", documentTitle = "", last = "", components, i;
		//~ var originalTitle = translationsToTranslatedString($("#title-translation").html());
		var originalTitle = Options['page_title'];
		translate();
		
		if (! currentAlbum.path.length)
			components = [originalTitle];
		else {
			components = currentAlbum.path.split("/");
			components.unshift(originalTitle);
		}
		for (i = 0; i < components.length; ++i) {
			if (i)
				last += "/" + components[i];
			if (i != 1 || components[i] != Options['folders_string']) {
				if (i < components.length - 1 || currentMedia !== null)
					if (! (i == 0 && components.length > 1 && components[i + 1] == Options['by_date_string']))
						if (i == 1 && components[i] == Options['by_date_string'])
							title = "<a class='title-anchor' href=\"#!/" + (i ? photoFloat.cachePath(last.substring(1)) : "") + "\">" + title;
						else
							title += "<a class='title-anchor' href=\"#!/" + (i ? photoFloat.cachePath(last.substring(1)) : "") + "\">";
				if (i == 1 && components[i] == Options['by_date_string'])
					title += translationsToTranslatedString($("#by-date-translation").html());
				else
					title += components[i];
				if (i < components.length - 1 || currentMedia !== null)
					if (! (i == 0 && components.length > 1 && components[i + 1] == Options['by_date_string']))
						title += "</a>";
			}
			if (i == 0 && components.length > 1 && components[i + 1] == Options['by_date_string'])
				title += " ";
			else if ((i < components.length - 1 || currentMedia !== null) &&
				(i == components.length - 1 || components[i + 1] != Options['folders_string']))
				title += " &raquo; ";
		}
		if (currentMedia !== null)
			title += "<span id=\"photo-name\">" + photoFloat.trimExtension(currentMedia.name) + "</span>";
		
		for (i = 0; i < components.length; ++i) {
			if (i == 0) {
				documentTitle += components[0]
				if (components.length > 2 || currentMedia !== null)
					documentTitle = " \u00ab " + documentTitle;
			}
			else if (i == 1 && components[1] == Options['by_date_string']) {
				documentTitle += " " + translationsToTranslatedString($("#by-date-translation").html());
			}
			else if (i > 1) {
				documentTitle = components[i] + documentTitle;
				if (i < components.length - 1 || currentMedia !== null)
					documentTitle = " \u00ab " + documentTitle;
			}
		}
		if (currentMedia !== null)
			documentTitle = photoFloat.trimExtension(currentMedia.name) + documentTitle;
		
		$("#title").html(title);
		document.title = documentTitle;
	}

	function scrollToThumb() {
		var photo, thumb;
		photo = currentMedia;
		if (photo === null) {
			photo = previousMedia;
			if (photo === null)
				return;
		}
		$("#thumbs img").each(function() {
			if (this.title === photo.name) {
				thumb = $(this);
				return false;
			}
		});
		if (typeof thumb === "undefined")
			return;
		if (currentMedia !== null) {
			var scroller = $("#album-view");
			scroller.stop().animate({ scrollLeft: thumb.parent().position().left + scroller.scrollLeft() - scroller.width() / 2 + thumb.width() / 2 }, "slow");
		} else
			$("html, body").stop().animate({ scrollTop: thumb.offset().top - $(window).height() / 2 + thumb.height() }, "slow");
		
		if (currentMedia !== null) {
			$("#thumbs img").removeClass("current-thumb");
			thumb.addClass("current-thumb");
		}
	}
	function showAlbum(populate) {
		var i, link, image, photos, thumbsElement, subalbums, subalbumsElement, hash, thumbHash;
		if (currentMedia === null && previousMedia === null)
			$("html, body").stop().animate({ scrollTop: 0 }, "slow");
		if (populate) {
			thumbnail_size = Options['thumb_sizes'][0];
			photos = [];
			for (i = 0; i < currentAlbum.photos.length; ++i) {
				hash = photoFloat.photoHash(currentAlbum, currentAlbum.photos[i]);
				thumbHash = photoFloat.photoPath(currentAlbum, currentAlbum.photos[i], thumbnail_size, true);
				bydateStringWithTrailingSeparator = Options['by_date_string'] + Options['cache_folder_separator'];
				if (thumbHash.indexOf(bydateStringWithTrailingSeparator) === 0) {
					thumbHash =
						PhotoFloat.cachePath(currentAlbum.photos[i].completeName.substring(0, currentAlbum.photos[i].completeName.length - currentAlbum.photos[i].name.length - 1)) +
						"/" +
						PhotoFloat.cachePath(currentAlbum.photos[i].name);
				}
				link = $("<a href=\"#!/" + hash + "\"></a>");
				image = $("<div class=\"thumb-container\">" +
							"<img title=\"" + currentAlbum.photos[i].name +
							"\" alt=\"" + photoFloat.trimExtension(currentAlbum.photos[i].name) +
							"\" src=\"" + thumbHash +
							"\" height=\"" + thumbnail_size +
							"\" width=\"" + thumbnail_size +
							"\" />" +
							"<div class=\"thumb-caption-media\">" +
							currentAlbum.photos[i].name.replace(/ /g, "</span> <span style=\"white-space: nowrap;\">") +
							"</div>" +
							"</div>");

				image.get(0).photo = currentAlbum.photos[i];
				link.append(image);
				photos.push(link);
				(function(theLink, theImage, theAlbum) {
					theImage.error(function() {
						photos.splice(photos.indexOf(theLink), 1);
						theLink.remove();
						theAlbum.photos.splice(theAlbum.photos.indexOf(theImage.get(0).photo), 1);
					});
				})(link, image, currentAlbum);
			}
			thumbsElement = $("#thumbs");
			thumbsElement.empty();
			thumbsElement.append.apply(thumbsElement, photos);
			
			if (currentMedia === null) {
				subalbums = [];
				for (i = 0; i < currentAlbum.albums.length; ++i) {
					link = $("<a href=\"#!/" + photoFloat.albumHash(currentAlbum.albums[i]) + "\"></a>");
					var imageTextAdd = currentAlbum.albums[i].path;
					imageTextAdd = imageTextAdd.replace(Options['by_date_string'], $("#by-date-translation").html());
					imageTextAdd = imageTextAdd.replace(Options['folders_string'], $("#folders-translation").html());
					image = $("<div title=\"" + currentAlbum.albums[i].date + "\" class=\"album-button\">" +
								"<span class='thumb-caption-album'>" +
								imageTextAdd +
								"</span>" +
								"</div>");
					link.append(image);
					subalbums.push(link);
					(function(theContainer, theAlbum, theImage, theLink) {
						photoFloat.albumPhoto(theAlbum, function(album, photo) {
							thumbnail_size = Options['thumb_sizes'][0];
							theImage.css("background-image", "url(" + photoFloat.photoPath(album, photo, thumbnail_size, true) + ")");
						}, function error() {
							theContainer.albums.splice(currentAlbum.albums.indexOf(theAlbum), 1);
							theLink.remove();
							subalbums.splice(subalbums.indexOf(theLink), 1);

						});
					})(currentAlbum, currentAlbum.albums[i], image, link);
				}
				subalbumsElement = $("#subalbums");
				subalbumsElement.empty();
				subalbumsElement.append.apply(subalbumsElement, subalbums);
				subalbumsElement.insertBefore(thumbsElement);
			}
		}
		
		if (currentMedia === null) {
			$("#thumbs img").removeClass("current-thumb");
			$("#album-view").removeClass("photo-view-container");
			$("#subalbums").show();
			$("#photo-view").hide();
			$("#video-box-inner").empty();
			$("#video-box").hide();
			$("#thumbs").show();
		} else {
			if (currentAlbum.photos.length == 1)
				$("#thumbs").hide();
			else
				$("#thumbs").show();
		}
		
		if (currentAlbum.path == Options['folders_string']) {
			$("#folders-view-container").hide();
			$("#day-view-container").show();
			$("#day-view").attr("href", "#!/" + Options['by_date_string']);
		}
		else if (currentAlbum.path == Options['by_date_string']) {
			$("#folders-view-container").show();
			$("#day-view-container").hide();
			$("#folders-view").attr("href", "#!/" + Options['folders_string']);
		}
		
		setTimeout(scrollToThumb, 1);
	}
	function getDecimal(fraction) {
		if (fraction[0] < fraction[1])
			return fraction[0] + "/" + fraction[1];
		return (fraction[0] / fraction[1]).toString();
	}
	function scaleImageFullscreen() {
		var image;
		image = $("#photo");
		if (image.get(0) === this) {
			$(window).unbind("resize", scaleImageNormal);
			$(window).bind("resize", scaleImageFullscreen);
		}
		scaleImage($(window), image);
	}
	function scaleImageNormal() {
		var image;
		image = $("#photo");
		if (image.get(0) === this) {
			$(window).unbind("resize", scaleImageFullscreen);
			$(window).bind("resize", scaleImageNormal);
		}
		scaleImage($("#photo-view"), image);
	}
	function scaleImage(container, image) {
		if (image.css("width") !== "100%" && container.height() * image.attr("ratio") > container.width())
			image.css("width", "100%").css("height", "auto").css("position", "absolute").css("bottom", 0);
		else if (image.css("height") !== "100%")
			image.css("height", "100%").css("width", "auto").css("position", "").css("bottom", "");
		$("#title").width($(window).width() - $("#buttons-container").width() - em2px("#photo-name", 2) - 2 * parseInt($("#title").css("padding")));
	}
	function scaleVideo() {
		var video, container;
		video = $("#video");
		if (video.get(0) === this)
			$(window).bind("resize", scaleVideo);
		container = $("#photo-view");
		if (video.attr("width") > container.width() && container.height() * video.attr("ratio") > container.width())
			video.css("width", container.width()).css("height", container.width() / video.attr("ratio")).parent().css("height", container.width() / video.attr("ratio")).css("margin-top", - container.width() / video.attr("ratio") / 2).css("top", "50%");
		else if (video.attr("height") > container.height() && container.height() * video.attr("ratio") < container.width())
			video.css("height", container.height()).css("width", container.height() * video.attr("ratio")).parent().css("height", "100%").css("margin-top", "0").css("top", "0");
		else
			video.css("height", "").css("width", "").parent().css("height", video.attr("height")).css("margin-top", - video.attr("height") / 2).css("top", "50%");
	}
	function showMedia(album, fullscreen = false) {
		var width, height, photoSrc, videoSrc, previousMedia, nextMedia, nextLink, text, mediaOrientation;
		width = currentMedia.size[0];
		height = currentMedia.size[1];
		if (width > height)
			mediaOrientation = "landscape";
		else
			mediaOrientation = "portrait";
			
		mediaMaxSize = Math.max(width, height);
		mediaMinSize = Math.min(width, height);
		imageRatio = mediaMaxSize / mediaMinSize;
		
		if (fullscreen) {
			maxSize = Options['reduced_sizes'][0];
			maxSizeSet = true;
		}
		if (! maxSizeSet) {
			maxSize = Options['reduced_sizes'][0];
			for (var i = 0; i < Options['reduced_sizes'].length; i++) {
				thumbnailMinSize = Options['reduced_sizes'][i] / imageRatio;
				thumbnailMaxSize = Options['reduced_sizes'][i];
				if (mediaOrientation == windowOrientation &&
						(thumbnailMinSize < windowMinSize && thumbnailMaxSize < windowMaxSize) ||
					mediaOrientation !== windowOrientation &&
						(thumbnailMinSize < windowMaxSize && thumbnailMaxSize < windowMinSize))
					break;
				maxSize = Options['reduced_sizes'][i];
				maxSizeSet = true;
			}
		}
		
		if (currentMedia.mediaType == "video") {
			$("#video-box-inner").empty();
			if (! Modernizr.video) {
				$('<div id="video-unsupported"><p>Sorry, your browser doesn\'t support the HTML5 &lt;video&gt; element!</p><p>Here\'s a <a href="http://caniuse.com/video">list of which browsers do</a>.</p></div>').appendTo('#video-box-inner');
			}
			else if (! Modernizr.video.h264) {
				$('<div id="video-unsupported"><p>Sorry, your browser doesn\'t support the H.264 video format!</p></div>').appendTo('#video-box-inner');
			} else {
				$(window).unbind("resize", scaleVideo);
				$(window).unbind("resize", scaleImageNormal);
				$(window).unbind("resize", scaleImageFullscreen);
				videoSrc = photoFloat.videoPath(currentAlbum, currentMedia);
				$('<video/>', { id: 'video', controls: true }).appendTo('#video-box-inner')
					.attr("width", width).attr("height", height).attr("ratio", currentMedia.size[0] / currentMedia.size[1])
					.attr("src", videoSrc)
					.attr("alt", currentMedia.name)
					.on('loadstart', scaleVideo);
			}
			$("head").append("<link rel=\"video_src\" href=\"" + videoSrc + "\" />");
			$("#video-box-inner").css('height', height + 'px').css('margin-top', - height / 2);
			$("#photo-box").hide();
			$("#video-box").show();
		} else {
			if (width > height) {
				height = height / width * maxSize;
				width = maxSize;
			} else {
				width = width / height * maxSize;
				height = maxSize;
			}
			$(window).unbind("resize", scaleVideo);
			$(window).unbind("resize", scaleImageNormal);
			photoSrc = photoFloat.photoPath(currentAlbum, currentMedia, maxSize, false);
			$("#photo")
				.attr("width", width).attr("height", height).attr("ratio", currentMedia.size[0] / currentMedia.size[1])
				.attr("src", photoSrc)
				.attr("alt", currentMedia.name)
				.attr("title", currentMedia.date);
			if (fullscreen)
				$("#photo").load(scaleImageFullscreen)
			else
				$("#photo").load(scaleImageNormal)
			$("head").append("<link rel=\"image_src\" href=\"" + photoSrc + "\" />");
			$("#video-box-inner").empty();
			$("#video-box").hide();
			$("#photo-box").show();
			$("#metadata").hide();
			$("#metadata-show").show();
			$("#metadata-hide").hide();
		}
		if (currentAlbum.photos.length > 1) {
			var i = currentMediaIndex;
			do {
				i == 0 ? i = currentAlbum.photos.length - 1: i --;
				previousMedia = currentAlbum.photos[i];
			} while (previousMedia.byDateName == currentAlbum.photos[currentMediaIndex].byDateName);
			i = currentMediaIndex;
			do {
				i == currentAlbum.photos.length - 1 ? i = 0 : i ++
				nextMedia = currentAlbum.photos[i];
			} while (nextMedia.byDateName == currentAlbum.photos[currentMediaIndex].byDateName);
			if (nextMedia.mediaType == "video") {
				$.preloadImages(photoFloat.videoPath(currentAlbum, nextMedia));
			} else {
				$.preloadImages(photoFloat.photoPath(currentAlbum, nextMedia, maxSize, false))
			}
			if (previousMedia.mediaType == "video") {
				$.preloadImages(photoFloat.videoPath(currentAlbum, previousMedia));
			} else {
				$.preloadImages(photoFloat.photoPath(currentAlbum, previousMedia, maxSize, false));
			}
		}
		if (currentAlbum.path == photoFloat.photoFoldersAlbum(currentMedia)) {
			$("#folders-view-container").hide();
			$("#day-view-container").show();
		}
		else {
			$("#folders-view-container").show();
			$("#day-view-container").hide();
		}
		$("#title").width($(window).width() - $("#buttons-container").width() - em2px("#photo-name", 2) - 2 * parseInt($("#title").css("padding")));
		
		if (currentAlbum.photos.length == 1) {
			$("#next").hide();
			$("#back").hide();
			$(".next-media").removeAttr("href");
			$("#next").removeAttr("href");
			$("#back").removeAttr("href");
			$("#photo-view").addClass("no-bottom-space");
			$("#album-view").addClass("no-bottom-space");
		} else {
			nextLink = "#!/" + photoFloat.photoHash(currentAlbum, nextMedia);
			$("#next").show();
			$("#back").show();
			$(".next-media").attr("href", nextLink);
			$("#next").attr("href", nextLink);
			$("#back").attr("href", "#!/" + photoFloat.photoHash(currentAlbum, previousMedia));
			$("#photo-view").removeClass("no-bottom-space");
			$("#album-view").removeClass("no-bottom-space");
		}
		$("#original-link").attr("target", "_blank").attr("href", photoFloat.originalPhotoPath(currentMedia));
		
		$("#folders-view").attr("href", "#!/" + PhotoFloat.cachePath(currentMedia.foldersAlbum) + "/" + PhotoFloat.cachePath(currentMedia.name));
		$("#day-view").attr("href", "#!/" + PhotoFloat.cachePath(currentMedia.dayAlbum) + "/" + PhotoFloat.cachePath(currentMedia.name));
		
		text = "<table>";
		if (typeof currentMedia.make !== "undefined") text += "<tr><td>Camera Maker</td><td>" + currentMedia.make + "</td></tr>";
		if (typeof currentMedia.model !== "undefined") text += "<tr><td>Camera Model</td><td>" + currentMedia.model + "</td></tr>";
		if (typeof currentMedia.date !== "undefined") text += "<tr><td>Time Taken</td><td>" + currentMedia.date + "</td></tr>";
		if (typeof currentMedia.size !== "undefined") text += "<tr><td>Resolution</td><td>" + currentMedia.size[0] + " x " + currentMedia.size[1] + "</td></tr>";
		if (typeof currentMedia.aperture !== "undefined") text += "<tr><td>Aperture</td><td> f/" + getDecimal(currentMedia.aperture) + "</td></tr>";
		if (typeof currentMedia.focalLength !== "undefined") text += "<tr><td>Focal Length</td><td>" + getDecimal(currentMedia.focalLength) + " mm</td></tr>";
		if (typeof currentMedia.subjectDistanceRange !== "undefined") text += "<tr><td>Subject Distance Range</td><td>" + currentMedia.subjectDistanceRange + "</td></tr>";
		if (typeof currentMedia.iso !== "undefined") text += "<tr><td>ISO</td><td>" + currentMedia.iso + "</td></tr>";
		if (typeof currentMedia.sceneCaptureType !== "undefined") text += "<tr><td>Scene Capture Type</td><td>" + currentMedia.sceneCaptureType + "</td></tr>";
		if (typeof currentMedia.exposureTime !== "undefined") text += "<tr><td>Exposure Time</td><td>" + getDecimal(currentMedia.exposureTime) + " sec</td></tr>";
		if (typeof currentMedia.exposureProgram !== "undefined") text += "<tr><td>Exposure Program</td><td>" + currentMedia.exposureProgram + "</td></tr>";
		if (typeof currentMedia.exposureCompensation !== "undefined") text += "<tr><td>Exposure Compensation</td><td>" + getDecimal(currentMedia.exposureCompensation) + "</td></tr>";
		if (typeof currentMedia.spectralSensitivity !== "undefined") text += "<tr><td>Spectral Sensitivity</td><td>" + currentMedia.spectralSensitivity + "</td></tr>";
		if (typeof currentMedia.sensingMethod !== "undefined") text += "<tr><td>Sensing Method</td><td>" + currentMedia.sensingMethod + "</td></tr>";
		if (typeof currentMedia.lightSource !== "undefined") text += "<tr><td>Light Source</td><td>" + currentMedia.lightSource + "</td></tr>";
		if (typeof currentMedia.flash !== "undefined") text += "<tr><td>Flash</td><td>" + currentMedia.flash + "</td></tr>";
		if (typeof currentMedia.orientation !== "undefined") text += "<tr><td>Orientation</td><td>" + currentMedia.orientation + "</td></tr>";
		text += "</table>";
		$("#metadata").html(text);
		
		$("#album-view").addClass("photo-view-container");
		thumbnail_size = Options['thumb_sizes'][0];
		$(".photo-view-container").css("height", (thumbnail_size + 5).toString() + "px");
		$("#photo-view").css("bottom", (thumbnail_size + 5).toString() + "px");
		$("#subalbums").hide();
		$("#photo-view").show();
	}
	
	function em2px(selector, em) {
		var emSize = parseFloat($(selector).css("font-size"));
		return (em * emSize);
	}
	/* Error displays */
	
	function die(error) {
		if (error == 403) {
			$("#auth-text").fadeIn(1000);
			$("#password").focus();
		} else
			$("#error-text").fadeIn(2500);
		$("#error-overlay").fadeTo(500, 0.8);
		$("body, html").css("overflow", "hidden");
	}
	function undie() {
		$("#error-text, #error-overlay, #auth-text").fadeOut(500);
		$("body, html").css("overflow", "auto");
	}
	
	
	/* Entry point for most events */
	
	function hashParsed(album, photo, photoIndex) {
		undie();
		$("#loading").hide();
		if (album === currentAlbum && photo === currentMedia)
			return;
		if (album != currentAlbum)
			currentAlbum = null;
		if (currentAlbum && currentAlbum.path.indexOf(Options['by_date_string']) === 0 && photo !== null) {
			previousAlbum = currentAlbum;
			album = currentAlbum;
			previousMedia = photo;
			currentMedia = photo;
			currentMediaIndex = photoIndex;
		}
		else {
			previousAlbum = currentAlbum;
			previousMedia = currentMedia;
			currentAlbum = album;
			currentMedia = photo;
			currentMediaIndex = photoIndex;
		}
		
		setTitle();
		if (currentMedia !== null)
			showMedia(currentAlbum);
		else {
			$("#folders-view-container").hide();
			$("#day-view-container").hide();
		}
		var populateAlbum = previousAlbum !== currentAlbum || previousMedia !== currentMedia;
		showAlbum(populateAlbum);
		if (currentMedia !== null || ! Options['show_media_names_below_thumbs_in_albums'])
			$(".thumb-caption-media").hide();
		else
			$(".thumb-caption-media").show();
		
		setOptions();
	}
	
	function setOptions() {
		thumbnail_size = Options['thumb_sizes'][0];
		$("body").css("background-color", Options['background_color']);
		$("#day-view-container").css("color", Options['switch_button_color']);
		$("#day-view-container").hover(function() {
			//mouse over
			$(this).css("color", Options['switch_button_color_hover'])
		}, function() {
			//mouse out
			$(this).css("color", Options['switch_button_color'])
		});
		$("#folders-view-container").css("color", Options['switch_button_color']);
		$("#folders-view-container").hover(function() {
			//mouse over
			$(this).css("color", Options['switch_button_color_hover'])
		}, function() {
			//mouse out
			$(this).css("color", Options['switch_button_color'])
		});
		$("#day-view-container").css("background-color", Options['switch_button_background_color']);
		$("#day-view-container").hover(function() {
			//mouse over
			$(this).css("background-color", Options['switch_button_background_color_hover'])
		}, function() {
			//mouse out
			$(this).css("background-color", Options['switch_button_background_color'])
		});
		$("#folders-view-container").css("background-color", Options['switch_button_background_color']);
		$("#folders-view-container").hover(function() {
			//mouse over
			$(this).css("background-color", Options['switch_button_background_color_hover'])
		}, function() {
			//mouse out
			$(this).css("background-color", Options['switch_button_background_color'])
		});
		$("#title").css("font-size", Options['title_font_size']);
		$(".title-anchor").css("color", Options['title_color']);
		$(".title-anchor").hover(function() {
			//mouse over
			$(this).css("color", Options['title_color_hover'])
		}, function() {
			//mouse out
			$(this).css("color", Options['title_color'])
		});
		$("#photo-name").css("color", Options['title_image_name_color']);
		//~ $("#thumbs img").css("margin-left", Options['thumb_spacing'].toString() + "px");
		$("#thumbs img").css("margin-right", Options['thumb_spacing'].toString() + "px");
		$(".album-button").css("margin-left", Options['thumb_spacing'].toString() + "px");
		//~ $(".album-button").css("margin-right", Options['thumb_spacing'].toString() + "px");
		$(".thumb-caption-media").css("width", thumbnail_size.toString() + "px");
		$(".thumb-caption-album").css("width", thumbnail_size.toString() + "px");
		if (Options['different_album_thumbnails']) {
			$(".album-button").css("width", (thumbnail_size * 1.1).toString() + "px");
			$(".album-button").css("padding-top", (thumbnail_size * 1.1).toString() + "px");
			$(".album-button").css("background-position-y", (thumbnail_size * 0.1).toString() + "px");
		} else {
			$(".album-button").css("width", thumbnail_size.toString() + "px");
			$(".album-button").css("padding-top", thumbnail_size.toString() + "px");
			$(".album-button").css("background-position-y", "0");
		}
	}
	
	/* Event listeners */
	
	$(window).hashchange(function() {
		$("#loading").show();
		$("link[rel=image_src]").remove();
		$("link[rel=video_src]").remove();
		getOptions("", parseHash);
		//~ photoFloat.parseHash(location.hash, hashParsed, die);
	});
	$(window).hashchange();
	
	
	// this function is needed in order to let this point to the correct value in photoFloat.parseHash
	function parseHash(hash, callback, error) {
		photoFloat.parseHash(hash, callback, error);
	}
	
	function getOptions(cacheSubDir, callback) {
		if (Object.keys(Options).length > 0)
			photoFloat.parseHash(location.hash, hashParsed, die);
		else {
			if (cacheSubDir && cacheSubDir.substr(-1) != "/")
				cacheSubDir += "/"
			optionsFile = cacheSubDir + "options.json";
			ajaxOptions = {
				type: "GET",
				dataType: "json",
				url: optionsFile,
				success: function(data) {
					for (var key in data)
						Options[key] = data[key];
					if (Options['server_cache_path'] && Options['server_cache_path'].substr(-1) != "/")
						Options['server_cache_path'] += "/";
					if (Options['server_album_path'] && Options['server_album_path'].substr(-1) != "/")
						Options['server_album_path'] += "/";
					
					callback(location.hash, hashParsed, die);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					if (errorThrown == "Not Found" && ! cacheSubDir)
						getOptions("cache", parseHash);
					else {
						$("#error-options-file").fadeIn(1500);
						$("#error-options-file, #error-overlay, #auth-text").fadeOut(500);
					}
				}
			};
			if (typeof error !== "undefined" && error !== null) {
				ajaxOptions.error = function(jqXHR, textStatus, errorThrown) {
					$("#error-options-file").fadeIn(1500);
					$("#error-options-file, #error-overlay, #auth-text").fadeOut(500);
				};
			}
			$.ajax(ajaxOptions);
		}
	};
	
	$(document).keydown(function(e){
		if (currentMedia === null)
			return true;
		if (e.keyCode === 39) {
			window.location.href = $("#next").attr("href");
			return false;
		} else if (e.keyCode === 37) {
			window.location.href = $("#back").attr("href");
			return false;
		}
		return true;
	});
	$(document).mousewheel(function(event, delta) {
		
		if (currentMedia === null || $("#next").attr('href') === undefined)
			return true;
		if (delta < 0) {
			window.location.href = $("#next").attr("href");
			return false;
		} else if (delta > 0) {
			window.location.href = $("#back").attr("href");
			return false;
		}
		return true;
	});
	$("#photo-box").mouseenter(function() {
		$("#photo-links").stop().fadeTo("slow", 0.50).css("display", "inline");
	});
	$("#photo-box").mouseleave(function() {
		$("#photo-links").stop().fadeOut("slow");
	});
	$("#next, #back").mouseenter(function() {
		$(this).stop().fadeTo("slow", 1);
	});
	$("#next, #back").mouseleave(function() {
		$(this).stop().fadeTo("slow", 0.35);
	});
	if ($.support.fullscreen) {
		$("#fullscreen-divider").show();
		$("#fullscreen").show().click(function() {
			$("#photo").fullScreen({callback: function(isFullscreen) {
				maxSizeSet = false;
				showMedia(currentAlbum, isFullscreen);
			}});
		});
	}
	$("#metadata-show").click(function() {
		$("#metadata-show").hide();
		$("#metadata-hide").show();
		$("#metadata").stop()
			.css("height", 0)
			.css("padding-top", 0)
			.css("padding-bottom", 0)
			.show()
			.animate({ height: $("#metadata > table").height(), paddingTop: 3, paddingBottom: 3 }, "slow", function() {
				$(this).css("height", "auto");
			});
	});
	$("#metadata-hide").click(function() {
		$("#metadata-show").show();
		$("#metadata-hide").hide();
		$("#metadata").stop()
			.animate({ height: 0, paddingTop: 0, paddingBottom: 0 }, "slow", function() {
				$(this).hide();
			});
	});
	$("#auth-form").submit(function() {
		var password = $("#password");
		password.css("background-color", "rgb(128, 128, 200)");
		photoFloat.authenticate(password.val(), function(success) {
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
