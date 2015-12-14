var should = require('should');
var supertest = require('supertest');
var async = require('async');

var parse = require('./parse');
var fetchField = require('./field');

var assertMap = require('./assert').assertMap;

function NATest() {
  this.globalVariable = {};
  this.accounts = {};
  this.rooturl = "http://localhost";
}

module.exports = NATest;

NATest.prototype.auth = function(account, password, callback) {
  callback(null, null);
};

/*
NATest.prototype.transform = function(value, name ,context) {
  return value;
};
*/


/*

  这里可以设置一个每一个 description 的对象  里面可以设置 这个环境的
  参数 ,并且可以设置 一系列的 转化方法和 hook 方法, 未来可以写成 d 执行 run 才会 执行测试

*/



NATest.prototype.testFile = function(path) {
  var self = this;

  var json = require(path);
  var accounts = json.account;
  var url = json.rooturl;
  var testcases = json.testcases;
  var jsonDescription = json.description;
  var defaultVariables = json.defaultVariable;

  for (var i in defaultVariables) {
    self.globalVariable[i] = defaultVariables[i];
  }
  self.accounts = accounts;
  self.rooturl = url;

  describe(jsonDescription, function () {
    before(function(done) {
      var functions = [];
      var insert = function(account, password){
        functions.push(function(callback){
          self.auth(account, password, function(error, cookie) {
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
      self.testCase(testcase);
    }
  });
};

NATest.prototype.testCase = function(testcase) {
  var self = this;

  var description = testcase.description;
  var account = testcase.account;
  var password = this.accounts[account];
  var path = testcase.path;
  var method = testcase.method;
  var stauts = testcase.stauts;
  var asserts = testcase.assert;
  var variables = testcase.variable;
  var requestBody = testcase.body;

  it(description, function (done) {
    self.auth(account, password, function(error, cookie) {
      if (error) {
        should.not.exist(error);
        return;
      }

      var req = self.setMethodAndPath(supertest,method, self.transformVariables(path, "path"));
      req = req.set('Cookie', cookie);
      req = self.setRequestBody(req, requestBody);
      req = req.expect(stauts);

      req.end(function (err, res) {
        var body = res.body;
        // console.log(body);
        if (!err) {
          should.exist(body);
          self.assertFields(body, asserts);
          self.setVariables(body, variables);
        }
        done(err);
      });
    });
  });
};

NATest.prototype.setRequestBody = function(req, requestBody) {
  for (var fieldName in requestBody) {
    var field = requestBody[fieldName];
    req = req.field(fieldName, this.transformVariables(field, "body"));
  }
  return req;
};

NATest.prototype.setVariables = function(body, variables) {
  for (var variable in variables) {
    var path = variables[variable];
    var value =  fetchField(body, parse(path));
    if value != null {
      this.globalVariable[variable] = value;
    } else {
      console.log("variable error:" + path);
    }
  }
};

NATest.prototype.transformVariables = function(value, context) {

  //当 value 为 string 的时候去做转化
  if (typeof value === "string") {
    var result = value;
    var patrn = /[{]{1}[\w]+[}]{1}/;
    var replaceNumber = 0;
    while (patrn.test(result)) {
      var regexpStr = patrn.exec(result)[0];
      var variableName = regexpStr.slice(1, regexpStr.length-1);

      var variable = this.globalVariable[variableName];
      
      if (this.transform) {
        variable = this.transform(variable, variableName, context);
      }

      //如果只是赋值参数  直接返回
      if (replaceNumber == 0 && regexpStr == result) {
        return variable;
      }

      if (!variable) {
        variable = ""
      }

      result = result.replace(regexpStr,variable);
      replaceNumber++;
    }
    return result;
  }

  return value
};

NATest.prototype.assertFields = function(body, asserts) {

  for (var type in asserts) {
    var assertRows = asserts[type];
    var assertFuction =  assertMap[type]

    for (var assertRowKey in assertRows) {
      var assertRowVaule = assertRows[assertRowKey];
      assertRowVaule = this.transformVariables(assertRowVaule, "assert");
      assertFuction(body,assertRowKey,assertRowVaule);
    }
  }
};

NATest.prototype.setMethodAndPath = function(supertest, method, path) {
  switch (method) {
    case "DELETE":
      return supertest(this.rooturl).del(path);
      break;
    case "POST":
      return supertest(this.rooturl).post(path);
      break;
    case "PUT":
      return supertest(this.rooturl).put(path);
      break;
    default:
      return supertest(this.rooturl).get(path);
  }
};