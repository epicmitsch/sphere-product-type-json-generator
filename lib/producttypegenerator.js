/* ===========================================================
# sphere-product-type-json-generator - v0.0.4
# ==============================================================
# Copyright (C) 2014 Sven Müller
# Licensed under the MIT license.
*/
var ProductTypeGenerator, Q, fs, _, _s;

fs = require('fs');

Q = require('q');

_ = require("underscore")._;

_s = require('underscore.string');


/*
Class for generating JSON product type representations from CSV files.
 */

ProductTypeGenerator = (function() {
  var ATTRIBUTE_CONSTRAINT, ATTRIBUTE_ENUM_VALUES, ATTRIBUTE_INPUT_HINT, ATTRIBUTE_IS_REQUIRED, ATTRIBUTE_LABEL, ATTRIBUTE_NAME, ATTRIBUTE_NAME_MASTER_SKU, ATTRIBUTE_TYPE, ATTRIBUTE_TYPES, ATTRIBUTE_TYPE_ENUM, ATTRIBUTE_TYPE_ENUM_KEY, ATTRIBUTE_TYPE_LENUM, ATTRIBUTE_TYPE_LTEXT, ATTRIBUTE_TYPE_SET, ATTRIBUTE_TYPE_TEXT, ATTRIBUT_IS_SEARCHABLE, PRODUCT_TYPE_DESCRIPTION, PRODUCT_TYPE_NAME;

  function ProductTypeGenerator() {}

  PRODUCT_TYPE_NAME = 'name';

  PRODUCT_TYPE_DESCRIPTION = 'description';

  ATTRIBUTE_TYPE_TEXT = 'text';

  ATTRIBUTE_TYPE_LTEXT = 'ltext';

  ATTRIBUTE_TYPE_ENUM = 'enum';

  ATTRIBUTE_TYPE_LENUM = 'lenum';

  ATTRIBUTE_TYPE_SET = 'set';

  ATTRIBUTE_TYPE_ENUM_KEY = 'key';

  ATTRIBUTE_TYPE_TEXT = 'text';

  ATTRIBUTE_TYPES = {
    ATTRIBUTE_TYPE_ENUM: ATTRIBUTE_TYPE_ENUM,
    ATTRIBUTE_TYPE_TEXT: ATTRIBUTE_TYPE_TEXT
  };

  ATTRIBUTE_ENUM_VALUES = 'values';

  ATTRIBUTE_NAME = 'name';

  ATTRIBUTE_LABEL = 'label';

  ATTRIBUTE_TYPE = 'type';

  ATTRIBUTE_CONSTRAINT = 'attributeConstraint';

  ATTRIBUTE_IS_REQUIRED = 'isRequired';

  ATTRIBUTE_INPUT_HINT = 'inputHint';

  ATTRIBUT_IS_SEARCHABLE = 'isSearchable';

  ATTRIBUTE_NAME_MASTER_SKU = 'mastersku';


  /*
  Creates sphere product type representation files using JSON format.
  @param {array} types Entire types CSV as an array of records.
  @param {array} attributes Entire attributes CSV as an array of records.
  @param {string} target The target folder for the generated files.
  @param {boolean} masterRetailerProject Set to true if product type files are used for a master/retailer projects, otherwise false.
  @param {function} callback The callback function to be invoked when the method finished its work.
  @return Result of the given callback
   */

  ProductTypeGenerator.prototype.run = function(types, attributes, target, masterRetailerProject, callback) {
    var attributeDefinitionMastersku, attributeDefinitions, productTypeDefinition, productTypeDefinitions, productTypeDefinitionsRetailers, _i, _j, _len, _len1;
    attributeDefinitions = this._createAttributeDefinitions(attributes);
    productTypeDefinitions = this._createProductTypesDefinitions(types, attributeDefinitions);
    for (_i = 0, _len = productTypeDefinitions.length; _i < _len; _i++) {
      productTypeDefinition = productTypeDefinitions[_i];
      this._writeFile(productTypeDefinition, target);
    }
    if (masterRetailerProject) {
      attributeDefinitionMastersku = this._createAttributeDefinitionMastersku();
      productTypeDefinitionsRetailers = this._createProductTypesDefinitions(types, attributeDefinitions, attributeDefinitionMastersku);
      for (_j = 0, _len1 = productTypeDefinitionsRetailers.length; _j < _len1; _j++) {
        productTypeDefinition = productTypeDefinitionsRetailers[_j];
        this._writeFile(productTypeDefinition, target, 'retailer-product-type');
      }
    }
    return callback(true);
  };


  /*
  Returns an object containing all attribute definitions from given attribute CSV.
  @param {array} attributes Entire attributes CSV as an array of records.
  @return Object containing all attribute definitions
   */

  ProductTypeGenerator.prototype._createAttributeDefinitions = function(attributes) {
    var attributeDefinition, attributeDefinitions, lastProcessedAttributeDefinition, row, rowIndex, _i, _len;
    attributeDefinitions = {};
    lastProcessedAttributeDefinition = null;
    for (rowIndex = _i = 0, _len = attributes.length; _i < _len; rowIndex = ++_i) {
      row = attributes[rowIndex];
      if (!!row[ATTRIBUTE_NAME]) {
        attributeDefinition = {
          name: row[ATTRIBUTE_NAME],
          label: this._i18n(row, ATTRIBUTE_LABEL),
          type: {
            name: this._type(row[ATTRIBUTE_TYPE])
          },
          attributeConstraint: row[ATTRIBUTE_CONSTRAINT],
          isRequired: row[ATTRIBUTE_IS_REQUIRED] === 'true',
          isSearchable: row[ATTRIBUT_IS_SEARCHABLE] === 'true'
        };
        attributeDefinitions[row[ATTRIBUTE_NAME]] = attributeDefinition;
        lastProcessedAttributeDefinition = attributeDefinition;
      } else {
        attributeDefinition = lastProcessedAttributeDefinition;
      }
      this._attributeDefinition(row, attributeDefinition, attributeDefinition[ATTRIBUTE_TYPE], row[ATTRIBUTE_TYPE]);
    }
    return attributeDefinitions;
  };


  /*
  Builds an attribute definition instance (called recoursivly for each part in given raw type name ('set:<type>').
  @param {object} row The row object containing key/value pairs (header/value).
  @param {object} attributeDefinition The object containing attribute definition
  @param {object} type The attribute type instance.
  @param {string} rawTypeName The raw attribute type name (e.g. 'set:text')
   */

  ProductTypeGenerator.prototype._attributeDefinition = function(row, attributeDefinition, type, rawTypeName) {
    var values;
    switch (type.name) {
      case ATTRIBUTE_TYPE_TEXT:
      case ATTRIBUTE_TYPE_LTEXT:
        return attributeDefinition[ATTRIBUTE_INPUT_HINT] = row["text" + (_s.capitalize(ATTRIBUTE_INPUT_HINT))];
      case ATTRIBUTE_TYPE_ENUM:
        values = type[ATTRIBUTE_ENUM_VALUES];
        return type[ATTRIBUTE_ENUM_VALUES] = _.union(values || [], {
          key: row["enum" + (_s.capitalize(ATTRIBUTE_TYPE_ENUM_KEY))],
          label: row["" + ATTRIBUTE_TYPE_ENUM + (_s.capitalize(ATTRIBUTE_LABEL))]
        });
      case ATTRIBUTE_TYPE_LENUM:
        values = type[ATTRIBUTE_ENUM_VALUES];
        return type[ATTRIBUTE_ENUM_VALUES] = _.union(values || [], {
          key: row["enum" + (_s.capitalize(ATTRIBUTE_TYPE_ENUM_KEY))],
          label: this._i18n(row, "" + ATTRIBUTE_TYPE_ENUM + (_s.capitalize(ATTRIBUTE_LABEL)))
        });
      case ATTRIBUTE_TYPE_SET:
        delete attributeDefinition[ATTRIBUTE_IS_REQUIRED];
        delete attributeDefinition[ATTRIBUT_IS_SEARCHABLE];
        if (row[ATTRIBUTE_TYPE]) {
          type['elementType'] = {
            name: this._type(this._typeOrElementType(rawTypeName))
          };
        }
        return this._attributeDefinition(row, attributeDefinition, type['elementType'], this._typeOrElementType(rawTypeName));
    }
  };


  /*
  Splits the raw attribute type (e.g. 'set:set:type' => 'set:type', 'set:type' => 'type', 'text' => 'text') and returns the attribute element type or the type itself.
  @param {string} rawAttributeType The raw attribute type (e.g. 'text' or 'set:text')
  @return Attribute type
   */

  ProductTypeGenerator.prototype._typeOrElementType = function(rawAttributeType) {
    var parts;
    parts = rawAttributeType.split(':');
    if (parts.length !== 1) {
      parts = parts.slice(1);
    }
    return parts.join(':');
  };


  /*
  Splits the raw attribute type (e.g. 'set:type' => 'set', 'text' => 'text') and returns the attribute type itself.
  @param {string} rawAttributeType The raw attribute type (e.g. 'text' or 'set:text')
  @return Attribute type
   */

  ProductTypeGenerator.prototype._type = function(rawAttributeType) {
    return _.first(rawAttributeType.split(':'));
  };


  /*
  Create an object containing product type definition for attribute 'masteSKU'.
  @return Object with product type attribute definition
   */

  ProductTypeGenerator.prototype._createAttributeDefinitionMastersku = function() {
    var attributeDefinition;
    return attributeDefinition = {
      name: ATTRIBUTE_NAME_MASTER_SKU,
      label: {
        en: 'Master SKU'
      },
      type: {
        name: 'text'
      },
      attributeConstraint: 'Unique',
      isRequired: true,
      isSearchable: false,
      inputHint: 'SingleLine'
    };
  };


  /*
  Returns a list of languages (for i18n) used for given attribute property header.
  @param {string} name The name of the attribute property header.
  @param {array}  headers The headers used CSV.
  @return List with language values
   */

  ProductTypeGenerator.prototype._languages = function(name, headers) {
    var header, languages, regexp, _i, _len, _results;
    regexp = new RegExp("^" + name + "\.[a-zA-Z]{2}", 'i');
    languages = function(header) {
      var matched;
      matched = header.match(regexp);
      if (matched) {
        return _.last(matched[0].split("."));
      }
    };
    _results = [];
    for (_i = 0, _len = headers.length; _i < _len; _i++) {
      header = headers[_i];
      if (header.match(regexp)) {
        _results.push(languages(header));
      }
    }
    return _results;
  };


  /*
  Returns an object containing a key/value pairs (language/value) for each language.
  @param {object} row The row object containing key/value pairs (header/value).
  @param {string}  header The attribute property header
  @return Object with i18n values
   */

  ProductTypeGenerator.prototype._i18n = function(row, header) {
    var i18n, language, languages, _i, _len;
    i18n = {};
    languages = this._languages(header, _.keys(row));
    for (_i = 0, _len = languages.length; _i < _len; _i++) {
      language = languages[_i];
      i18n[language] = row["" + header + "." + language];
    }
    return i18n;
  };


  /*
  Returns an object containing a key/value pairs (language/value) for each language.
  @param {array} types Entire types CSV as an array of records.
  @param {object} attributeDefinitions The object containing all attribute definitions
  @pearm {object} defaultAttributeDefinition If given, the default attribute will be added to all resulting product typ definitions.
  @return Array containing product type definition objects
   */

  ProductTypeGenerator.prototype._createProductTypesDefinitions = function(types, attributeDefinitions, defaultAttributeDefinition) {
    var attributeDefinition, error, header, productTypeDefinition, productTypeDefinitions, row, rowIndex, value, _i, _len;
    productTypeDefinitions = [];
    for (rowIndex = _i = 0, _len = types.length; _i < _len; rowIndex = ++_i) {
      row = types[rowIndex];
      try {
        productTypeDefinition = {
          name: row[PRODUCT_TYPE_NAME],
          description: row[PRODUCT_TYPE_DESCRIPTION]
        };
        for (header in row) {
          value = row[header];
          if (header === PRODUCT_TYPE_NAME || header === PRODUCT_TYPE_DESCRIPTION) {
            continue;
          }
          if (_.isString(value) && value.length > 0) {
            if (attributeDefinitions[header]) {
              attributeDefinition = attributeDefinitions[header];
              if (value.toLowerCase() !== 'x') {
                attributeDefinition.name = value;
              }
              productTypeDefinition['attributes'] = _.union(productTypeDefinition['attributes'] || [], attributeDefinition);
            } else {
              throw new Error("No attribute definition found with name '" + header + "'.");
            }
          }
        }
        if (defaultAttributeDefinition) {
          productTypeDefinition['attributes'] = _.union(productTypeDefinition['attributes'] || [], defaultAttributeDefinition);
        }
        productTypeDefinitions.push(productTypeDefinition);
      } catch (_error) {
        error = _error;
        console.log(("Skipping invalid product type definition '" + row['name'] + "' because: ") + error);
      }
    }
    return productTypeDefinitions;
  };


  /*
  Outputs given product definition as a file in JSON format.
  @param {object} productTypeDefinition The object containing product type definition.
  @param {string} target The target folder for the file.
  @param {string} prefix The prefix will be added to the resulting file name.
   */

  ProductTypeGenerator.prototype._writeFile = function(productTypeDefinition, target, prefix) {
    var fileName, prettified;
    if (prefix == null) {
      prefix = 'product-type';
    }
    prettified = JSON.stringify(productTypeDefinition, null, 4);
    fileName = "" + target + "/" + prefix + "-" + productTypeDefinition[PRODUCT_TYPE_NAME] + ".json";
    return fs.writeFile(fileName, prettified, 'utf8', function(error) {
      if (error) {
        return console.log("Error while writing file " + fileName + ": " + error);
      }
    });
  };

  return ProductTypeGenerator;

})();

module.exports = ProductTypeGenerator;
