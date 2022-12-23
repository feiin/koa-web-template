
const configPath = '../configs/' + process.env.NODE_ENV + '';
const configs = require(configPath);

/**
 * config config中间件
 * @param {ctx} ctx
 * @param {object} next
 */

function config() {

    return async function (ctx, next) {
        if (ctx.context) {
            ctx.context.configs = configs;
        }

        await next();
    };
}
module.exports = config;
