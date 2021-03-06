(function() {

	var phFl = new PhotoFloat();
	var util = new Utilities();
	var f = new Functions();

	/* constructor */
	function MapFunctions() {
	}

	MapFunctions.prototype.updatePopup = function() {
		util.setMediaOptions();
		// f.setOptions();
		env.popup.setContent($(".media-popup .leaflet-popup-content").html());
		MapFunctions.calculatePopupSizes();
		$(".media-popup .leaflet-popup-content").css("max-width", env.maxWidthForPopupContent + "px");
		// $(".media-popup .leaflet-popup-content").css("width", MapFunctions.);
		$(".media-popup .leaflet-popup-content").css("min-width", env.options.media_thumb_size + "px");
		$("#popup-images-wrapper").css("max-height", "");
		$("#popup-images-wrapper").css("max-height", ($(".media-popup .leaflet-popup-content").outerHeight() - $("#popup-photo-count").outerHeight(true)) + "px");
		$("#popup-photo-count").css("max-width", env.maxWidthForPopupContent + "px");
		env.popup.setLatLng(env.mapAlbum.positionsAndMediaInTree.averagePosition());
		MapFunctions.buildPopupHeader();

		MapFunctions.setPopupPosition();
		MapFunctions.panMap();
		util.addMediaLazyLoader();

		util.scrollPopupToHighlightedThumb();

		util.highlightSearchedWords();

		f.updateMenu();
	};

	MapFunctions.calculatePopupSizes = function() {
		var scrollerSize = util.windowVerticalScrollbarWidth();
		if ($("#popup-images-wrapper")[0]) {
			var popupHasScrollBar = ($("#popup-images-wrapper")[0].offsetWidth !== $("#popup-images-wrapper")[0].clientWidth);
			if (popupHasScrollBar)
				scrollerSize = util.windowVerticalScrollbarWidth();
		}

		// how much space is available horizontally for the thumbnails?
		env.maxWidthForPopupContent = parseInt($("#mapdiv").width() * 0.85);
		// the space for the images: remove the margin
		env.maxWidthForImagesInPopup = env.maxWidthForPopupContent - 15 - 15;
		// square thumbnails: set the value to a shorter one, in order to avoid right white space
		// if (env.options.media_thumb_type === "media_square") {
		// 	var thumbSize = env.options.media_thumb_size;
		// 	var spacing = 0;
		// 	if (env.options.spacing)
		// 		spacing = Math.ceil(env.options.spacingSavedValue);
		// 	var numThumbnailsInLine = parseInt((env.maxWidthForImagesInPopup - scrollerSize) / (thumbSize + spacing));
		// 	if (numThumbnailsInLine === 1)
		// 		env.maxWidthForImagesInPopup = thumbSize + 1;
		// 	else
		// 		env.maxWidthForImagesInPopup = numThumbnailsInLine * (thumbSize + spacing) + scrollerSize;
		// 	env.maxWidthForPopupContent = env.maxWidthForImagesInPopup + 15 + 15;
		// }
		// vertical popup size
		env.maxHeightForPopupContent = parseInt($("#mapdiv").height() * 0.85);
	};

	MapFunctions.buildPopupHeader = function() {
		$("#popup-photo-count-number").html(env.mapAlbum.numsMedia.imagesAndVideosTotal());
		$("#popup-photo-count").css("max-width", env.maxWidthForPopupContent);
		// add the click event for showing the photos in the popup as an album
		$("#popup-photo-count").off("click").on(
			"click",
			function() {
				env.highlightedObjectId = null;
				if (util.isShiftOrControl())
					$(".shift-or-control .leaflet-popup-close-button")[0].click();
				$(".media-popup .leaflet-popup-close-button")[0].click();
				// $('#popup #popup-content').html("");
				$('.modal-close')[0].click();
				env.popupRefreshType = "previousAlbum";
				env.mapRefreshType = "none";

				var promise = phFl.endPreparingAlbumAndKeepOn(env.mapAlbum, null, null);
				promise.then(
					function(){
						$("#album-view").addClass("hidden");
						$("#loading").show();
						window.location.href = "#!" + env.mapAlbum.cacheBase;
					}
				);
			}
		);
	};

	MapFunctions.setPopupPosition = function() {
		if (
			env.options.available_map_popup_positions.every(
				function(orientation) {
					return ! $(".media-popup.leaflet-popup").hasClass(orientation);
				}
			)
		) {
			$(".media-popup.leaflet-popup").addClass(env.options.default_map_popup_position);
		}
	};

	MapFunctions.panMap = function() {
		// pan the map so that the popup is inside the map
		var popupPosition = env.mymap.latLngToContainerPoint(env.popup.getLatLng());
		var popupWidth = $(".media-popup .leaflet-popup-content-wrapper").width();
		var popupHeight = $(".media-popup .leaflet-popup-content-wrapper").height();
		var mapWidth = $("#mapdiv").width();
		var mapHeight = $("#mapdiv").height();
		var panX = 0, panY = 0;
		if (popupPosition.x + popupWidth > mapWidth) {
			panX = popupWidth - (mapWidth - popupPosition.x);
		} else if (popupPosition.x < 0)
			panX = popupPosition.x - 50;

		if (popupPosition.y + popupHeight > mapHeight) {
			panY = popupHeight - (mapHeight - popupPosition.y) + 50;
		} else if (popupPosition.y < 0)
			panY = popupPosition.y - 20;
		env.mymap.panBy([panX, panY], {animate: false});
	};

	MapFunctions.prototype.addPopupMover = function() {
		// add the popup mover
		$(".popup-mover").remove();
		$(".media-popup .leaflet-popup-close-button").after('<a id="popup-mover" class="popup-mover"></a>');
		// add the corresponding listener
		$(".popup-mover").off("click").on(
			"click",
			function() {
				var currentIndex = env.options.available_map_popup_positions.findIndex(
					function(orientation) {
						return $(".media-popup.leaflet-popup").hasClass(orientation);
					}
				);
				var nextIndex = currentIndex + 1;
				if (currentIndex === env.options.available_map_popup_positions.length - 1)
					nextIndex = 0;
				$(".media-popup.leaflet-popup").
					removeClass(env.options.available_map_popup_positions[currentIndex]).
					addClass(env.options.available_map_popup_positions[nextIndex]);
				return false;
			}
		);

		$(".media-popup .leaflet-popup-content").css("max-height", parseInt(env.windowHeight * 0.8)).css("max-width", parseInt(env.windowWidth * 0.8));
		MapFunctions.setPopupPosition();
	};

	L.NumberedDivIcon = L.Icon.extend({
		options: {
			// EDIT THIS TO POINT TO THE FILE AT http://www.charliecroom.com/marker_hole.png (or your own marker)
			iconUrl: 'css/images/marker_hole.png',
			number: '',
			shadowUrl: null,
			iconSize: new L.Point(25, 41),
			iconAnchor: new L.Point(13, 41),
			popupAnchor: new L.Point(0, -33),
			/*
			iconAnchor: (Point)
			popupAnchor: (Point)
			*/
			className: 'leaflet-div-icon'
		},

		createIcon: function () {
			var div = document.createElement('div');
			var img = this._createImg(this.options.iconUrl);
			var numdiv = document.createElement('div');
			numdiv.setAttribute ( "class", "number" );
			numdiv.innerHTML = this.options.number || '';
			div.appendChild ( img );
			div.appendChild ( numdiv );
			this._setIconStyles(div, 'icon');
			return div;
		},

		//you could change this to add a shadow like in the normal marker if you really wanted
		createShadow: function () {
			return null;
		}
	});

	MapFunctions.prototype.calculatePopupSizes = MapFunctions.calculatePopupSizes;

	window.MapFunctions = MapFunctions;
}());
