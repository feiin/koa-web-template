const Koa = require('koa');
const app = new Koa();
const { routers, middlewares } = require('./lib/mounter');
const bodyparser = require('koa-bodyparser');
const bunyan = require('bunyan'); // using bunyan for logger
let configPath = './configs/' + process.env.NODE_ENV + '';
const configs = require(configPath);
const koaValidator = require('./lib/koaValidator');


app.use(bodyparser({
    enableTypes: ['json', 'form']
}));

app.proxy = true;

const rootLogger = bunyan.createLogger({
    name: 'test',
    level: configs.log.level || 'info',
    src: process.env.NODE_ENV !== 'production' // production need be false
});

/* console 将应用程序中console管道重定向到日志 */
console.error = rootLogger.error.bind(rootLogger);
console.warn = rootLogger.warn.bind(rootLogger);
console.info = rootLogger.info.bind(rootLogger);
console.log = rootLogger.debug.bind(rootLogger);
console.trace = rootLogger.trace.bind(rootLogger);

app.use(middlewares.context()); // context中间件, 挂载至ctx.context
app.use(middlewares.config()); // 配置文件中间件
app.use(middlewares.logger(rootLogger)); // 日志中间件
app.use(middlewares.httpError()); // 500错误中间件处理
app.use(middlewares.requestLogger()); // 请求日志
app.use(middlewares.sequelize(configs)); // 数据库中间件
// app.use(middlewares.redis(configs)); //redis 连接中间件，可以根据实际情况自行选择去留
app.use(middlewares.services()); // 数据服务访问 中间件
app.use(koaValidator());//验证参数中间件



// mounting all routes
routers(app);

if (process.env.NODE_ENV !== 'production') {
    app.use(require('koa-static')(__dirname + '/public'));
}


// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx);
});

module.exports = app;