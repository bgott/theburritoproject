var map;
var service;
var infowindow;
var user_location;
var places = {};
var directionsDisplay;
var directionsService;
var DEFAULT_ZOOM = 14;
var DEFAULT_RADIUS = '500';
var stylesArray = [{"featureType":"all","elementType":"labels","stylers":[{"lightness":63},{"hue":"#ff0000"}]},{"featureType":"administrative","elementType":"all","stylers":[{"hue":"#000bff"},{"visibility":"on"}]},{"featureType":"administrative","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"administrative","elementType":"labels","stylers":[{"color":"#4a4a4a"},{"visibility":"on"}]},{"featureType":"administrative","elementType":"labels.text","stylers":[{"weight":"0.01"},{"color":"#727272"},{"visibility":"on"}]},{"featureType":"administrative.country","elementType":"labels","stylers":[{"color":"#ff0000"}]},{"featureType":"administrative.country","elementType":"labels.text","stylers":[{"color":"#ff0000"}]},{"featureType":"administrative.province","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"administrative.province","elementType":"labels.text","stylers":[{"color":"#545454"}]},{"featureType":"administrative.locality","elementType":"labels.text","stylers":[{"visibility":"on"},{"color":"#737373"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text","stylers":[{"color":"#7c7c7c"},{"weight":"0.01"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text","stylers":[{"color":"#404040"}]},{"featureType":"landscape","elementType":"all","stylers":[{"lightness":16},{"hue":"#ff001a"},{"saturation":-61}]},{"featureType":"poi","elementType":"labels.text","stylers":[{"color":"#828282"},{"weight":"0.01"}]},{"featureType":"poi.government","elementType":"labels.text","stylers":[{"color":"#4c4c4c"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"hue":"#00ff91"}]},{"featureType":"poi.park","elementType":"labels.text","stylers":[{"color":"#7b7b7b"}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.text","stylers":[{"color":"#999999"},{"visibility":"on"},{"weight":"0.01"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"hue":"#ff0011"},{"lightness":53}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"color":"#626262"}]},{"featureType":"transit","elementType":"labels.text","stylers":[{"color":"#676767"},{"weight":"0.01"}]},{"featureType":"water","elementType":"all","stylers":[{"hue":"#0055ff"}]}];

$('#map').load(function() {
  $('.burrito-div').fadeOut('slow');
});

/** Fetch the user's location from the browser, display appropriate error 
 *  if the location is unavailable.
 */
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setLocation, userLocationError);
  } else {
    window.alert('User denied access to geolocation');
  }
}

function setLocation(position) {
  var latlng = {lat: position.coords.latitude, lng: position.coords.longitude};
  user_location = latlng;

  initMap();
  setTimeout(showUserPosition, 2000);
  setTimeout(burritoSearch, 2000);
}


/** Makes use of googlemaps api's call to nearbySearch which allows to sort by 
 *  distance from the user's location. There seem to be a few discrepancies 
 *  between the call's results, and the distance estimates of the google maps
 *  directions class, but it's pretty damn accurate.
 */
function burritoSearch() {
  service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: user_location,
    keyword: 'burrito',
    types: ['restaurants'],
    rankBy: google.maps.places.RankBy.DISTANCE,
  }, searchcallback);
}

function userLocationError(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
        window.alert('User denied the request for Geolocation.');
        break;
    case error.POSITION_UNAVAILABLE:
        window.alert('Location information is unavailable.');
        break;
    case error.TIMEOUT:
        window.alert('The request to get user location timed out.');
        break;
    case error.UNKNOWN_ERROR:
        window.alert('An unknown error occurred.');
        break;
    }
}


/** Displays the user's position icon and display the user's infowindow
 */
function showUserPosition() {
  map.panTo(user_location);
  map.setZoom(DEFAULT_ZOOM);

  var myIcon = new google.maps.MarkerImage('./images/location_marker.png', null, null, null, new google.maps.Size(17,17));
  var marker = new google.maps.Marker({
    position: user_location,
    map: map,
    title: 'You are here',
    icon: myIcon,
  });

  infowindow.setContent(marker.title);
  infowindow.open(map, marker);
    
  google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, this);
  });
}

/** After the route is calculated and displayed on the map, we move
 *  the route directions <div> underneath the matching place button
 */
