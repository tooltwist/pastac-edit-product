## Getting Started
This module is treated as a standard Angular 1 component. To use it on an Angular page:

1. Download the component into your project

    ```shell
    $ bower install pastac-edit-product --save  
    $ bower install bootstrap-toggle --save  
    ```

1. Include the component in your page

    ```pug
    script(src="bower_components/jquery/dist/jquery.js" type="text/javascript")  
    script(src="bower_components/angular/angular.min.js")  
    script(src="bower_components/bootstrap/dist/js/bootstrap.js" type="text/javascript")  
    script(src="bower_components/pastac-edit-product/dist/pastac-edit-product.js" type="text/javascript")  
    ```

1. Use the component in your Pug files (formerly called Jade)  

    ```pug
    pastac-edit-product(jwt="jwt" handler="handler")
    ```

    In most cases this component will be used on a page that uses the `pastac-login` component, which will
    set `currentUser`, `currentUser.isAdmin`, and `jwt`.

    Optional parameters include `supplier-type`, which is used to replace the word 'Supplier', and `template`
    which can be your custom version of the component template.


1. Invoke the module in your Angular initialization

    ```javascript
    var module = angular.module('myApp', [ 'pastac-edit-product' ]);  
    ...

    $scope.handler = {
      onAddSupplier: function(successResponse, errorResponse) {
        if (successResponse) {
          var supplierId = successResponse.supplierId;
          alert('New supplier is ' + supplierId)
        }
      }
    }

    ```


## Cloning this component to create your own component
PastaC components are intended to be easy to clone and modify, so developers can create new components,
which will also be easy to clone and modify. With luck this will allow the community to evolve and
mature the avilable components without each developer having to repeat the work of those before them.

The [pastac\-example\-component](https://github.com/tooltwist/pastac\-example\-component) is the great granddad
of most PastaC components. If you wish to create a totally new component, but don't have a relevant
component to base it upon, then download this project from Github and clone it.

Cloning this component is as simple as running a script provided with this component, following these steps:

1. Download the full component to source from Github, not the published version from bower.

2. Run the provided cloning script:

    ```shell
    $ cd bower_components
    $ pastac-existing-component/clone-this-component.js new-component-name
    $ cd new-component-name
    $ gulp serve
    ```

You can then (a) check that the clone worked correctly, by interacting with the component on a test page,
and (b) start development on modifying the component.

## Why Clone?

Angular components are not particularly hard to create, however there is a lot of supporting tools, code
and scripts required to properly test, document and deploy the component. By cloning, you get all the
following immediately:

- a working Angular component
- that uses [Pug](https://pugjs.org) and [Sass](http://sass-lang.com/)
- uses [Gulp](gulpjs.com) during development and to deploy
- live browser reload during development, using [BrowserSync](https://browsersync.io/docs/gulp)
- Uses [Bower](https://bower.io/) and [Npm](https://www.npmjs.com) to download dependencies
- a test page for manual testing
- [Karma](https://karma-runner.github.io) is used to drive unit tests run within an actual browser
- generated documentation of SASS/CSS styles with [Sassdoc](sassdoc.com/)
- Documenting the component using [Slate](https://github.com/lord/slate)


## Contributing
To develop this component or create a derived component, clone the Github repository into the bower directory.

This project is built using Gulp.

- To get started, run `bower install` and `gulp install` to prepare the component for development.

- Clean up using `gulp clean`.
- To test the component using test/index.html run `gulp serve`.
- To run unit tests using Karma run `gulp test`.
- The `gulp testloop` command waits for files to change and re-runs these tests automatically.

See CONTRIBUTING.md for more details.
