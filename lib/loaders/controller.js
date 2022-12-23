const is = require('is-type-of');
const BaseController = require('../baseController');

/**
 * convert the Controller to a object with middlewares
 * @param {Class} Controller
 */
function wrapControllerClass(Controller) {
    let proto = Controller.prototype;
    const ret = {};

    // 如果不是继承BaseController
    // 继承BaseController则contronller中表示存在多个处理请求方法
    if (Object.getPrototypeOf(Controller) !== BaseController) {
        return undefined;
    }

    // tracing the prototype chain
    while (proto !== Object.prototype) {
        const keys = Object.getOwnPropertyNames(proto);
        for (const key of keys) {
            // getOwnPropertyNames will return constructor
            // that should be ignored
            if (key === 'constructor') {
                continue;
            }

            // skip getter, setter & non-function properties
            const d = Object.getOwnPropertyDescriptor(proto, key);

            // prevent to override sub method
            if (is.function(d.value) && is.asyncFunction(d.value) && !ret.hasOwnProperty(key)) {
                ret[key] = methodToMiddleware(Controller, key);
            }
        }
        proto = Object.getPrototypeOf(proto);
    }
    return ret;

    /**
     * Convert method to middlewares
     * @param {Class} Controller Controller
     * @param {String} key 方法名称
     */
    function methodToMiddleware(Controller, key) {

        return async function classControllerMiddleware(ctx, next) {

            const controller = new Controller(ctx.context);
            await controller[key](ctx, next);
        };
    }

    /**
     * Convert Handler to middlewares
     * @param {Class} Handler Handler
     */
    function handlerToMiddleware(Handler) {

        return async function classHandlerMiddleware(ctx, next) {

            const controller = new Handler(ctx.context);
            await controller.execute(ctx, next);
        };
    }
}

module.exports = function (exportObj, options, name) {


    if (is.class(exportObj)) {
        // mounter Controller
        options.exports.__defineGetter__(name, () => {
            return wrapControllerClass(exportObj);
        });
    } else {

        options.exports.__defineGetter__(name, () => {
            return exportObj;
        });
    }
};
