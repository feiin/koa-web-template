
/**
 * create child logger for each request
 *
 * @param {bunyun} rootLogger
 */

function logger(rootLogger) {

    return async function (ctx, next) {
        let context = ctx.context,
            requestLine;

        requestLine = ctx.method + ' ' + ctx.url + ' HTTP/' + ctx.req.httpVersion;
        context.logger = rootLogger.child({
            ip: ctx.ip,
            'request-id': ctx.get('x-request-id') || '-',
            'request-line': requestLine
        }, true);

        await next();
    };
}
module.exports = logger;
