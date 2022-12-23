const services = require('../lib/mounter').services;


/**
   * service 中间件
   * @param {object} ctx
   * @param {func} next
   */
function service() {

    return async function (ctx, next) {
        let context = ctx.context;
        if (context) {
            context.services = services;
        }
        await next();
    };
}

module.exports = service;
