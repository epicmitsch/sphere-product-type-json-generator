/* ===========================================================
# sphere-product-type-json-generator - v0.0.4
# ==============================================================
# Copyright (C) 2014 Sven Müller
# Licensed under the MIT license.
*/
var CSV, ProductTypeGenerator, Q, argv, readCsvPromise;

CSV = require('csv');

Q = require('q');

argv = require('optimist').usage('Usage: $0 --types [CSV] --attributes [CSV] --target [folder] --retailer [boolean]').alias('types', 't').alias('attributes', 'a').alias('target', 'td').alias('retailer', 'r')["default"]('retailer', false).describe('types', 'Path to product types CSV file.').describe('attributes', 'Path to product type attributes CSV file.').describe('target', 'Target directory for generated product types JSON files.').describe('retailer', 'Master/Retailer. Set "true" to generate another product type file, having an extra attribute "masterSKU".').demand(['types', 'attributes', 'target']).argv;

ProductTypeGenerator = require('../main').ProductTypeGenerator;


/*
Reads a CSV file by given path and returns a promise for the result.
@param {string} path The path of the CSV file.
@return Promise of csv read result.
 */

readCsvPromise = function(path) {
  var deferred;
  deferred = Q.defer();
  CSV().from.path(path, {
    columns: true
  }).to.array(function(data, count) {
    return deferred.resolve(data);
  }).on("error", function(error) {
    return deferred.reject(new Error(error));
  });
  return deferred.promise;
};

Q.spread([readCsvPromise(argv.types), readCsvPromise(argv.attributes)], function(types, attributes) {
  var generator;
  generator = new ProductTypeGenerator;
  return generator.run(types, attributes, argv.target, argv.retailer, function(success) {
    if (!success) {
      return process.exit(1);
    }
  });
}).fail(function(error) {
  return console.log("An error occured: " + error.message);
});
