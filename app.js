const Koa = require('koa');
const app = new Koa();
const { routers } = require('./lib/mounter');
const bodyparser = require('koa-bodyparser');


app.use(bodyparser({
    enableTypes: ['json', 'form']
}));

app.proxy = true;

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