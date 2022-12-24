const BaseController = require('../../lib/baseController');

class UserController extends BaseController {


    /**
    * @api {GET} /v1/getusers
    * @apiGroup users
    * @apiVersion 1.0.0
    * @apiSuccess {Number} status 状态码0
    * @apiSuccess {String} message 消息
    * @apiSuccess {Object} user  user信息
    * @apiSuccess {String} user.name  user名称
    * @apiSuccess {Number} user.id  用户id
    * @apiSuccessExample {json} Success-Response:
    *     HTTP/1.1 200 OK
    *     {
    *       "status": 0,
    *       "user":  [{
    *           id:0,
    *           name:'name'
    *       }]
    *     }
    */
    async getUserList(ctx, next) {

        // ctx.checkQuery('user_id').notEmpty().withMessage('无效的名称');
        // let errors = await ctx.getValidationResult();
        // if (!errors.isEmpty()) {
        //     ctx.status = 422;
        //     ctx.body = this.respond(null, 422, errors.array());
        //     logger.warn('validate error', errors.array());
        //     return false;
        // }

        this.logger.info('getUserList', ctx.request.body);
        try {
            let userService = new this.services.User(this.context);
            let result = await userService.getUserList();
            ctx.body = this.respond(result, 0, 'ok');
        } catch (e) {

            this.logger.error('getUserList', e);
            ctx.body = this.respond(0, 301, e.message);
            ctx.status = 500;
        }
    }



    /**
     * @api {POST} /api/users/add  addusr
     * @apiGroup users
     * @apiVersion 1.0.0
     * @apiParam {String} name name of user
     * @apiSuccess {Number} status 状态码0
     * @apiSuccess {String} message 消息
     * @apiSuccess {Object} user  user信息
     * @apiSuccess {String} user.name  user名称
     * @apiSuccess {Number} user.id  用户id
     * @apiSuccessExample {json} Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "status": 0,
     *       "user":  {
     *           id:0,
     *           name:'name'
     *       }
     *     }
     */
    async addUser(ctx, next) {

        ctx.checkBody('username').notEmpty().withMessage('无效的名称');
        let errors = await ctx.getValidationResult();
        if (!errors.isEmpty()) {
            ctx.status = 422;
            ctx.body = this.respond(null, 422, errors.array());
            this.logger.warn('validate error', errors.array());
            return false;
        }

        this.logger.info('add users', ctx.request.body);
        try {
            let userService = new this.services.User(this.context);
            let result = await userService.addUser(ctx.request.body);
            ctx.body = this.respond(result, 0, 'ok');
        } catch (e) {

            this.logger.error('add users', e);
            ctx.body = this.respond(0, 500, e.message);
        }
    }


    /**
     * @api {POST} /api/users/update  updateuser
     * @apiGroup users
     * @apiVersion 1.0.0
     * @apiParam {String} username username of user
     * @apiParam {Number} id id of user
     * @apiSuccess {Number} status 状态码0
     * @apiSuccess {String} message 消息
     * @apiSuccess {Object} user  user信息
     * @apiSuccess {String} user.name  user名称
     * @apiSuccess {Number} user.id  用户id
     * @apiSuccessExample {json} Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "status": 0,
     *       "user":  {
     *           id:0,
     *           name:'name'
     *       }
     *     }
     */
    async updateUser(ctx, next) {

        ctx.checkBody('username').notEmpty().withMessage('无效的名称');
        ctx.checkBody('id').isInt({ min: 1 }).withMessage('无效的名称');
        let errors = await ctx.getValidationResult();
        if (!errors.isEmpty()) {
            ctx.status = 422;
            ctx.body = this.respond(null, 422, errors.array());
            this.logger.warn('validate error', errors.array());
            return false;
        }

        this.logger.info('update users', ctx.request.body);
        try {
            let userService = new this.services.User(this.context);
            let result = await userService.updateUser(ctx.request.body);
            ctx.body = this.respond(result, 0, 'ok');
        } catch (e) {

            this.logger.error('update users', e);
            ctx.body = this.respond(0, 500, e.message);
        }
    }


    async redisTest(ctx) {

        //get instances
        let redis = this.context.redis.use('tests');
        // console.log('redis', redis)
        await redis.set('ttt', 1)
        let v = await redis.get('ttt');

        ctx.body = this.respond(v, 0, 'ok');
    }
}

module.exports = UserController;
