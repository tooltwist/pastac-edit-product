// Karma configuration
// Generated on Wed May 10 2017 08:36:29 GMT+0800 (PHT)

module.exports = function(config) {
  config.set({

    /*
     *  In order to access the HTML file specified in templateUrl, we need
     *  to load it using ng-html2js, which loads it as a module into the
     *  file cache.
     *
     *  See http://busypeoples.github.io/post/testing-angularjs-directives/
     *  See http://daginge.com/technology/2013/12/14/testing-angular-templates-with-jasmine-and-karma/
     */
    preprocessors: {
        'dist/**/*.html': ['ng-html2js']
    },

    // we will be accessing this by module name later on in Jasmine
    ngHtml2JsPreprocessor: {
        moduleName: 'myTemplates'
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    //basePath: '/Development/projects/drinkcircle/drinkcircle-static-raw/bower_components/pastac-edit-product',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [

      // <script src="../bower_components/jquery/dist/jquery.js" type="text/javascript"></script>
      // <script src="../bower_components/angular/angular.min.js"></script>
      // <script src="../bower_components/bootstrap/dist/js/bootstrap.js" type="text/javascript"></script>
      //
      // <script src="../dist/pastac-edit-product.js" type="text/javascript"></script>


    	//'bower_components/angular-unstable/angular.js',
    	'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
    	'bower_components/angular-mocks/angular-mocks.js',
      //'dist/pastac-edit-product.js',
      {pattern: 'dist/pastac-edit-product.js', included: true, served: true, watched: true, nocache: true},
      //'dist/*.html',
      //'dist/*.css',
    	'test/spec/example.js',
      //{pattern: 'dist/pastac-edit-product.html', included: false, served: true, watched: true, nocache: true}
      'dist/**/*.html'
    ],


    // list of files to exclude
    exclude: [
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
