const statues = require('./statues');

/**
 *
 * BaseController
 */
class BaseController {

    constructor(context) {
        this.context = context;
        this.configs = context.configs;
        this.logger = context.logger;
        this.services = context.services;
    }

    /**
     * respond 构造响应body
     * @param {Object} data
     * @param {Status} status
     * @param {String} message
     */
    respond(data, status = 0, message) {
        if (message === undefined) {
            message = this.status(status);
        }
        return { data: data, status: status, message: message };
    }

    /**
     * 根据code取状态码对应的message
     * @param {Int} code
     */
    status(code) {
        return statues[code];
    }

    async validatorParams(ctx) {

        let errors = await ctx.getValidationResult();
        if (!errors.isEmpty()) {
            // ctx.status = 422;
            ctx.body = this.respond(null, 422, errors.array()[0].msg);
            this.logger.warn('validate error', errors.array());
            return false;
        }
        return true;
    }

}

module.exports = BaseController;
