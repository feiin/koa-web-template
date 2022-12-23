function requestLogger() {
    /**
     * 日志中间件
     * @param {ctx} ctx
     * @param {func} next
     */
    return async function (ctx, next) {
        const context = ctx.context;
        const logger = context.logger;

        if (!ctx.inProduction) {
            const requestData = {
                ip: ctx.ip,
                method: ctx.method,
                href: ctx.originalUrl,
                headers: ctx.headers,
                query: ctx.query,
                body: ctx.request.body
            };
            logger.debug('request:', requestData);
        }
        await next();
    };
}

module.exports = requestLogger;
