const Redis = require('../lib/db/redis');

function redisConnector(config) {

    let redis = new Redis(config);
    global.redis = redis;

    /**
     * redis 连接中间件
     * @param {ctx} ctx
     * @param {func} next
     */
    return async function (ctx, next) {

        if (redis) {
            ctx.context.redis = redis;
            await next();
            return;
        }

        await next();
    };
}

module.exports = redisConnector;
