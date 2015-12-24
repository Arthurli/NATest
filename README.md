这是一个简单的使用 Node 来进行 API 测试的框架  
这个框架是基于 mocha 进行开发的

如何使用这个框架

1. 新建一个 node 工程
2. 引入 mocha 和 NATest
3. 创建一个 testcase 的 JSON 文件, JSON 格式见下文
4. 创建一个 index.js 文件, 导入上面的 JSON 文件

  ~~~
  //index.js
  var NATest = require('natest');
  var test = new NATest();
  /*
  也可以设置默认参数 均为为可选
  var args = {
    "accounts": {
      "account": "password"
    },
    "globalVariable": {
      "variable": "value"
    },
    "timeout": 3000,
    "rooturl": "http://www.test.com"
  }
  var test = new NATest(args);
  */
  // 初始化测试数据
  test.testFile(__dirname+'/testcase/create_data.json');

  // 具体的测试用例
  test.testFile(__dirname+'/testcase/test.json');

  // 测试结束删除测试数据
  test.testFile(__dirname+'/testcase/create_data.json');

  ~~~

5. 最后使用 mocha 命令执行测试 `./node_modules/mocha/bin/mocha -t 20000 index.js`

## NATest 对象
* 每一个 NATest 对象拥有同一个上下文, 也就是说 test.testFile 文件可以使用之前初始化过的数据或者是参数  
* 如果想拥有多个上下文, 那么生成多个 NATest 对象进行测试  
* 目前的设计是 在每个 json 文件被测试之前 都会拿到 json 中的 accouts 来执行 auth 方法, 以免某些异步获取 cookie 方法 卡住测试, 造成 timeout
* 每个 NATest 对象拥有一个 auth 方法,可以设置 cookie, 需要自行设置, 格式如下

  ~~~
  NATest.prototype.auth = function(account, password, callback) {
    // 第一个参数是 error , 第二个参数是 cookie
    callback(null, null);
  };
  ~~~
  
## TestCase JSON 格式

~~~
{
  // 这个文件的测试用例的描述	
  "description": "文件相关测试:", //必选
  
  // 这个测试文件中用到的帐号和密码  
  "accounts": {
    "test@test.com": "123123"   //必选  
  },
  
  // 这个测试文件测试 api 的 host
  "rooturl": "https://api.test.cn", 	//必选
  
  // 超时时间 毫秒
  "timeout": 20000  //可选

  // 设置默认的参数 在后面可以使用 
  "defaultVariable": {
  	 "fileid": 123123123     //可选
  },
  
  // 具体的测试用例
  "testcases": [     //必选
    {
      //调用这个 API 的帐号, 会调用 test.auth 方法获取 cookie
      "account": "test@test.com", 	//必选
      
      //这个 testcase 的描述信息       
      "description": "企业用户创建 card 新测试用 group",  //必选
       
      // http method, 目前支持 GET POST PUT DELETE 四种方法
      "method": "GET",  //可选 默认为 GET
      
      //测试的 api path, 可以使用参数 		
      "path": "/api/file/{fileid}", //必选
      
      // 期待的 http status		
      "status": 200,  //必选
      
      // request header, 可以使用参数 
      "headers": {    	//可选
        "name": "testfile"  
      },
      
      // request body, 可以使用参数 
      "body": {    			//可选
        "name": "testfile"  
      },
      
      // 验证返回值,可以使用参数
      "assert": {       //可选

        // 断言方式 目前有6种 //目前断言分6种, equal, notEqual, less, greater, exist, notExist, exist 和 notExist 的 value 设置为 "" 即可
        "equal": {
        
          // 这里可以使用 . 语法获取 response body 中的数据     
          "file.file_type":  "normal",
          "file.name": "testfile"
        }
      },
      
      // 设置参数, 设置一个 testVariable 的参数, 在后面的测试中可以使用 eg {testVariable}

      "variable": {     //可选
        "testVariable": "file.name"
      }
    }
  ]
}

~~~
  
## 点语法表示路径
在 variable 的 value 中, 和 在 assert 的 key 中可以使用点语法表示层级
点语法中可以使用以下一种特殊写法

~~~
"variable": {
        "a": "file.names.(count)",   // 调用 该参数的 length 方法, 可去数组数据个数
        "b": "file.type.(length)",   // 调用 该参数的 length 方法, 可去字符串长度
        "c": "file.names.(1).name",       // 调用 该参数 [1] 方法 可以取数组数据
      }
~~~

## 如何使用参数
在 account, path , header 的 value, body 的 value, assert 的 value 中 可以使用 参数  
使用方法如下

~~~

// fileid = 111
// groupid = 222
// used = 10000
...
"account": "{test-account-1}",
...
"path": "/api/files/{fileid}" // 把 {fileid} 替换成 111, path = "/api/files/111"
...
"body": {
  "groupid": "{groupid}", //如果只有一个转换参数,则直接返回参数 groupid = 222
  "used": "{used}[-1000]" //如果只有一个转换参数,且为 number, 可以在结尾使用 [] 来进行 加减操作 groupid = (10000 - 1000)

  "fileidstring": "{fileid.(string)}" //如果参数类型不一样, 可以使用 .(string) 这种语法进行转换
  // 转换一共有三种 .(string|number|boolean)
}
...
~~~



