// Global variables
var map;
var infoWindow;
var bounds;

// Create map //
function initMap() {
  map = new google.maps.Map(document.getElementById('map'),{
      center: {lat: 32.776664, lng: -96.796988},
      zoom: 10
  });

// Create info window
  infoWindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();
  ko.applyBindings(new ViewModel());
}

// Populates the infowindow when the marker is clicked.
function populateInfoWindow(marker, street, city, URL, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.addListener('closeclick', function () {
            infowindow.setMarker = null;
        });
        var windowContent = '<h4>' + marker.title + '</h4>' +
            '<p>' + street + '<br>' + city + '</p>' + '<a href="' + URL + '" target="blank">' + URL + '</a>';
        infowindow.setContent(windowContent);
        infowindow.open(map, marker);
    }
}

// Animation for marker
function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
  }
  else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
      marker.setAnimation(null);
  }, 2100);
  }
}

// Map error
function googleMapsError() {
    alert('An error occurred with Google Maps.');
}
// Location model
var Location = function(data) {
    var self = this;

    self.title = data.title;
    self.position = data.location;
    // Create ko observable variable
    self.visible= ko.observable(true);
    // Foursquare API
    var CLIENT_ID = "O1DXIJF4K5CBXGRUXBB3R2IMXV5SG113IVINHXQ0GD3QRPXA";
    var CLIENT_SECRET = "ZLUCBJM5WI1B0YXFORLGVSCONHQEVLCQ0YHKUVUC2ZBWLXOF";
    // Get JSON request of data
    var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + self.position.lat + ',' + self.position.lng + '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=20180424' + '&query=' + this.title;

    $.getJSON(reqURL).done(function(data) {
        var results = data.response.venues[0] || "";
        self.street = results.location.formattedAddress[0] || "";
        self.city = results.location.formattedAddress[1] || "";
        self.URL = results.url || "";
    }).fail(function() {
        alert("Something went wrong. Please refresh the page and try again.");
    });

// Create google marker
    self.marker = new google.maps.Marker({
      map: map,
      position: self.position,
      title: self.title,
      animation: google.maps.Animation.DROP
    });

// Extend the boundaries of the map for each marker
    bounds.extend(self.position);

// Bounce a marker and show its infowindow when click
    self.marker.addListener('click', function(){
        populateInfoWindow(this, self.street, self.city, self.URL, infoWindow);
        toggleBounce(this);
    });


// Show visible markers on map
    self.showVisible = ko.computed(function() {
        self.marker.setVisible(self.visible());
    }, self);
    };

    // Bounce a marker and show its infowindow when click from the list
    Location.prototype.show = function() {
        var self = this;
        google.maps.event.trigger(self.marker, 'click');
    }

// ViewModel
var ViewModel = function() {
    var self = this;
    self.searchItem = ko.observable('');
    self.markerList = ko.observableArray([]);

    // Add all markers
    locations.forEach(function(location){
        self.markerList.push(new Location(location));
    });

// Filter markerList
self.filteredList = ko.computed(function() {
    var filter = self.searchItem().toLowerCase();
    if(filter) {
        return ko.utils.arrayFilter(self.markerList(),function(location) {
            var str = location.title.toLowerCase();
            var result = str.includes(filter);
            location.visible(result);
            return result;
        });
    }
    self.markerList().forEach(function(location) {
        location.visible(true);
    });
    return self.markerList();
}, self);
};
