var should = require('should');
var parse = require('./parse');
var fetchField = require('./field');

//目前断言分6种, equal, notEqual, less, greater, exist, notExist
var assertEqual = function assertEqualFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField);
  assertVaule.should.equal(assertField);
};

var assertNotEqual = function assertNotEqualFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField);
  assertVaule.should.not.equal(assertField);
};

var assertExist = function assertExistFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField);
};

var assertNotExist = function assertNotExistFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.not.exist(assertField);
};

var assertLess = function assertLessFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField);
  assertField.should.below(assertVaule);
};

var assertGreater = function assertGreaterFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField);
  assertField.should.above(assertVaule);
};

var assertMap = {
  "equal": assertEqual,
  "notEqual": assertNotEqual,
  "exist": assertExist,
  "notExist": assertNotExist,
  "less": assertLess,
  "greater": assertGreater
};

module.exports.assertMap = assertMap;