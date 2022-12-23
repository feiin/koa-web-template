module.exports = function (router, options) {
    // console.log('router loader', router, options);
    if (!options.app) {
        throw new Error('options must has koa\'s app property');
    }
    options.app.use(router.routes());
};
