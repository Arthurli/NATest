var should = require('should');
var supertest = require('supertest');
var async = require('async');

var parse = require('./parse');
var fetchField = require('./field');

var assertMap = require('./assert').assertMap;

function NATest() {
  this.client = new KS3(config.AccessKeyID,
    config.AccessKeySecret, config.Bucket);
}

module.exports = NATest;

NATest.prototype.globalVariable = {};
NATest.prototype.auth = function(account, password, callback) {
  callback(null, null);
};

NATest.prototype.testFile = function(path) {
  var json = require(path);
  var accounts = json.account;
  var url = json.rooturl;
  var testcases = json.testcases;
  var jsonDescription = json.description;

  describe(jsonDescription, function () {
    before(function(done) {
      var functions = [];
      var insert = function(account, password){
        functions.push(function(callback){
          auth(account, password, function(error, cookie) {
            callback()
          });
        });
      }

      for (var i in accounts) {
        var account = i;
        var password = accounts[account];
        insert(account, password); 
      }
      functions.push(function(callback){
        done();
        callback();
      })

      async.series(functions);
    });

    for(var i in testcases) {
      var testcase = testcases[i];
      test(testcase);
    }
  });
}

NATest.prototype.test = function(testcase) {
  var description = testcase.description;
  var account = testcase.account;
  var password = accounts[account];
  var path = testcase.path;
  var method = testcase.method;
  var stauts = testcase.stauts;
  var asserts = testcase.assert;
  var variables = testcase.variable;
  var requestBody = testcase.body;

  it(description, function (done) {
    this.auth(account, password, function(error, cookie) {
      if (error) {
        should.not.exist(error);
        return;
      }

      var req = this.setMethodAndPath(supertest,method, this.transformVariables(path));
      req = req.set('Cookie', cookie);
      req = this.setRequestBody(req, requestBody);
      req = req.expect(stauts);

      req.end(function (err, res) {
        if (!err) {
          var body = res.body;
          should.exist(body);
          this.assertFields(body, asserts);
          this.setVariables(body, variables);
        }
        done(err);
      });
    });
  });
}

NATest.prototype.setRequestBody = function(req, requestBody) {
  for (var fieldName in requestBody) {
    var field = requestBody[fieldName];
    req = req.field(fieldName, this.transformVariables(field));
  }
  return req;
}

NATest.prototype.setVariables = function(body, variables) {
  for (var variable in variables) {
    var path = variables[variable];
    var value =  fetchField(body, parse(path));
    this.globalVariable[variable] = value;
  }
}

NATest.prototype.transformVariables = function(str) {
  var result = str;
  var patrn = /[{]{1}[\w]+[}]{1}/;
  while (patrn.test(result)) {
    var regexpStr = patrn.exec(result)[0];
    var variableName = regexpStr.slice(1, regexpStr.length-1);
    var variable = this.globalVariable[variableName];
    if (!variable) {
      variable = ""
    }
    result = result.replace(regexpStr,variable);
  }
  return result;
}

NATest.prototype.assertFields = function(body, asserts) {

  for (var type in asserts) {
    var assertRows = asserts[type];
    var assertFuction =  assertMap[type]

    for (var assertRowKey in assertRows) {
      var assertRowVaule = assertRows[assertRowKey];
      assertFuction(body,assertRowKey,assertRowVaule);
    }
  }
}

NATest.prototype.setMethodAndPath = function(supertest, method, path) {
  switch (method) {
    case "DELETE":
      return supertest(url).del(path);
      break;
    case "POST":
      return supertest(url).post(path);
      break;
    case "PUT":
      return supertest(url).put(path);
      break;
    default:
      return supertest(url).get(path);
  }
}