const Router = require('koa-router');
const controllers = require('../lib/mounter').controllers;

let router = new Router();

router.get('/', async ctx => {
    ctx.body = { name: 'hello koa-web-template' };
});


router.get('/api/users/list', controllers.api.userController.getUserList)
router.post('/api/users/add', controllers.api.userController.addUser)
router.post('/api/users/update', controllers.api.userController.updateUser)
router.get('/api/redis/test', controllers.api.userController.redisTest)
module.exports = router;
