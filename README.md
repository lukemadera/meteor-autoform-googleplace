# lukemadera:autoform-googleplace

An add-on Meteor package for aldeed:autoform. Provides a single custom input type, "googleplace", which renders an input that is given Google Places Autocomplete functionality (but without any map; just a pure input box) and that returns an object with `fullAddress`, `lat`, `lng`, `street`, `city`, `state`, `zip`, `country`.
https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete

This DOES work when wrapped in Phonegap / Cordova AND with iOS8 and 3rd party keyboards (which the default GoogleUI places autocomplete does NOT)!
More info:
- on iOS Cordova (only happens when wrapped in an app it seems), the autocomplete results can not be selected (a fastclick timing issue it seems)
  - http://stackoverflow.com/questions/9972080/cant-tap-on-item-in-google-autocomplete-list-on-mobile
- on iOS 3rd party keyboards (e.g. Swift), the autocomplete results do not show up at all as the (keyup) events do not fire
  - http://stackoverflow.com/questions/26080368/ios-8-3rd-party-keyboards-dont-register-javascript-jquery-keyup-keypress-keyd


## Demo

[Demo](http://lukemadera-packages.meteor.com/af-googleplace-basic)

[Source](https://github.com/lukemadera/meteor-packages/tree/master/autoform-googleplace/basic)


## Dependencies

- aldeed:autoform
- Google Maps Places script (put in your entry HTML file)
  - `<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?libraries=places"></script>`


## Installation

In a Meteor app directory:
```bash
meteor add lukemadera:autoform-googleplace
```


## Usage

Specify "googleplace" for the `type` attribute of any input and set the SimpleSchema to be an object:

```html
{{> afQuickField name="address" type="googleplace" opts=optsGoogleplace}}
```

In the schema, which will then work with a `quickForm` or `afQuickFields`:

```js
AddressSchema =new SimpleSchema({
  fullAddress: {
    type: String
  },
  lat: {
    type: Number,
    decimal: true
  },
  lng: {
    type: Number,
    decimal: true
  },
  geometry: {
    type: Object,
    blackbox: true
  },
  placeId: {
    type: String
  },
  street: {
    type: String,
    max: 100
  },
  city: {
    type: String,
    max: 50
  },
  state: {
    type: String,
    regEx: /^A[LKSZRAEP]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]$/
  },
  zip: {
    type: String,
    regEx: /^[0-9]{5}$/
  },
  country: {
    type: String
  }
});

PropertySchema =new SimpleSchema({
  address: {
    type: AddressSchema,
    optional: true
  }
});

Template.autoformGoogleplaceBasic.helpers({
  optsGoogleplace: function() {
    return {
      // type: 'googleUI',
      // stopTimeoutOnKeyup: false,
      // googleOptions: {
      //   componentRestrictions: { country:'us' }
      // }
    }
  }
});
```


### Options

See the [documentation at the top of the javascript file](https://github.com/lukemadera/meteor-autoform-googleplace/blob/master/lukemadera_autoform-googleplace.js) for options you can pass in to customize.

