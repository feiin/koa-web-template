
/**
 * create context for each Koa request
 * @param {Object} defaults params
 */

function context(defaults) {
    const inProduction = (process.env.NODE_ENV === 'production');

    if (typeof defaults === 'undefined') {
        defaults = {};
    }
    if (typeof defaults !== 'object') {
        throw new Error('Invalid defaults');
    }

    return async function (ctx, next) {
        if (!ctx.context) {
            ctx.context = {};
            ctx.inProduction = inProduction;
            ctx.context.xRequestId = ctx.get('x-request-id');
            Object.keys(defaults).forEach(key => {
                ctx.context[key] = defaults[key];
            });
        }

        await next();
    };
}

module.exports = context;