function calculateAndDisplayRoute(directionsService, directionsDisplay, destination) {
  var start = user_location;
  var end = destination.vicinity;
  directionsDisplay.setMap(map);
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.DRIVING,
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
      var button = $(document).find('.list-group').children('.active');
      $('#right-panel').insertAfter(button);
      $('#right-panel').show();
      setTimeout(adjustMap, 5);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}

/** By covering part of the map with the panel of burrito places, as well as 
 *  the banner, we've covered part of the map that the google API thinks is 
 *  in use. This function adjusts the map to display the directions within 
 *  the usable (lower right) section of the map.
 */
function adjustMap() {
  map.setZoom(map.getZoom() - 1);
  map.panBy(-170, -100);
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: user_location,
    zoom: DEFAULT_ZOOM,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    styles: stylesArray,
  });

  directionsDisplay = new google.maps.DirectionsRenderer;
  directionsService = new google.maps.DirectionsService;
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  infowindow = new google.maps.InfoWindow();
  $('#map').removeClass('map-loading');
}

function searchcallback(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    var destinations = [];
    var user_locations = [];
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
      addPlaceToList(results[i]);
    }
  }
  fadeGif();
}

function fadeGif() {
  $('#burrito-gif').addClass('burrito-gif-fade');
  setTimeout(function() {
    $('.burrito-div').remove();
  }, 200);
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var myIcon = new google.maps.MarkerImage('./images/burrito_marker2.png', null, null, null, new google.maps.Size(70, 70));
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP,
    icon: myIcon,
    zIndex: 2,
  });


  google.maps.event.addListener(marker, 'click', function() {
    createMarkerInfobox(marker, place);
    var previous = $('.list-group').children('.active');
    previous.removeClass('active'); 
    $("button:contains('" + place.vicinity + "')").addClass('active');
    calculateAndDisplayRoute(directionsService, directionsDisplay, place);
    scrollToPlaceList();
  });

  marker.setMap(map);

  $('#map').data(place.name, marker);
  $('.places').data(place.name, place);
}

function createMarkerInfobox(marker, place) {
  var contentStr = '<h4>' + place.name + '</h4><p>' + place.vicinity;
    contentStr += '</p>';
      
    infowindow.setContent(contentStr);
    infowindow.open(map, marker);
}


/** Create the list-group-item button and descendants for each place and append 
 *  it to the list-group in the panel.
 */
function addPlaceToList(place) {

  var list_str ="";
  list_str += "<button type='button' class='list-group-item place-button'>";
  list_str += "<h4 class='list-group-item-heading'>" + place.name + "</h4>";
  list_str += "<p class='list-group-item-text address' hidden>" + place.vicinity + "</p>";
  list_str += "<div class='star-ratings-css'><div class='star-ratings-css-top'style='width: " + (place.rating * 25) + "%'><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div><div class='star-rating-css-bottom'><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div></div>";
  list_str += "<div class='price'>";
  for (var i = 0; i < place.price_level; i++) {
    list_str += "$";
  }
  if (place.price_level == undefined) {
    list_str += '?';
  }
  list_str += "</div>";
  list_str += "</button>";

  $('.list-group').append(list_str);
}

$(document).on('click', '.place-button', function() {
  var previous = $('.active');
  // removes all appropriate styling from the previously selected place
  if (previous) {
    previous.removeClass('active');
    previous.children('.address').hide();
    $('#right-panel').hide();
    directionsDisplay.setMap(null);
  }
  var address = $(this).children('.address').text();
  var prev_addr = previous.children('.address').text();

  // clicked a new place button
  if (address !== prev_addr) {
    $(this).addClass('active');
    $(this).children('.address').show();

    var name = $(this).children('h4').text();
    var marker = $('#map').data(name);
    var place = $('.places').data(name);
    createMarkerInfobox(marker, place);
    calculateAndDisplayRoute(directionsService, directionsDisplay, place);
    setTimeout(scrollToPlaceList, 200);

  } else {
    map.panTo(user_location);
    map.setZoom(DEFAULT_ZOOM);
    infowindow.close();
  }

});

/** Scrolls along the list of places, to the active burrito shop. we set a 
 *  timeout to reduce lag between the auto zoom after directions are displayed.
 */
function scrollToPlaceList() {
  var groupdiv = $('.list-group');
  var scrollto = $('.active');
  groupdiv.animate({
    scrollTop: scrollto.offset().top - groupdiv.offset().top + groupdiv.scrollTop()
  });
}


