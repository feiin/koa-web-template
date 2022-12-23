const Router = require('koa-router');

let router = new Router();

router.get('/', async ctx => {
    ctx.body = { name: 'hello koa-web-template' };
});

module.exports = router;
