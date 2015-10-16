/**

@param {Object} [atts.opts]
  @param {String} [type ='service'] Set to 'googleUI' to use the Google Place UI (will NOT work on all mobile devices, especially iOS with 3rd party keyboards)
  @param {Boolean} [stopTimeoutOnKeyup =false] Set to false to keep running the timeout that auto-triggers showing predictions for 3rd party iOS keyboards where the keyup event does not fire. For performance, this defaults to true to kill the timeout as soon as we get a keyup event. This usually works, however, if the user switches back and forth between a 3rd party keyboard and a regular one, this will cause the 3rd party keyboard to NOT work anymore since a keyup event was registered (on the regular keyboard). So if you want this to be foolproof - albeit worse for performance, set this to false.
  @param {Object} [googleOptions] The google autocomplete options, such as:
    @param {Array} [types =[]]
    @param {Object} [componentRestrictions ={}]
*/

var VAL ={};    //one per instid

var afGooglePlace ={

  updatePlace: function(templateInst, val, place, params) {
    var self =this;
    var loc ={
      lat: '',
      lng: '',
      geometry: {
        type: "Point",
        coordinates: [ 0,0 ]
      },
      fullAddress: val,
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      placeId: ''
    };
    
    if(place && place.geometry && place.geometry.location) {
      loc =self.parseGoogleAddressComponent(place.address_components, {});

      loc.lat =place.geometry.location.lat();
      loc.lng =place.geometry.location.lng();
      loc.geometry = {
        type: "Point",
        coordinates: [ place.geometry.location.lng(), place.geometry.location.lat() ]
      };
      loc.fullAddress =(place.formatted_address) ? place.formatted_address : "";
      loc.placeId =place.place_id;
    }

    // ele.googleplace('val', loc);
    // this.value =loc;
    var instid =templateInst.data.atts['data-schema-key'];
    VAL[instid] =loc;
    return VAL[instid];
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

  getPlace: function(templateInst, placePrediction, params) {
    var self =this;
    var placeService = new google.maps.places.PlacesService(templateInst.eles.googleAttribution);
    placeService.getDetails({placeId: placePrediction.place_id}, function(place, status) {
      if(status == google.maps.places.PlacesServiceStatus.OK) {
        var val =self.updatePlace(templateInst, placePrediction.description, place, {});
        templateInst.eles.input.value =val.fullAddress;
        templateInst.timeouthack.lastVal =templateInst.eles.input.value;   //update for next time
        self.hide(templateInst, {});
      }
      else {
        alert('google maps PlacesService error getting place with placeId: '+placeId);
      }
    });
  },

  /**
  Selects either the given prediction OR, if prediction is null or undefined
   tries to select the currently selected (keyboard) prediction
  */
  choosePrediction: function(templateInst, prediction) {
    templateInst.timeouthack.trigJustSelectedVal =true;
    setTimeout(function() {
      templateInst.timeouthack.trigJustSelectedVal =false;
    }, templateInst.timeouthack.times.selectedVal);

    if(!prediction) {
      var predictionsSelected =templateInst.predictionsSelected.get();
      var predictions =templateInst.predictions.get();
      prediction =predictions[predictionsSelected.index];
    }
    if(prediction) {
      afGooglePlace.getPlace(templateInst, prediction, {});
    }
  },

  /**
  @param {Object} options
    @param {String} input Element value
  @param {Object} params
    @param {Boolean} [noShow] True to NOT display predictions
    @param {Boolean} [setVal] True to also set the value (i.e. for init)
  */
  getPredictions: function(templateInst, options, params) {
    var self =this;
    templateInst.autocompleteservice.getPlacePredictions(options, function(predictions, status) {
      if(status != google.maps.places.PlacesServiceStatus.OK) {
        // alert(status);
        self.hide(templateInst, {});
        return;
      }
      else {
        self.updatePredictions(templateInst, predictions, params);
        if(params.setVal) {
          self.getPlace(templateInst, predictions[0], {});
        }
      }
    });
  },

  /**
  @param {Object} params
    @param {Boolean} [noShow] True to NOT show dropdown
  */
  updatePredictions: function(templateInst, predictions, params) {
    //add display key for tracking selected prediction for keyboard support
    predictions.map(function(prediction) {
      prediction.xDisplay ={
        selected: ''
      };
      return prediction;
    });
    //reset index
    var predictionsSelected =templateInst.predictionsSelected.get();
    predictionsSelected.index =-1;
    templateInst.predictionsSelected.set(predictionsSelected);

    templateInst.predictions.set(predictions);
    if(params.noShow ===undefined || !params.noShow) {
      this.show(templateInst, {});
    }
  },

  /**
  Handles (keyboard) up / down to change currently selected prediction in dropdown
  @param {String} change One of 'prev', 'next'
  */
  updatePredictionsSelected: function(templateInst, change, params) {
    var predictionsSelected =templateInst.predictionsSelected.get();
    var predictions =templateInst.predictions.get();
    var changed =false;
    if(change ==='prev' && predictionsSelected.index >0) {
      predictionsSelected.index--;
      changed =true;
    }
    else if(change ==='next' && predictionsSelected.index <(predictions.length-1)) {
      predictionsSelected.index++;
      changed =true;
    }
    if(changed) {
      templateInst.predictionsSelected.set(predictionsSelected);
      predictions.map(function(prediction, index) {
        if(index ===predictionsSelected.index) {
          prediction.xDisplay.selected ='selected';
        }
        else {
          prediction.xDisplay.selected ='';
        }
      });
      templateInst.predictions.set(predictions);
    }
  },

  hide: function(templateInst, params) {
    var classes =templateInst.classes.get();
    classes.predictions ='hidden';
    templateInst.classes.set(classes);
  },

  show: function(templateInst, params) {
    var classes =templateInst.classes.get();
    classes.predictions ='visible';
    templateInst.classes.set(classes);
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
    //will convert to display value later after set / extend opts
    return val;
  },
  valueOut: function() {
    var instid =this.attr('data-schema-key');
    return VAL[instid];
  }
});

