var VAL ={};

AutoForm.addInputType("googleplace", {
  template: "afGooglePlace",
  valueIn: function(val) {
    if(typeof(val) ==='string') {
      val ={
        fullAddress: val
      }
    }
    VAL =val;
    return val;
  },
  valueOut: function() {
    // return this.googleplace('val');
    // return this.value;
    return VAL;
  }
});

Template.afGooglePlace.rendered =function() {
  var ele =this.find('input');
  var types =[];    //either [blank] or one or more of: 'establishment', 'geocode'
  var componentRestrictions ={country:'us'};
  var options = {
    //bounds: defaultBounds,
    types: types,
    componentRestrictions: componentRestrictions
  };
  var autocomplete = new google.maps.places.Autocomplete(ele, options);

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    updatePlace({});
  });

  function updatePlace(params) {
    var val =ele.value;
    var loc ={
      lat: '',
      lng: '',
      fullAddress: val,
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    };
    
    var place = autocomplete.getPlace();
    if(place && place.geometry && place.geometry.location) {
      loc =parseGoogleAddressComponent(place.address_components, {});

      loc.lat =place.geometry.location.lat();
      loc.lng =place.geometry.location.lng();
      loc.fullAddress =(place.formatted_address) ? place.formatted_address : "";
    }

    /**
    Google returns lots of results and "address types" but the first one is usually the most specific so use that one to parse out the city and state.
    https://developers.google.com/maps/documentation/geocoding/?csw=1#ReverseGeocoding
    https://developers.google.com/maps/documentation/geocoding/?csw=1#Types
    For the United States, here's the mapping:
    - [street_number] + [route] --> street
    - locality --> city
    - administrative_area_level_1 --> state
    - postal_code --> zip code
    - country --> country
    @toc 2.
    @method parseGoogleAddressComponent
    @param {Object} addressComponents The raw result from google maps
    @return {Object} address The formatted address
    */
    function parseGoogleAddressComponent(addressComponents, params) {
      var address ={};
      //go through all address components and pull out the matching types and map them to what we want (city, state)
      var map ={
        'street_number': 'street',
        'route': 'street',
        'locality': 'city',
        'administrative_area_level_1': 'state',
        'postal_code': 'zip',
        'country': 'country'
      };
      var ii, xx;
      for(ii =0; ii<addressComponents.length; ii++) {
        for(xx in map) {
          //if have a map type we want
          if(addressComponents[ii].types.indexOf(xx) >-1) {
            //have to join street number and route together
            if((xx ==='street_number' || xx ==='route') && address.street !==undefined) {
              //prepend
              if(xx ==='street_number') {
                address.street =addressComponents[ii].short_name + ' ' +address.street;
              }
              //append
              else if(xx ==='route') {
                address.street =address.street + ' ' + addressComponents[ii].short_name;
              }
            }
            else {
              if(xx ==='locality') {
                address[map[xx]] =addressComponents[ii].long_name;
              }
              else {
                address[map[xx]] =addressComponents[ii].short_name;
              }
            }
          }
        }
      }

      return address;
    }

    // ele.googleplace('val', loc);
    // this.value =loc;
    VAL =loc;
  }
};