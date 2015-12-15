var should = require('should');
var supertest = require('supertest');
var async = require('async');

var parse = require('./parse');
var fetchField = require('./field');

var assertMap = require('./assert').assertMap;

function NATest() {
  this.globalVariable = {};
}

function NADescribe() {
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
  var describeObject = new NADescribe();

  var json = require(path);
  var accounts = json.account;
  var url = json.rooturl;
  var testcases = json.testcases;
  var jsonDescription = json.description;

  //设置默认参数
  var defaultVariables = json.defaultVariable;
  for (var i in defaultVariables) {
    self.globalVariable[i] = defaultVariables[i];
  }

  describeObject.accounts = accounts;
  describeObject.rooturl = url;

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
      self.testCase(describeObject, testcase);
    }
  });

  return describeObject;
};

NATest.prototype.testCase = function(describeObject, testcase) {
  var self = this;

  var description = testcase.description;
  var account = testcase.account;
  var password = describeObject.accounts[account];
  var path = testcase.path;
  var method = testcase.method;
  var stauts = testcase.stauts;
  var asserts = testcase.assert;
  var variables = testcase.variable;
  var headers = testcase.headers;
  var requestBody = testcase.body;

  it(description, function (done) {
    self.auth(account, password, function(error, cookie) {
      if (error) {
        should.not.exist(error);
        return;
      }
      var req = supertest(describeObject.rooturl);
      req = self.setMethodAndPath(req, method, self.transformVariables(path, "path"));
      if (cookie) {
        req = req.set('Cookie', cookie);
      }
      req = self.setRequestHeaders(req, headers);
      req = self.setRequestBody(req, requestBody);
      req = req.expect(stauts);

      req.end(function (err, res) {
        var body = res.body;
        // console.log(self.transformVariables(path, "path"));
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

NATest.prototype.setRequestHeaders = function(req, headers) {
  for (var fieldName in headers) {
    var field = headers[fieldName];
    req = req.set(fieldName, this.transformVariables(field, "header"));
  }
  return req;
};

NATest.prototype.setRequestBody = function(req, requestBody) {
  var body = {};
  for (var fieldName in requestBody) {
    var field = requestBody[fieldName];
    body[fieldName] = this.transformVariables(field, "body");
  }
  req = req.send(body);

  return req;
};

NATest.prototype.setVariables = function(body, variables) {
  for (var variable in variables) {
    var path = variables[variable];
    var value =  fetchField(body, parse(path));
    if (value) {
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
    var variablesPatrn = /[{]{1}[\S]+?[}]{1}/;
    var replaceNumber = 0;
    while (variablesPatrn.test(result)) {
      var regexpStr = variablesPatrn.exec(result)[0];
      var variableName = regexpStr.slice(1, regexpStr.length-1);

      var variable;


      //查看是否需要强转换
      var conversionPatrn = /\.\((boolean|string|number){1}\)/;
      if (conversionPatrn.test(variableName)) {
        var conversionRegexpStr = conversionPatrn.exec(variableName)[0];
        variableName = variableName.replace(conversionRegexpStr,"");
        variable = this.globalVariable[variableName];

        if (conversionRegexpStr == ".(string)") {
          variable = String(variable);
        } else if (conversionRegexpStr == ".(number)") {
          variable = Number(variable);
        } else if (conversionRegexpStr == ".(boolean)") {
          if (typeof variable === "string") { 
            if (variable == "false") {
              return false;
            }
            return true
          } else {
            variable = Boolean(variable);
          }
        }
      } else {
        variable = this.globalVariable[variableName];
      }
      

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
  } else if (typeof value === "object") {

    var result = {};
    if (isArrayFn(value)) {
      result = new Array();
    }

    for (var i in value) {
      result[i] = this.transformVariables(value[i],context);
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

NATest.prototype.setMethodAndPath = function(request, method, path) {
  switch (method) {
    case "DELETE":
      return request.del(path);
      break;
    case "POST":
      return request.post(path);
      break;
    case "PUT":
      return request.put(path);
      break;
    default:
      return request.get(path);
  }
};

function isArrayFn(value){  
  if (typeof Array.isArray === "function") {  
      return Array.isArray(value);      
  }else{  
      return Object.prototype.toString.call(value) === "[object Array]";      
  }  
} 
