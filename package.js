Package.describe({
  name: 'lukemadera:autoform-googleplace',
  version: '0.0.5',
  // Brief, one-line summary of the package.
  summary: 'Google Places Autocomplete input (without map). Returns an object with formatted address components',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.use('templating@1.0.0');
  api.use('blaze@2.0.0');
  api.use('aldeed:autoform@4.0.0');
  api.addFiles([
    'lukemadera:autoform-googleplace.html',
    'lukemadera:autoform-googleplace.css',
    'lukemadera:autoform-googleplace.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('lukemadera:autoform-googleplace');
  api.addFiles('lukemadera:autoform-googleplace-tests.js');
});
