'use strict';

angular.module('pastac-edit-product', [ ])

.component('pastacEditProduct', {
  controller: PastacEditProductController,
  controllerAs: 'ctrl',
  bindings: {
    // Bind parameters from the HTML element that invokes this
    // See https://docs.angularjs.org/guide/component
    handler: '<',       // object with callbacks
    jwt: '<',           // The JSON web token
    productId: '<',
    productButton: '@',  // Label to display on the product button
    variantButton: '@',  // Label to display on the variant button
    template: '@'
  },

  templateUrl: function($element, $attrs) {
    var t = '/bower_components/pastac-edit-product/dist/pastac-edit-product.html';
    if ($attrs.template) {
      t = $attrs.template;
    }
    //console.log('template=>' + t);
    return t;
  },

});


function PastacEditProductController($scope, $timeout, $http, $compile, Upload) {
  var ctrl = this;
  var _productId = null;

  var LABEL = 'Product List';
  const PRODUCT_VIEW = 'product';
  const VARIANT_VIEW = 'product_variant';
  const PRICING_VIEW = 'pricing';
  const PRICING_QTY_VIEW = 'pricing_quantity';
  const PV_IMAGE_VIEW = 'product_variant_image';
  const CATEGORY_VIEW = 'category';
  const PRODUCT_CATEGORIES_VIEW = 'product_categories';

  var PRODUCT_METADATA = null;
  var VARIANT_METADATA = null;
  var PRICING_METADATA = null;
  var PRICING_QTY_METADATA = null;
  var PV_IMAGE_METADATA = null;
  var PRODUCT_CATEGORIES_METADATA = null;



  ctrl.teaContext = {
    $scope: $scope,
    $http: $http,
    $timeout: $timeout,
    $compile: $compile,
    TEASERVICE_HOST: TEASERVICE_HOST,
    TEASERVICE_PORT: TEASERVICE_PORT,
    TEASERVICE_VERSION: TEASERVICE_VERSION,
    TEASERVICE_ACCESS_TOKEN: TEASERVICE_ACCESS_TOKEN,
    STORE_ID: 6
  };



  ctrl.$onInit = function() {

  };//- $onInit




  // Called when the productId passed to this component changes
  ctrl.$onChanges = function(changesObj) {
    console.log('changed', changesObj);

    // See if the user wants to be notified of changes
    var callback = (ctrl.handler && ctrl.handler.onAddSupplier) ? ctrl.handler.onAddSupplier : null;

    if (ctrl.productId != _productId) {
      console.log('SupplierId has changed');
      _productId = ctrl.productId;

      loadProduct(ctrl.jwt, ctrl.productId, null);

      loadCategoriesForProduct(ctrl.productId);
    }
  }//- $onChanges




  // Called when the product button is pressed
  ctrl.doProductButton = function(product) {
    if (ctrl.handler && ctrl.handler.onProductButton) {
      ctrl.handler.onProductButton(product);
    }
  }//- doProductButton()



  // Called when the variant button is pressed
  ctrl.doVariantButton = function(product, variant) {
    if (ctrl.handler && ctrl.handler.onVariantButton) {
      ctrl.handler.onVariantButton(product, variant);
    }
  }//- doVariantButton()



  /*
   *  Save the product details.
   */
  ctrl.doSave = function() {
    console.log('doSave()');
    TooltwistViews.save(ctrl.teaContext, PRODUCT_METADATA, 'record', ctrl.product, function(err, reply) {
      console.log('save returned', err, reply);
      if (err) {
        console.log('Error saving view ' + PRODUCT_VIEW + '/record', err);
        return;
      }

      /*
       *  Save the product variants
       */
      (function saveNextVariant(index) {
        // if (index >= 1) {
        if (index >= ctrl.variants.length) {
          // Finished
          return;
        }
        var variant = ctrl.variants[index];
        console.log('Save variant ' + index + ':', variant);
        // alert('next variant')
        // saveNextVariant(index + 1);
    //return;
        TooltwistViews.save(ctrl.teaContext, VARIANT_METADATA, 'record', variant, function(err, reply) {
          console.log('save returned', err, reply);
          if (err) {
            console.log('Error saving view ' + VARIANT_VIEW + '/record', err);
            return;
          }

          setTimeout(function() {
            // timeout prevents stack overflow.
            saveNextVariant(index + 1);
          }, 1);
        });//- TooltwistViews.save variant

      })(0); // Start saveNextVariant
    });//- TooltwistViews.save product

  }//- doSave()



  // Called when a product is selected.
  ctrl.doSelectProduct = function(product) {
    console.log('ctrl.selectProduct()');

    if (ctrl.handler && ctrl.handler.onSelectProduct) {
      ctrl.handler.onSelectProduct(product.productId);
    }
  }//- selectProduct()



  ctrl.doSelectSpecificationOption = function(variant, category, specificationType) {
    console.log('doSelectSpecificationOption()');
    console.log('specificationType=', specificationType);
    console.log('selectedOption=', specificationType._selectedOption);
    saveSpecificationValue(variant, specificationType, specificationType._selectedOption.category_specification_option_id);

    // If we have multiple categories for this variant, some other category
    // might have the same specification type. For example "Country". In that
    // case, we'll want to copy and save that value as well.
    variant._specTypesOptionsAndValues.categories.forEach(function(otherCategory) {
      if (otherCategory.category_id != category.category_id) {
        // alert('Different category ' + otherCategory.category_name);
        otherCategory.category_specification_types.forEach(function(otherSpecificationType) {
          if (otherSpecificationType.specification_type_id == specificationType.specification_type_id) {
            // alert('Has the same specType ' + otherSpecificationType.name);
            // Find the option with the same value
            otherSpecificationType.options.forEach(function(opt) {
              if (opt.value == specificationType._selectedOption.value) {
                // Same value is available
                otherSpecificationType._selectedOption = opt;
                saveSpecificationValue(variant, otherSpecificationType, opt.category_specification_option_id);
              }
            })
          }
        });
      }

    });
  }



  /*
   *  Set an integer specification value.
   */
  ctrl.doSetSpecificationValue = function(variant, category, specificationType) {
    console.log('doSetSpecificationValue()');
    console.log('specificationType=', specificationType);
    console.log('selectedOption=', specificationType._currentValue);

    var value = specificationType._currentValue;

    saveSpecificationValue(variant, specificationType, value);

    // If we have multiple categories for this variant, some other category
    // might have the same specification type. For example "Country". In that
    // case, we'll want to copy and save that value as well.
    variant._specTypesOptionsAndValues.categories.forEach(function(cat) {
      if (cat.category_id != category.category_id) {
        // alert('Different category ' + cat.category_name);
        cat.category_specification_types.forEach(function(otherSpecificationType) {
          if (otherSpecificationType.specification_type_id == specificationType.specification_type_id) {
            // alert('Has the same specType ' + otherSpecificationType.name);
            otherSpecificationType._currentValue = specificationType._currentValue;
            saveSpecificationValue(variant, otherSpecificationType, value);
          }
        });
      }
    });
  }



  function saveSpecificationValue(variant, specificationType, value) {

    var TEASERVICE_APIKEY = '12345';
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/' + TEASERVICE_APIKEY + '/productSpecifications';
    var params = {
      product_variant_id: variant.product_variant_id,
      category_specification_type_id: specificationType.category_specification_type_id
    };
    switch (specificationType.data_type) {
      case 'TXT': params.text = value; break;
      case 'INT': params.int = value; break;
      case 'DEC': params.dec = value; break;
      case 'OPT': params.category_specification_option_id = value; break;
    }
    // console.log('---------------------');
    // console.log('Save product_variant_specification_value:', params);
    // console.log('URL=' + url);
    // console.log('PARAMS=', params);
    var req = {
      method: 'POST',
      url: url,
      headers: {
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",
        "version": "2.0.0"
      },
      data: params
    };
    $http(req).then(function(response) {
      // All okay
      // console.log('updated');
      $timeout(function() { ctrl.errmsg = null; }, 3000);
    }, TEAServiceError);

  }


  /*
   *  Return a list of categories that match the category autocomplete string.
   */
  ctrl.loadCategoryTags = function(query) {
    var matches = [ ];
    query = query.toUpperCase().trim();
    ctrl.categories.forEach(function(category) {
      var name = category.name.toUpperCase();
      var pos = name.indexOf(query);
      if (pos >= 0) {
        matches.push({
          category_id: category.category_id,
          text: category.name
        });
      }
    });
    return matches;
  };



  // Call the server to remove a category
  ctrl.doRemoveCategory = function(tag) {
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/delProductCategory';
    var params = {
      product_id: ctrl.productId,
      category_id: tag.category_id
    };
    var req = {
      method: 'POST',
      url: url,
      headers: {
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",
        "version": "2.0.0"
      },
      data: params
    };
    $http(req).then(function(response) {
      // All okay. Reload the specifications
      ctrl.variants.forEach(function(variant) {
        loadSpecTypesOptionsAndValuesForVariant($http, ctrl.teaContext, variant)
      });
    }, TEAServiceError);
  }



  // Call the server to add a category
  ctrl.doAddCategory = function(tag) {
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/putProductCategory';
    var params = {
      product_id: ctrl.productId,
      category_id: tag.category_id
    };
    var req = {
      method: 'POST',
      url: url,
      headers: {
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",
        "version": "2.0.0"
      },
      data: params
    };
    $http(req).then(function(response) {
      // All okay. Reload the specifications
      ctrl.variants.forEach(function(variant) {
        loadSpecTypesOptionsAndValuesForVariant($http, ctrl.teaContext, variant)
      });
    }, TEAServiceError);
  };//- ctrl.doAddCategory()




  function loadProduct(jwt, productId, callback/*(successResponse,errorResponse)*/) {
    console.log('loadProduct:', productId);

    var params = {
      withReferences: true,
      where: {
        product_id: productId
      }
    }
    TooltwistViews.select(ctrl.teaContext, PRODUCT_VIEW, params, function selected(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + PRODUCT_VIEW, err);
        return;
      }
      PRODUCT_METADATA = metadata;
      console.log('PRODUCT_METADATA=', metadata);
      console.log('data=', data);
      console.log('metadata=', metadata);

      //ctrl.supplier2_list = data;
      ctrl.product = (data.length > 0) ? data[0] : null;
      ctrl.viewLabel = metadata.label;
      if (ctrl.handler && ctrl.handler.onLoadProduct) {
        ctrl.handler.onLoadProduct(ctrl.product);
      }

      /*
       *  Initialize ckeditor, using angular-ckeditor.
       *  See https://github.com/lemonde/angular-ckeditor
       *  The Toolbar can be configured using the toolbar configurator utility
       *  at bower_components/ckeditor/samples/toolbarconfigurator/index.html
       */
      ctrl.ckeditorOptions = {
          language: 'en'
      };
      ctrl.ckeditorOptions.toolbarGroups = [
    		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
    		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
    		{ name: 'links', groups: [ 'links' ] },
    		{ name: 'insert', groups: [ 'insert' ] },
    		{ name: 'forms', groups: [ 'forms' ] },
    		{ name: 'tools', groups: [ 'tools' ] },
    		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
    		{ name: 'others', groups: [ 'others' ] },
    		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
    		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
    		{ name: 'styles', groups: [ 'styles' ] },
    		{ name: 'colors', groups: [ 'colors' ] },
    		{ name: 'about', groups: [ 'about' ] }
    	];
    	ctrl.ckeditorOptions.removeButtons = 'Underline,Subscript,Superscript,Strike,Maximize,Image,Table,HorizontalRule,SpecialChar,Link,Unlink,Anchor,Scayt,PasteFromWord,PasteText,Source,Styles,Format,About,Blockquote';

      // Provide style options for displaying the list and record.
      var displayOptions = {
        listModel: 'supplier2_list',
        listTableClasses: 'table-condensed table-hover',
        listClickFunction: 'supplier2_listClick',
        recordScope: 'ctrl',
        recordModel: 'product',
      };

      // // Add fields to the DOM for the list
      // var listDiv = $('#supplier2_listDiv');
      // var fields = TooltwistViews.fieldsForMode(metadata, 'list');
      // var html = TooltwistViews.htmlForAngular_list(metadata, fields, displayOptions);
      // listDiv.html(html);
      // // Ask Angular to bind our new DOM elements onto it's models.
      // $compile(listDiv)($scope);

      // Add fields to the DOM for the record
      var recordDiv = $('#supplier2_recordDiv');
      var fields = TooltwistViews.fieldsForMode(metadata, 'record');
      var html = TooltwistViews.htmlForAngular_edit(metadata, fields, displayOptions);
      console.log('html=', html);
      recordDiv.html(html);
      // Ask Angular to bind our new DOM elements onto it's models.
      $compile(recordDiv)($scope);

      // If this is an admin user, show admin-only fields.
      // if ($scope.currentUser.isAdmin) {
      if (true) {//ZZZZ
        console.log('WARNING, Commission rate should only be editable by admin');
        // Add fields to the DOM for the record
        var recordDiv = $('#supplier2_adminDiv');
        var fields = TooltwistViews.fieldsForMode(metadata, 'admin');
        var html = TooltwistViews.htmlForAngular_edit(metadata, fields, displayOptions);
        recordDiv.html(html);
        // Ask Angular to bind our new DOM elements onto it's models.
        $compile(recordDiv)($scope);
      }

      // Set the current record.
      // Show the single record pane.
      // Set the label for the pane.
      // $scope.supplier2_record = record;
console.log('Set record:', ctrl.product);
      // $scope.supplier2_showListPane = false;
      ctrl.headingForRecordPane = (ctrl.product) ? ctrl.product.name : '';

      // Perhaps load variants for this product
      // if (ctrl.showProducts) {
        loadVariantsForProduct($scope, ctrl.teaContext, ctrl.product.product_id);
      // }
    });
  }//- loadProduct()



  /*
   *  Load the list of product variants for a product.
   */
  function loadCategoriesForProduct(productId) {
    console.log('loadCategoriesForProduct(' + productId + ')');

    // Load all the category types, so we can use them in autocomplete.
    var params = { }
    TooltwistViews.select(ctrl.teaContext, CATEGORY_VIEW, params, function(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + CATEGORY_VIEW, err);
        return;
      }
      VARIANT_METADATA = metadata;

      console.log('Loaded all categories', data);
      ctrl.categories = data;

      // Sort the list
      ctrl.categories.sort(function(rec1, rec2) {
        var name1 = rec1.name.toUpperCase();
        var name2 = rec2.name.toUpperCase();
        if (name1 == 'OTHER') name1 = 'Z'; // Place "Other" last.
        if (name2 == 'OTHER') name2 = 'Z';
        if (name1 < name2) return -1;
        if (name1 > name2) return 1;
        return 0;
      })

      // Now load the product <--> category mapping.
      var params = {
        withReferences: true,
        where: {
          product_id: productId
        }
      }
      TooltwistViews.select(ctrl.teaContext, PRODUCT_CATEGORIES_VIEW, params, function(err, data, metadata) {
        if (err) {
          console.log('Error selecting view ' + PRODUCT_CATEGORIES_VIEW, err);
          return;
        }
        PRODUCT_CATEGORIES_METADATA = metadata;

        // Convert this to a list for category tags
        ctrl.categoryTags = [ ];
        data.forEach(function(prodcat) {

          // Find the category name
          ctrl.categories.forEach(function(category) {
            if (category.category_id == prodcat.category_id) {
              ctrl.categoryTags.push({
                category_id: category.category_id,
                text: category.name
              });
            }
          })
        })
      });
    });
  }


  /*
   *  Load the list of product variants for a product.
   */
  function loadVariantsForProduct($scope, context, productId) {
    console.log('loadVariantsForProduct(' + productId + ')');

    /*
     *  Select the product_variants for this product.
     */
     var params = {
       withReferences: true,
       where: {
         product_id: ctrl.product.product_id
       }
     }
    TooltwistViews.select(context, VARIANT_VIEW, params, function(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + VARIANT_VIEW, err);
        return;
      }
      VARIANT_METADATA = metadata;

      // Use this product variant data
      ctrl.variants = data;
      // if ($scope.productVariant_record && $scope.productVariant_record.product_id != $scope.product.product_id) {
      //   $scope.productVariant_record = null;
      // }

      console.log('product_variant data=', data);
      console.log('product_variant metadata=', metadata);

      // If we have no variants, let's create the first right now.
      if (ctrl.variants.length == 0) {
        alert('Creating initial variant for this product');
        var variant = {
          product_id: ctrl.product.product_id,
          is_deleted: 0,
          name: ctrl.product.name,
          components_qty: 1,
          is_featured_product: 0,
          is_free: 0,
          is_approved: 0
        };
        TooltwistViews.save(ctrl.teaContext, VARIANT_METADATA, 'record', ctrl.product, function(err, reply) {
          console.log('save returned', err, reply);
          if (err) {
            console.log('Error saving view ' + VARIANT_METADATA + '/record', err);
            return;
          }
          variant.product_variant_id = reply.data.newId;
          ctrl.variants = [ variant ];
          variant._productVariantImage_list = [ ];
          variant._productPricing_list = [ ];
          loadSpecTypesOptionsAndValuesForVariant($http, context, variant)
        });
      }


      // Provide style options for displaying the list and record.
      // var displayOptions = {
      //   //prefix: 'productVariant',
      //   listModel: 'productVariant_list', // in $scope
      //   recordScope: 'ctrl', // in $scope
      //   recordModel: 'variant', // in $scope
      //   listClickFunction: 'productVariant_listClick', // in $scope
      //   listTableClasses: 'table-condensed table-hover',
      // };

      // Load details for the product variants
      ctrl.variants.forEach(function(variant) {
        //alert('variant is ' + variant.product_variant_id)
        loadImagesForVariant(variant)
        loadPricesForVariant(variant)
        loadSpecTypesOptionsAndValuesForVariant($http, context, variant)
      });
      if (ctrl.handler && ctrl.handler.onLoadVariants) {
        ctrl.handler.onLoadVariants(data);
      }
    });
  }//- loadVariantsForProduct()





  /*
   *  Load the prices into a product variant.
   */
  function loadPricesForVariant(variant) {

    /*
     *  The pricing table provides various rules, based upon
     *    product (scope=P)
     *    product variant (scope=V)
     *    order value (scope=OVO)
     *
     *  The rules can be:
     *    Quantity based (type=BRKQTY)
     *    Discount amount (type=DSCAMT)
     *    Discount percentage (type=DSCPCT)
     *
     *
     *  In this component, we only support Product Variant scope, with Break on Quantity.
     *
     *  Steps:
     *    1. See if there is a pricing record for this product variant.
     *    2. If there is, select the pricing quantity records.
     */

    // Create a store of the json for objects, so we can compare if they've changed and need to be saved.
    // Remember numerics as strings, because they'll be compared later to strings.
    // $scope.originalPricingValues = new OriginalValues();
    // record.last_price = ''+record.last_price;
    // record.wholesale_price = ''+record.wholesale_price;
    // record.manufacturer_price = ''+record.manufacturer_price;
    //
    // $scope.originalPricingValues.remember('variant-'+record.product_variant_id, record);


    /*
     *  Select the 'pricing' and 'pricing_qty' records for this product variant
     */
     var params = {
       //withReferences: false,
       where: {
         product_variant_id: variant.product_variant_id,
         scope: 'V' // On Product Variant
       }
     }
    TooltwistViews.select(ctrl.teaContext, PRICING_VIEW, params, function(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + PRICING_VIEW, err);
        return;
      }

      // Use this product variant data
      // We'll display these manually, so don't need metadata
      PRICING_METADATA = metadata;
      console.log('pricing data=', data);
      variant._productPricing_list   = data;

      // Remember the original values
      // $scope.productPricing_list.forEach(function(pricing) {
      //   var key = 'pricing-' + pricing.pricing_id;
      //   $scope.originalPricingValues.remember(key, pricing);
      // });


      // Get the pricing_ids for any 'break quantity' pricing rules.
      var pricing_id = '';
      var sep = '';
      variant._productPricing_list.forEach(function(price) {
        if (price.type == 'BRKQTY') {
          pricing_id += sep + price.pricing_id;
          sep = ',';
          price._pricingQty = [ ];
        }
      });
      if (pricing_id == '') {

        // There are no 'break quantity' pricing records, so tell angular we are done.
        // return context.$timeout(function(){ $apply(); }, 10);
        return;
      } else {

        /*
         *  Load the pricing_qty records for the 'break quantity' pricing records.
         */
        TooltwistViews.select(ctrl.teaContext, PRICING_QTY_VIEW, { where:{ pricing_id: pricing_id } }, function(err, data, metadata) {
          if (err) {
            console.log('Error selecting view ' + PRICING_QTY_VIEW, err);
            return;
          }
          PRICING_QTY_METADATA = metadata;
          console.log('pricing_quantity selected' , data);


          // Patch the pricing_qty records into the pricing records.
          var pricingQty_list = data;
          pricingQty_list.forEach(function(pq) {
            // Find the pricing record. The list is usually one long, so we can be lazy.
            variant._productPricing_list.forEach(function(price) {
              if (price.pricing_id == pq.pricing_id) {
                price._pricingQty.push(pq);
              }
            });
          });// next pq


          // // Remember the original pricing_quantity values
          // $scope.productPricing_list.forEach(function(pricing) {
          //   pricing._pricingQty.forEach(function(pq) {
          //     var key = 'pricingQty-' + pq.pricing_quantity_id;
          //     $scope.originalPricingValues.remember(key, pq);
          //   });
          // });


          // Finished - tell Angular we are done.
          //return context.$timeout(function(){ $apply(); }, 10);
        });
      }

      //console.log('pricing metadata=', metadata);




      //$scope.productVariant_viewLabel = metadata.label;

      // Provide style options for displaying the list and record.
      /*var displayOptions = {
        //prefix: 'productVariant',
        listModel: 'productVariantImage_list', // in $scope
        //recordModel: 'productVariantImage_record', // in $scope
        //listClickFunction: 'productVariant_listClick', // in $scope
        //listTableClasses: 'table-condensed table-hover',
      };

      // Add fields to the DOM for the list
      var fields = TooltwistViews.fieldsForMode(metadata, 'list');
      var html = TooltwistViews.htmlForAngular_list(metadata, fields, displayOptions);
      // Update the DOM and get Angular to bind our new DOM elements onto it's models.
      var listDiv = $('#productVariantImage_listDiv');
      listDiv.html(html);
      $compile(listDiv)($scope);*/

    });// select
  }//- loadPricesForVariant


  /*
   *  Load the images for a product variant.
   */
  function loadImagesForVariant(variant) {
    /*
     *  Select the product_variant_image records for this product_variant.
     */
    TooltwistViews.select(ctrl.teaContext, PV_IMAGE_VIEW, {
      withReferences: false,
      where: {
        product_variant_id: variant.product_variant_id
      }
    }, function(err, data, metadata) {
      if (err) {
        console.log('Error selecting view ' + PV_IMAGE_VIEW, err);
        return;
      }
      PV_IMAGE_METADATA = metadata;

      // Use this image list

      // console.log('------------------');
      // console.log('------------------');
      // console.log('------------------');
      // console.log('------------------');
      variant._productVariantImage_list = [ ];
      var cl = null;
      data.forEach(function(image) {
        if (!image.image_path) {
          // Not loaded properly, or yet.
          return;
        }

        console.log('++++++++++\n++++++++++\n++++++++++\n', image);
        const CLOUDINARY_PREFIX = 'cloudinary:';
        if (image.image_path.startsWith('cloudinary')) {
          console.log('IS CLOUDINARY IMAGE');
          // Convert the image to multiple formats
          if (cl == null) {
            //alert('init cl')
            cl = cloudinary.Cloudinary.new( { cloud_name: CLOUDINARY_CLOUD_NAME});
          }

          // See http://cloudinary.com/documentation/image_transformations#resizing_and_cropping_images
          var publicId = image.image_path.substring(CLOUDINARY_PREFIX.length);
          var imageName = publicId + '.jpg';
          image._cloudinaryImage_raw = cl.url(imageName);
          image._cloudinaryImage_lowquality = cl.url(imageName, { width:200, effect:"blur:600", opacity:50, crop: "scale" });

          // console.log('----> ' + image._cloudinaryImage_lowquality);
          //console.log('====> ' + cl.imageTab(imageName, { width:100, blur:300, opacity:50 }));
          image._cloudinaryImage_320 = cl.url(imageName, { width: 320, crop: "limit"});
          image._cloudinaryImage_480 = cl.url(imageName, { width: 480, crop: "limit"});
          image._cloudinaryImage_768 = cl.url(imageName, { width: 768, crop: "limit"});
          image._cloudinaryImage_992 = cl.url(imageName, { width: 992, crop: "limit"});
          image._cloudinaryImage_1200 = cl.url(imageName, { width: 1200, crop: "limit"});
          image._cloudinaryImage_1920 = cl.url(imageName, { width: 1920, crop: "limit"});
          image._512x512 = cl.url(imageName, { width:512, height: 512, crop: "fit" });
          image._thumbnail = cl.url(imageName, { width:200, height: 200, crop: "fit" });
          image._raw = cl.url(imageName);

          var kb = image.image_size / 1024;
          image._size = accounting.formatNumber(kb) + ' kb';
          // console.log('----> ' + image._thumbnail);

        } else {

          // Not a cloudinary image.
          // console.log('----> default ---> ' + image.image_path);
          image._512x512 = image.image_path;
          image._thumbnail = image.image_path;
          image._raw = image.image_path;
          image._size = null;
        }
        variant._productVariantImage_list.push(image);
      });//- next image

      // Sort the images
      variant._productVariantImage_list.sort(function(image1, image2) {
        console.log('image1=', image1);
        var s1 = image1.sort_id ? image1.sort_id : 0;
        var s2 = image2.sort_id ? image2.sort_id : 0;
        if (s1 < s2) return -1;
        if (s1 > s2) return +1;
        return 0;
      });

      // Choose the currently selected image
      variant._selectedImage = (variant._productVariantImage_list.length > 0) ? variant._productVariantImage_list[0] : null;
      for (var i = 0; i < variant._productVariantImage_list.length; i++) {
        var image = variant._productVariantImage_list[i];
        if (image.is_displayed) {
          variant._selectedImage = image;
          break;
        }
      }


      // Provide style options for displaying the list and record.
      var displayOptions = {
        //prefix: 'productVariant',
        listModel: 'productVariantImage_list', // in $scope
        //recordModel: 'productVariantImage_record', // in $scope
        //listClickFunction: 'productVariant_listClick', // in $scope
        //listTableClasses: 'table-condensed table-hover',
      };

      // Add fields to the DOM for the list
      var fields = TooltwistViews.fieldsForMode(metadata, 'list');
      var html = TooltwistViews.htmlForAngular_list(metadata, fields, displayOptions);
      // Update the DOM and get Angular to bind our new DOM elements onto it's models.
      var listDiv = $('#productVariantImage_listDiv');
      listDiv.html(html);
      $compile(listDiv)($scope);

    });// select
  }//- loadImagesForVariant()



  function loadSpecTypesOptionsAndValuesForVariant($http, context, variant) {
    console.log('loadSpecTypesOptionsAndValuesForVariant()');

    var TEASERVICE_APIKEY = '12345';
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/' + TEASERVICE_APIKEY + '/productSpecifications/' + variant.product_variant_id;
    var params = {
      product_variant_id: variant.product_variant_id
    };
    console.log('URL=' + url);
    console.log('PARAMS=', params);
    var req = {
      method: 'GET',
      url: url,
      headers: {
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",
        "version": "2.0.0"
      },
      data: params
    };
    $http(req).then(function(response) {
      // All okay
      variant._specTypesOptionsAndValues = response.data;

      // Set the currently selected values
      variant._specTypesOptionsAndValues.categories.forEach(function(category) {
        category.category_specification_types.forEach(function(type) {
          if (type.current_value) {
            switch(type.data_type) {
              case 'TXT': type._currentValue = type.current_value.text; break;
              case 'INT': type._currentValue = type.current_value.int; break;
              case 'DEC': type._currentValue = type.current_value.dec; break;
              case 'OPT':
                // Find the option record
                type.options.forEach(function(option) {
                  if (option.category_specification_option_id == type.current_value.category_specification_option_id) {
                    type._selectedOption = option;
                  }
                })
                break;
            }
          }
        })
      });
    }, TEAServiceError);
  }//- loadSpecTypesOptionsAndValuesForVariant


  /*
   *

   companyName
   supplierName
   storeId
   commissionRate
   logo
   banner
   isActive
   deleted
   type
   contactEmail
   abn
   phone_c
   phone_n
   story

   */
   //ZZZ Not used
  // function addSupplier($http, jwt, options, callback/*(successResponse,errorResponse)*/) {
  //   console.log('addSupplier()')
  //   console.log('options: ', options);
  //
  //   var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/saveSupplier';
  //   console.log('url=' + url);
  //
  //   var req = {
  //     method: 'PUT',
  //     url: url,
  //     headers: {
  //       "Authorization": jwt,
  //       "access-token": "0613952f81da9b3d0c9e4e5fab123437",//ZZZZ Hack
  //       "version": "3.0.0"
  //     },
  //     data: options
  //   };
  //
  //   // Prepare the promise, so the caller can use .then(fn) to handle the result.
  //   ctrl.inProgress = true;
  //   $http(req).then(function(response) {
  //
  //     // Added okay
  //     ctrl.inProgress = false;
  //     ctrl.errmsg = null;
  //     $('#add-supplier-modal').modal('hide');
  //     if (callback) {
  //       return callback(response.data, null)
  //     }
  //   }, TEAServiceError);
  // }

  function TEAServiceError(response) {
    // An error occurred
    ctrl.inProgress = false;
    console.log('--------------------------------');
    console.log('Error calling TEAservice:');
    // console.log(' Url=' + url);
    // console.log(' Request=', req);
    console.log(' Response=', response);
    console.log('--------------------------------');
    var msg = 'Error calling server';
    if (response.data && response.data.code && response.data.message) {
      var msg = 'Error: ' + response.data.code + ': ' + response.data.message;
    } else if (response.statusText) {
      var msg = 'Error: ' + response.statusText;
    } else {
      var msg = 'Error: ' + response.status;
    }
    ctrl.errmsg = 'Error calling server.';
    ctrl.errmsg = msg;
    // if (callback) {
    //   return callback(null, response)
    // }
  }

  /*
   *                IMAGE LOADING
   */
  ctrl.doUploadImage = function(variant, file) {
     console.log('doUploadImage()');

    //var url = 'http://localhost:4000/api/2.0/drinkpoint/element?authenticationToken=U0X11WJTRM1DWIC74N1MJBQP';

    // See https://github.com/danialfarid/ng-file-upload
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/' + TEASERVICE_APIKEY + '/productImage';
    var data = {
      product_variant_id: variant.product_variant_id
    };
    console.log('url is ' + url);
    console.log('data is ', data);
    console.log('file is ', file);


     // See if we have a photo or video to load.
    //  var activeTabId = $(".composer .tab-pane.active").attr('id');
    if (file) {
      // if (file && activeTabId === 'composer-tab-photo-video') {

      // Have an image being loaded
      ctrl.filesize = accounting.formatNumber(file.size);
      ctrl.filename = file.name;
      data.file = file;
      Upload.upload({
        //url: 'http://localhost:4000/junkphotos',
        url: url,
        headers: {
          "access-token": "0613952f81da9b3d0c9e4e5fab123437",
          "version": "2.0.0"
        },
        data: data
      }).then(function (resp) {
        console.log('resp: ', resp);
        console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);

        // Reload the posts
        // TimelinePost.manualRenderPost(resp.data.elementId, '#timelineSection');
        $timeout(function(){
          ctrl.message = '';
          ctrl.file = null;
          ctrl.progressPercentage = null; // hide the progress bar again
          loadImagesForVariant(variant);
        }, 1);

      }, function (resp) {
        console.log('Error status: ' + resp.status);
      }, function (evt) {
        console.log('evt=', evt);
        // Show the image loading progress
        var perc = parseInt(100.0 * evt.loaded / evt.total);
        console.log('progress: ' + perc + '% ' + evt.config.data.file.name);
        $timeout(function(){
          ctrl.progressPercentage = perc;
        }, 1);
      });
    }
  };//- ctrl.doUploadImage()


  ctrl.cancelPost = function() {
    ctrl.file = null;
    ctrl.progressPercentage = null;
  }

  ctrl.haveFile = function() {
    //console.log('file is ', ctrl.file);
    if (ctrl.file) return true;
    return false;
  }

  ctrl.showDropArea = function() {
    if (ctrl.file) {
      return false;
    }
    return true;
  }

  ctrl.showImage = function() {
    if ($scope.file) {
      return true;
    }
    return false;
  }

  ctrl.showProgressBar = function() {
    return (
      ctrl.file
      && ctrl.progressPercentage
      && ctrl.progressPercentage < 100
    );
  }

  ctrl.showProcessing = function() {
    return (
      ctrl.file
      && ctrl.progressPercentage
      && ctrl.progressPercentage == 100
    );
  }

  ctrl.getPercentage = function() {
    return ctrl.progressPercentage;
  }

  ctrl.doToggleIsDisplayed = function(variant, image) {
    if (image.is_displayed == 1) {
      image.is_displayed = 0;
    } else {
      image.is_displayed = 1;
    }
    saveProductImageOrderAndIsDisplayed(variant);
  }

  /*
   *  Make the specified image the default image.
   */
  ctrl.doSetAsDefaultProductImage = function(variant, image) {
    var cnt = 0;
    var newlist = [ ];
    if (image) {
      variant._selectedImage = image;
      image.is_displayed = 1;
      image.sort_id = cnt++;
      newlist.push(image);
    }
    variant._productVariantImage_list.forEach(function(tmpImage) {
      if (tmpImage != image) {
        tmpImage.sort_id = cnt++;
        newlist.push(tmpImage);
      }
    });
    variant._productVariantImage_list = newlist;

    saveProductImageOrderAndIsDisplayed(variant);
  }

  ctrl.doSelectImage = function(variant, image) {
    variant._selectedImage = image;
  }


  function saveProductImageOrderAndIsDisplayed(variant) {
    console.log('saveProductImageOrderAndIsDisplayed()');

    // Prepare the list with the image order and whether they are displayed
    var params = {
      product_variant_id: variant.product_variant_id,
      images: [ ]
    };
    variant._productVariantImage_list.forEach(function(image) {
      params.images.push({
        product_variant_image_id: image.product_variant_image_id,
        is_displayed: image.is_displayed
      });
    });
    console.log('params=', params);

    // Call the server to do the update
    var TEASERVICE_APIKEY = '12345';
    var url = '//' + TEASERVICE_HOST + ':' + TEASERVICE_PORT + '/v3/' + TEASERVICE_APIKEY + '/productImageOrder';
    console.log('URL=' + url);
    console.log('PARAMS=', params);
    var req = {
      method: 'POST',
      url: url,
      headers: {
        "access-token": "0613952f81da9b3d0c9e4e5fab123437",
        "version": "2.0.0"
      },
      data: params
    };
    $http(req).then(function(response) {

      console.log('Response is', response);
    }, TEAServiceError);
  }//- loadSpecTypesOptionsAndValuesForVariant


  /*
   *  Add a new pricing_quantity record to the pricing rule.
   */
  ctrl.addPricingQty = function(variant, pricing) {
    var rec = {
      pricing_id: pricing.pricing_id,
      quantity: 2,
      price: variant.last_price,
      shared_sale_ok: 1,
      multiple_addresses_ok: 1
    };
    // Work out a new qty/price
    try {
      pricing._pricingQty.forEach(function(pq) {
        if (pq.price < rec.price) {
          rec.price = pq.price;
        }
        if (parseInt(pq.quantity) > parseInt(rec.quantity)) {
          rec.quantity = pq.quantity + 5;
        }
      });
    } catch (e) {}
    pricing._pricingQty.push(rec);
  }

  /*
   *  Add a pricing record for 'quantity breakpoint' pricing.
   */
  ctrl.addPricing_BRKQTY = function(variant) {
    var rec = {
      /*allow_picked_up: 0,*/
      /*amount: null,
      amount_exceed: null,
      */
      code: '',
      /*
      created_at: null,
      created_by: null,
      description: null,
      end_at: null,
      item_scope: null,
      modified_at: null,
      modified_by: null
      new_order_only: 0,*/
      //pricing_id: 1,
      //product_id: null,
      product_variant_id: variant.product_variant_id,
      quantity: 1,
      //reserved: 0,
      //role_id: null,
      scope: "V",
      //start_at: null,
      status: "A",
      store_id: STORE_ID,
      type: "BRKQTY",
      /*unlimited: 1,
      used: 0,*/
      _pricingQty: [ {
        //pricing_id: pricing.pricing_id,
        quantity: 2,
        price: variant.last_price,
        shared_sale_ok: 1,
        multiple_addresses_ok: 1
      } ],
    };
    console.log('new pricing record', rec);
    variant._productPricing_list.push(rec);
    // ctrl.productPricing_list.push(rec);
  }



}
