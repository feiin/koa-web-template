# koa-web-template
A web framework base on koa

基于koa的web框架

## 说明

- controllers
- middlewares
- routes
- services 
- 包含多数据库实例管理连接
- 多redis实例管理
- bunyan 日志
- apidoc 生成api文档
 

 ## tests

 单元测试
 ```
 npm i -g mocha
 npm test  跑所有的
 mocha test/api/user.controller.test.js --grep getuserlist  跑单独API getuserlist测试

 ```