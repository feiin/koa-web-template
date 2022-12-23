/**
 * config config中间件
 * @param {ctx} ctx
 * @param {object} next
 */

function httpError() {

    return async function (ctx, next) {
        await next();

        // ctx.status = 500  //会将错误重置统一输出
        if (ctx.inProduction && ctx.status === 500) {
            if (ctx.body && ctx.body.msg) {
                ctx.body.msg = '服务器内部错误,请重试!';
            } else if (ctx.body && ctx.body.message) {
                ctx.body.message = '服务器内部错误,请重试!';
            }
        }
    };
}
module.exports = httpError;
