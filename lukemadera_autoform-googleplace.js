/**
@param {Object} [atts.opts]
  @param {String} [type ='service'] Set to 'googleUI' to use the Google Place UI (will NOT work on all mobile devices, especially iOS with 3rd party keyboards)
  @param {Boolean} [stopTimeoutOnKeyup =true] Set to false to keep running the timeout that auto-triggers showing predictions for 3rd party iOS keyboards where the keyup event does not fire. For performance, this defaults to true to kill the timeout as soon as we get a keyup event. This usually works, however, if the user switches back and forth between a 3rd party keyboard and a regular one, this will cause the 3rd party keyboard to NOT work anymore since a keyup event was registered (on the regular keyboard). So if you want this to be foolproof - albeit worse for performance, set this to false.
*/

var VAL ={};
var OPTS ={};

var CLASSES ={
  predictions: 'hidden'
};

var ELES ={
  input: false,
  googleAttribution: false
};

var TIMEOUTHACK ={
  lastVal: '',
  trigJustSelectedVal: false,
  times: {
    keyup: 500,
    selectedVal: 1000   //must be LONGER than keyup timeout time
  }
}

Session.set('afGooglePlacePredictions', []);
Session.set('afGooglePlaceClasses', CLASSES);

var afGooglePlace ={

  updatePlace: function(val, place, params) {
    var self =this;
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
    
    if(place && place.geometry && place.geometry.location) {
      loc =self.parseGoogleAddressComponent(place.address_components, {});

      loc.lat =place.geometry.location.lat();
      loc.lng =place.geometry.location.lng();
      loc.fullAddress =(place.formatted_address) ? place.formatted_address : "";
    }

    // ele.googleplace('val', loc);
    // this.value =loc;
    VAL =loc;
    return VAL;
  },

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
  parseGoogleAddressComponent: function(addressComponents, params) {
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
  },

  getPlace: function(inputVal, placePrediction, params) {
    var self =this;
    var placeService = new google.maps.places.PlacesService(ELES.googleAttribution);
    placeService.getDetails({placeId: placePrediction.place_id}, function(place, status) {
      if(status == google.maps.places.PlacesServiceStatus.OK) {
        var val =self.updatePlace(placePrediction.description, place, {});
        ELES.input.value =val.fullAddress;
        TIMEOUTHACK.lastVal =ELES.input.value;   //update for next time
        self.hide();
      }
      else {
        alert('google maps PlacesService error getting place with placeId: '+placeId);
      }
    });
  },

  updatePredictions: function(predictions, params) {
    Session.set('afGooglePlacePredictions', predictions);
    this.show({});
  },

  hide: function(params) {
    CLASSES.predictions ='hidden';
    Session.set('afGooglePlaceClasses', CLASSES);
  },

  show: function(params) {
    CLASSES.predictions ='visible';
    Session.set('afGooglePlaceClasses', CLASSES);
  },

  // getDropdownCoords: function(ele, params) {
  //   var rect = ele.getBoundingClientRect();
  //   // these are relative to the viewport
  //   var top = rect.top;
  //   var left = rect.left;
  //   return {
  //     top: top,
  //     left: left,
  //     bottom: top + ele.offsetHeight,
  //     right: left + ele.offsetWidth
  //   };
  // }

};

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
  var optsDefault ={
    type: 'service',
    stopTimeoutOnKeyup: true
  };
  OPTS =EJSON.clone(this.data.atts.opts);
  if(OPTS ===undefined) {
    OPTS =EJSON.clone(optsDefault);
  }
  else {
    //extend
    var xx;
    for(xx in optsDefault) {
      if(OPTS[xx] ===undefined) {
        OPTS[xx] =optsDefault[xx];
      }
    }
  }

  // var self =this;
  var ele =this.find('input');
  ELES.input =ele;
  ELES.googleAttribution =this.find('div.lm-autoform-google-place-attribution');
  var eleDropdown =this.find('div.lm-autoform-google-place-predictions');
  var types =[];    //either [blank] or one or more of: 'establishment', 'geocode'
  var componentRestrictions ={country:'us'};
  var options = {
    //bounds: defaultBounds,
    types: types,
    componentRestrictions: componentRestrictions
  };

  if(OPTS.type =='googleUI') {
    //standard autocomplete
    var autocomplete = new google.maps.places.Autocomplete(ele, options);

    google.maps.event.addListener(autocomplete, 'place_changed', function() {
      afGooglePlace.updatePlace(ele.value, autocomplete.getPlace(), {});
    });
  }
  else {
    //autocompleteservice (custom)
    // http://stackoverflow.com/questions/14414445/google-maps-api-v3-cant-geocode-autocompleteservice-predictions
    // https://developers.google.com/maps/documentation/javascript/examples/place-details
    // http://stackoverflow.com/questions/14343965/google-places-library-without-map

    //3rd party iOS mobile keyboards do NOT fire the events properly so we need to do a timeout. To handle this, we'll auto run the event handlers with a periodic timeout but then if we DO get an event, we'll stop the timeout since we have now "detected" the keyboard is not 3rd party (or at least that it's working)
    var eventsFiring =false;    //default - once we get an event, we'll reset this
    TIMEOUTHACK.lastVal =ele.value;   //save to compare to track if a change happened

    var timeoutTriggerEvents =function(params) {
      setTimeout(function() {
        if(!eventsFiring) {
          if(!TIMEOUTHACK.trigJustSelectedVal) {
            handleKeyup(false, {});
          }
          timeoutTriggerEvents({});   //call again
        }
      }, TIMEOUTHACK.times.keyup);
    };

    var handleKeyup =function(evt, params) {
      options.input =ele.value;
      if(!options.input.length) {
        afGooglePlace.hide({});
      }
      else {
        if(ele.value !==TIMEOUTHACK.lastVal) {
          autocompleteService.getPlacePredictions(options, function(predictions, status) {
            if(status != google.maps.places.PlacesServiceStatus.OK) {
              // alert(status);
              afGooglePlace.hide({});
              return;
            }
            else {
              afGooglePlace.updatePredictions(predictions, {});
            }
          });
          TIMEOUTHACK.lastVal =ele.value;   //update for next time
        }
      }
    };

    var handleFocus =function(evt, params) {
      if(ele.value.length) {
        afGooglePlace.show({});
      }
    };



    var autocompleteService =new google.maps.places.AutocompleteService();
    ele.onkeyup =function(evt, params) {
      if(OPTS.stopTimeoutOnKeyup) {
        eventsFiring =true;   //update trigger; stop timeout
      }
      handleKeyup(evt, params);
    };

    // ele.onblur =function(evt, params) {
    //   var coords =afGooglePlace.getDropdownCoords(eleDropdown, {});
    //   console.log(coords);    //TESTING
    //   console.log(evt);
    //   afGooglePlace.hide({});
    // };

    ele.onfocus =function(evt, params) {
      handleFocus(evt, params);
    };

    //start timeout going
    timeoutTriggerEvents({});

  }
};

Template.afGooglePlace.helpers({
  //fix to avoid error for passed in object
  // - https://github.com/aldeed/meteor-autoform-bs-datepicker/issues/3
  // - https://github.com/aldeed/meteor-autoform-bs-datepicker/commit/3977aa69b61152cf8c0f731a11676b087d2ec9df
  atts: function() {
    var atts =EJSON.clone(this.atts);
    delete atts.opts;
    return atts;
  },
  classes: function() {
    return Session.get('afGooglePlaceClasses');
  }
});

Template.afGooglePlacePredictions.helpers({
  predictions: function() {
    return Session.get('afGooglePlacePredictions');
  }
});

Template.afGooglePlacePredictions.events({
  'click .lm-autoform-google-place-prediction-item': function(evt, template) {

    TIMEOUTHACK.trigJustSelectedVal =true;
    setTimeout(function() {
      TIMEOUTHACK.trigJustSelectedVal =false;
    }, TIMEOUTHACK.times.selectedVal);

    afGooglePlace.getPlace(ELES.input.value, this, {});
  }
});