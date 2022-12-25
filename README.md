# koa-web-template
A node.js framework base on koa

基于koa的web框架

## 说明

- controllers 控制器代码逻辑
- middlewares 中间件
- routes  API路由定义
- services 数据库操作等逻辑
- 包含多数据库实例管理连接
- 多redis实例管理
- bunyan 日志
- apidoc 生成api文档
 

 ## getting start

 ```
 npm i -g kgen # 安装脚手架工具
 kgen init # 根据引导生成项目koa-web-template
 npm i
 npm run dev
 ```

 ## tests

 单元测试
 ```
 npm i -g mocha
 npm test  跑所有的
 mocha test/api/user.controller.test.js --grep getuserlist  跑单独API getuserlist测试

 ```

 ## run

 ```
 npm run dev  # for development

 pm2 start ./pm2/pm2_production.json  # for pm2
 ```


## deploy


```
npm i -g shipit-cli

shipit test deploy #deploy to test server
shipit production deploy # deploy to production
```