Template.afGooglePlace.created =function() {
  this.autocompleteservice =new google.maps.places.AutocompleteService();
  this.timeouthack ={
    lastVal: '',
    trigJustSelectedVal: false,
    times: {
      keyup: 500,
      selectedVal: 1000   //must be LONGER than keyup timeout time
    },
    trigs: {
      keyup: false
    }
  };
  this.eles ={
    input: false,
    googleAttribution: false
  };
  this.opts ={};

  this.predictions =new ReactiveVar([]);
  this.predictionsSelected =new ReactiveVar({
    index: -1
  });
  this.classes =new ReactiveVar({
    predictions: 'hidden'
  });
};

Template.afGooglePlace.rendered =function() {
  var templateInst =this;
  //reset (any past instances)
  if(templateInst.timeouthack.trigs.keyup) {
    clearTimeout(templateInst.timeouthack.trigs.keyup);
  }

  var optsDefault ={
    type: 'service',
    // stopTimeoutOnKeyup: true
    stopTimeoutOnKeyup: false
  };
  var xx;
  templateInst.opts =EJSON.clone(this.data.atts.opts);
  if(templateInst.opts ===undefined) {
    templateInst.opts =EJSON.clone(optsDefault);
  }
  else {
    //extend
    for(xx in optsDefault) {
      if(templateInst.opts[xx] ===undefined) {
        templateInst.opts[xx] =optsDefault[xx];
      }
    }
  }

  // var self =this;
  var ele =this.find('input');

  //temporarily set value (just need it to be an object; will set properly later)
  var val =ele.value;
  if(typeof(val) ==='string') {
    val ={
      fullAddress: val
    };
  }
  var instid =templateInst.data.atts['data-schema-key'];
  VAL[instid] =val;

  templateInst.eles.input =ele;
  templateInst.eles.googleAttribution =this.find('div.lm-autoform-google-place-attribution');
  var eleDropdown =this.find('div.lm-autoform-google-place-predictions');
  var types =[];    //either [blank] or one or more of: 'establishment', 'geocode'
  var componentRestrictions ={};
  var options = {
    //bounds: defaultBounds,
    types: types,
    componentRestrictions: componentRestrictions
  };
  if(templateInst.opts.googleOptions !==undefined) {
    //extend
    for(xx in templateInst.opts.googleOptions) {
      options[xx] =templateInst.opts.googleOptions[xx];
    }
  }

  if(templateInst.opts.type =='googleUI') {
    //standard autocomplete
    var autocomplete = new google.maps.places.Autocomplete(templateInst.eles.input, options);

    google.maps.event.addListener(autocomplete, 'place_changed', function() {
      afGooglePlace.updatePlace(templateInst, templateInst.eles.input.value, autocomplete.getPlace(), {});
    });
  }
  else {
    //autocompleteservice (custom)
    // http://stackoverflow.com/questions/14414445/google-maps-api-v3-cant-geocode-autocompleteservice-predictions
    // https://developers.google.com/maps/documentation/javascript/examples/place-details
    // http://stackoverflow.com/questions/14343965/google-places-library-without-map

    //3rd party iOS mobile keyboards do NOT fire the events properly so we need to do a timeout. To handle this, we'll auto run the event handlers with a periodic timeout but then if we DO get an event, we'll stop the timeout since we have now "detected" the keyboard is not 3rd party (or at least that it's working)
    var eventsFiring =false;    //default - once we get an event, we'll reset this
    templateInst.timeouthack.lastVal =templateInst.eles.input.value;   //save to compare to track if a change happened

    var timeoutTriggerEvents =function(params) {
      templateInst.timeouthack.trigs.keyup =setTimeout(function() {
        if(!eventsFiring) {
          if(!templateInst.timeouthack.trigJustSelectedVal) {
            handleKeyup(false, {});
          }
          timeoutTriggerEvents({});   //call again
        }
      }, templateInst.timeouthack.times.keyup);
    };

    var handleKeyup =function(evt, params) {
      // options.input =ele.value;    //does not work - init / instance id issue
      options.input =templateInst.eles.input.value;
      if(!options.input.length) {
        afGooglePlace.hide(templateInst, {});
      }
      else {
        if(templateInst.eles.input.value !==templateInst.timeouthack.lastVal) {
          afGooglePlace.getPredictions(templateInst, options, {});
          templateInst.timeouthack.lastVal =templateInst.eles.input.value;   //update for next time
        }
      }
    };

    var handleFocus =function(evt, params) {
      if(templateInst.eles.input.value.length) {
        afGooglePlace.show(templateInst, {});
      }
    };

    templateInst.eles.input.onkeydown =function(evt, params) {
      if(evt.keyCode ===13) {
        return false;
      }
    };

    templateInst.eles.input.onkeyup =function(evt, params) {
      //up arrow
      if(evt.keyCode ===38) {
        afGooglePlace.show(templateInst, {});
        afGooglePlace.updatePredictionsSelected(templateInst, 'prev', {});
      }
      //down arrow
      else if(evt.keyCode ===40) {
        afGooglePlace.show(templateInst, {});
        afGooglePlace.updatePredictionsSelected(templateInst, 'next', {});
      }
      //enter
      else if(evt.keyCode ===13) {
        afGooglePlace.choosePrediction(templateInst, null);
      }
      //escape
      else if(evt.keyCode ===27) {
        afGooglePlace.hide(templateInst, {});
      }
      else {
        if(templateInst.opts.stopTimeoutOnKeyup) {
          eventsFiring =true;   //update trigger; stop timeout
        }
        handleKeyup(evt, params);
      }
    };

    // templateInst.eles.input.onblur =function(evt, params) {
    //   var coords =afGooglePlace.getDropdownCoords(eleDropdown, {});
    //   console.log(coords);    //TESTING
    //   console.log(evt);
    //   afGooglePlace.hide(templateInst, {});
    // };

    templateInst.eles.input.onfocus =function(evt, params) {
      handleFocus(evt, params);
    };

    //start timeout going
    timeoutTriggerEvents({});

    //init
    if(templateInst.eles.input.value && templateInst.eles.input.value.length) {
      options.input =templateInst.eles.input.value;
      afGooglePlace.getPredictions(templateInst, options, {noShow:true, setVal:true});
    }
    else {
      afGooglePlace.hide(templateInst,{});  
    }

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
    return Template.instance().classes.get();
  }
});

Template.afGooglePlace.helpers({
  predictions: function() {
    return Template.instance().predictions.get();
  }
});

Template.afGooglePlace.events({
  'click .lm-autoform-google-place-prediction-item': function(evt, template) {
    afGooglePlace.choosePrediction(template, this);
  }
});