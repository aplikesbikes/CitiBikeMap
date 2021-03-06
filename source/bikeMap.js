(function() {
  "use strict";
var map;
var directionsService;
var stepDisplay;
var TIME_FACTOR = 3;

//TODO: Make a class for route objects
var routes = [];


//This seems a bit off, maybe I should subscribe to the click event here
window.startAnimation = function(trips) {
  for (var i = 0, len = trips.length; i < len; ++i) {
    animateRoute(trips[i]);   
  }
}

window.initializeMapService = function() {
  // Instantiate a directions service.
  directionsService = new google.maps.DirectionsService();

  // Create a map and center it on the East River.
  var eastRiver = new google.maps.LatLng(40.7234205, -73.9730403);
  
  var mapOptions = {
    zoom: 13,
    center: eastRiver,
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  // Instantiate an info window to hold step text.
  stepDisplay = new google.maps.InfoWindow();
}

function animateRoute(trip) {
  // Create a DirectionsRequest using BICYCLING directions.
  var request = {
      origin: trip.startPoint,
      destination: trip.endPoint,
      travelMode: google.maps.TravelMode.BICYCLING
  };

  // Route the directions and pass the response to a
  // function to create an animation
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      var warnings = document.getElementById('warnings_panel');
      warnings.innerHTML = '<b>' + response.routes[0].warnings + '</b>';
      showSteps(response, trip);
    }
  });
}

function showSteps(directionResult, trip) {
  // For each step, save the coordinates to build a line that follows
  // the default bicycling directions
  var myRoute = directionResult.routes[0].legs[0];
  
  //TODO: Route class
  var routeObj = { 
    coordinates : [],
    distance: 0,
   };

 //Save the coordinates for each step (used to build a line for the route)
 //As well as calculate total distance used for animation timing
  for (var i = 0; i < myRoute.steps.length; i++) {
    var step = myRoute.steps[i];
    routeObj.coordinates.push(step.start_location);
    if (i === myRoute.steps.length - 1) {
      routeObj.coordinates.push(step.end_location);
    }
    routeObj.distance += step.distance.value;
  };
  
  animateRouteObj(routeObj, trip);
}

function animateRouteObj(routeObj, trip) {   
  // Define the symbol, using one of the predefined paths ('CIRCLE')
  // supplied by the Google Maps JavaScript API.    
  var lineSymbol = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 2,
      strokeColor: '#393'
  };
  
  // Create the polyline and add the symbol to it via the 'icons' property.
  var bikePath = new google.maps.Polyline({
    path: routeObj.coordinates,
    geodesic: true,
    strokeColor: '#0000FF',
    strokeOpacity: 1.0,
    strokeWeight: 1,
    icons: [{
      icon: lineSymbol,
      offset: '0%'
    }],
  });

  bikePath.setMap(map);
  
  scheduleRoute(bikePath, routeObj, trip);
}

//Schedule the animation to take place based on when the trip started
function scheduleRoute(bikePath, routeObj, trip) {
   window.setTimeout(function() {
    
    var count = 0;
    var numIncrements = Math.floor(trip.duration * TIME_FACTOR /20);

    // Use the DOM setInterval() function to change the offset of the symbol
    // at fixed intervals.
    var intervalId = window.setInterval(function() {
        var percent = ++count / numIncrements;
        var icons = bikePath.get('icons');
        icons[0].offset = (percent*100 + '%');
        bikePath.set('icons', icons);
        //Once path is done, remove the line
        if (percent >= 1) {
          bikePath.setMap(null);
          bikePath.set('icons', []);
          window.clearInterval(intervalId);
        }
    }, 20);
    
  }, trip.startTime * TIME_FACTOR);
}
})();
