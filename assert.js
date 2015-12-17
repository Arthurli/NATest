var should = require('should');
var parse = require('./parse');
var fetchField = require('./field');

//目前断言分6种, equal, notEqual, less, greater, exist, notExist
var assertEqual = function assertEqualFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField,assertKey+" not exist");
  assertVaule.should.equal(assertField,assertKey+" "+assertField+" not equal "+assertVaule);
};

var assertNotEqual = function assertNotEqualFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField,assertKey+" not exist");
  assertVaule.should.not.equal(assertField,assertKey+" "+assertField+" equal "+assertVaule);
};

var assertExist = function assertExistFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField,assertKey+" not exist");
};

var assertNotExist = function assertNotExistFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.not.exist(assertField,assertKey+" exist");
};

var assertLess = function assertLessFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField,assertKey+" not exist");
  assertField.should.below(assertVaule,assertKey+" "+assertField+" not less "+assertVaule);
};

var assertGreater = function assertGreaterFunc(body,assertKey,assertVaule) {
  var assertField = fetchField(body,parse(assertKey));
  should.exist(assertField,assertKey+" not exist");
  assertField.should.above(assertVaule,assertKey+" "+assertField+" not greater "+assertVaule);
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