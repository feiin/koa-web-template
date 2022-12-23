/**
 * 由 seee href=https://github.com/luckcoding/koa-middle-validator
 * 移植过来，更好适配koa2
 * 此库由express-validator fork过来的, 底层采用validator封装
 * see href=https://github.com/express-validator/express-validator
 */

let validator = require('validator');
let _ = require('lodash');
let utils = require('./utils');

// When validator upgraded to v5, they removed automatic string coercion
// The next few methods (up to validator.init()) restores that functionality
// so that express-validator can continue to function normally
validator.extend = function (name, fn) {
    validator[name] = function () {
        let args = Array.prototype.slice.call(arguments);
        args[0] = validator.toString(args[0]);
        return fn.apply(validator, args);
    };
};

validator.init = function () {
    for (let name in validator) {
        if (typeof validator[name] !== 'function' || name === 'toString' ||
            name === 'toDate' || name === 'extend' || name === 'init' ||
            name === 'isServerSide') {
            continue;
        }
        validator.extend(name, validator[name]);
    }
};

validator.toString = function (input) {
    if (typeof input === 'object' && input !== null && input.toString) {
        input = input.toString();
    } else if (input === null || typeof input === 'undefined' || (isNaN(input) && !input.length)) {
        input = '';
    }
    return '' + input;
};

validator.toDate = function (date) {
    if (Object.prototype.toString.call(date) === '[object Date]') {
        return date;
    }
    date = Date.parse(date);
    return !isNaN(date) ? new Date(date) : null;
};

validator.init();

// validators and sanitizers not prefixed with is/to
let additionalValidators = ['contains', 'equals', 'matches'];

/**
 * Initializes a chain of validators
 *
 * @class
 * @param  {(string|string[])}  param         path to property to validate
 * @param  {string}             failMsg       validation failure message
 * @param  {Request}            ctx           request to attach validation errors
 * @param  {string}             location      request property to find value (body, params, query, etc.)
 * @param  {object}             options       options containing error formatter
 */

function ValidatorChain(param, failMsg, ctx, location, options) {
    this.errorFormatter = options.errorFormatter;
    this.param = param;

    this.value = undefined;
    if (location && ['body'].includes(location)) {
        this.value = _.get(ctx.request[location], param);
    } else {
        this.value = _.get(ctx[location], param); // headers params
    }

    this.validationErrors = [];
    this.failMsg = failMsg;
    this.ctx = ctx;
    this.lastError = null; // used by withMessage to get the values of the last error
    return this;
}


/**
 * Adds validation methods to request object via express middleware
 *
 * @method koaValidator
 * @param  {object}         options
 * @return {function}       middleware
 */

let koaValidator = function (options) {
    options = options || {};
    let defaults = {
        customValidators: {},

        // customSanitizers: {},
        errorFormatter: function (param, msg, value) {
            return {
                param: param,
                msg: msg,
                value: value
            };
        }
    };


    _.defaults(options, defaults);

    // _.set validators and sanitizers as prototype methods on corresponding chains
    _.forEach(validator, function (method, methodName) {
        if (methodName.match(/^is/) || additionalValidators.includes(methodName)) {
            ValidatorChain.prototype[methodName] = makeValidator(methodName, validator);
        }
    });

    // 非空判断
    ValidatorChain.prototype.notEmpty = function () {
        return this.isLength({
            min: 1
        });
    };

    // 长度判断
    ValidatorChain.prototype.len = function () {
        return this.isLength(...arguments);
    };

    // 参数可选
    ValidatorChain.prototype.optional = function (opts) {
        opts = opts || {};

        // By default, optional checks if the key exists, but the user can pass in
        // checkFalsy: true to skip validation if the property is falsy
        let defaults = {
            checkFalsy: false
        };

        let options = _.assign(defaults, opts);

        if (options.checkFalsy) {
            if (!this.value) {
                this.skipValidating = true;
            }
        } else if (this.value === undefined) {
            this.skipValidating = true;
        }

        return this;
    };

    /**
     * 链式设置error的message
     * @param {String} message
     * @return {Object} this
     * @api public
     */
    ValidatorChain.prototype.withMessage = function (message) {
        if (this.lastError) {
            if (this.lastError.isAsync) {
                this.ctx._asyncValidationErrors.pop().catch(function () {
                    // Suppress errors from original promise - they should go to the new one.
                    // Otherwise bluebird throws an 'unhandled rejection' error
                });
                let error = formatErrors.call(this.lastError.context, this.lastError.param, message, this.lastError.value);
                let promise = this.lastError.promise.catch(function () {
                    return Promise.reject(error);
                });
                this.ctx._asyncValidationErrors.push(promise);
            } else {
                this.validationErrors.pop();
                this.ctx._validationErrors.pop();
                let errorMessage = formatErrors.call(this, this.lastError.param, message, this.lastError.value);
                this.validationErrors.push(errorMessage);
                this.ctx._validationErrors.push(errorMessage);
                this.lastError = null;
            }
        }
        return this;
    };

    _.forEach(options.customValidators, function (method, customValidatorName) {
        ValidatorChain.prototype[customValidatorName] = makeValidator(customValidatorName, options.customValidators);
    });


    /**
     * koaValidator 验证中间件
     */
    return async function koaValidatorMiddleware(ctx, next) {
        // let locations = ['body', 'params', 'query'];

        ctx._validationErrors = [];
        ctx._asyncValidationErrors = [];
        ctx.validationErrors = function (mapped, promisesResolved) {
            if (!promisesResolved && ctx._asyncValidationErrors.length > 0) {
                console.warn('WARNING: You have asynchronous validators but you have not used asyncValidateErrors to check for errors.');
            }

            if (mapped && ctx._validationErrors.length > 0) {
                let errors = {};
                ctx._validationErrors.forEach(function (err) {
                    errors[err.param] = err;
                });

                return errors;
            }

            return ctx._validationErrors.length > 0 ? ctx._validationErrors : false;
        };

        /**
         * 异步验证方法
         * @param {Boolean} mapped
         * @return {Promise} 返回promise, 错误请在catch中处理
         */
        ctx.asyncValidationErrors = function (mapped) {
            return new Promise(function (resolve, reject) {
                let promises = ctx._asyncValidationErrors;

                Promise.all(promises).then(result => {

                    if (ctx._validationErrors.length > 0) {
                        return reject(ctx.validationErrors(mapped, true));
                    }
                    resolve();

                }).catch(err => {
                    ctx._validationErrors.push(err);
                    return reject(ctx.validationErrors(mapped, true));
                });

            });
        };

        /**
         * 得到验证结果, await直接返回结果errors
         * @return {Promise} 返回promise, 永远是resolve状态,错误请判断结果 errors.isEmpty()
         * @api public
         */
        ctx.getValidationResult = function () {
            return new Promise(function (resolve, reject) {
                let promises = ctx._asyncValidationErrors;

                Promise.all(promises).then(result => {

                    return resolve(utils.decorateAsValidationResult({}, ctx._validationErrors));

                }).catch(err => {
                    ctx._validationErrors.push(err);
                    return resolve(utils.decorateAsValidationResult({}, ctx._validationErrors));
                });

            });
        };

        // locations.forEach(function (location) {
        //     ctx['check' + _.capitalize(location)] = function (param, failMsg) {
        //         if (_.isPlainObject(param)) {
        //             return validateSchema(param, ctx, location, options);
        //         }
        //         return new ValidatorChain(param, failMsg, ctx, location, options);
        //     };
        // });

        ctx.checkBody = function (param, failMsg) {
            if (_.isPlainObject(param)) {
                return validateSchema(param, ctx, 'body', options);
            }
            return new ValidatorChain(param, failMsg, ctx, 'body', options);
        };

        ctx.checkParams = function (param, failMsg) {
            if (_.isPlainObject(param)) {
                return validateSchema(param, ctx, 'params', options);
            }
            return new ValidatorChain(param, failMsg, ctx, 'params', options);
        };


        ctx.checkQuery = function (param, failMsg) {
            if (_.isPlainObject(param)) {
                return validateSchema(param, ctx, 'query', options);
            }
            return new ValidatorChain(param, failMsg, ctx, 'query', options);
        };

        /**
         * check headers
         * @param {String} param 键值
         * @param {String} failMsg 出错时返回错误信息
         */
        ctx.checkHeaders = function (param, failMsg) {
            if (_.isPlainObject(param)) {
                return validateSchema(param, ctx, 'headers', options);
            }

            if (param === 'referrer') {
                param = 'referer';
            }

            return new ValidatorChain(param.toLowerCase(), failMsg, ctx, 'headers', options);
        };

        /**
         * check [body, query, params]
         * @param {String} param 键值
         * @param {String} failMsg 出错时返回错误信息
         */
        ctx.check = function (param, failMsg) {
            if (_.isPlainObject(param)) {
                return validateSchema(param, ctx, 'any', options);
            }
            return new ValidatorChain(param, failMsg, ctx, locate(ctx, param), options);
        };

        // ctx.filter = ctx.sanitize;
        // ctx.assert = ctx.check;
        // ctx.validate = ctx.check;

        await next();
    };


};

/**
 * validate an object using a schema, using following format:
 *
 * {
 *   paramName: {
 *     validatorName: true,
 *     validator2Name: true
 *   }
 * }
 *
 * Pass options or a custom error message:
 *
 * {
 *   paramName: {
 *     validatorName: {
 *       options: ['', ''],
 *       errorMessage: 'An Error Message'
 *     }
 *   }
 * }
 *
 * @method validateSchema
 * @param  {Object}       schema    schema of validations
 * @param  {Request}      ctx       request to attach validation errors
 * @param  {string}       location  request property to find value (body, params, query, etc.)
 * @param  {Object}       options   options containing custom validators & errorFormatter
 * @return {object[]}               array of errors
 */

function validateSchema(schema, ctx, loc, options) {
    let locations = ['body', 'params', 'query', 'headers'],
        currentLoc = loc;
    for (let param in schema) {
        // check if schema has defined location
        if (schema[param].hasOwnProperty('in')) {
            if (locations.indexOf(schema[param].in) !== -1) {
                currentLoc = schema[param].in;
            } else {
                // skip params where defined location is not supported
                continue;
            }
        }
        currentLoc = currentLoc === 'any' ? locate(ctx, param) : currentLoc;
        let validator = new ValidatorChain(param, null, ctx, currentLoc, options);
        let paramErrorMessage = schema[param].errorMessage;

        let opts;

        if (schema[param].optional) {
            // validator.optional.apply(validator, schema[param].optional.options)
            if (Array.isArray(schema[param].optional.options)) {
                validator.optional(...schema[param].optional.options);
            } else {
                validator.optional(schema[param].optional.options);
            }

            //
            if (validator.skipValidating) {
                validator.failMsg = schema[param].optional.errorMessage || paramErrorMessage || 'Invalid param';
                continue; // continue with the next param in schema
            }
        }

        for (let methodName in schema[param]) {
            if (methodName === 'in') {
                /* Skip method if this is location definition, do not validate it.
                 * Restore also the original location that was changed only for this particular param.
                 * Without it everything after param with in field would be validated against wrong location.
                 */
                currentLoc = loc;
                continue;
            }

            if (methodName === 'errorMessage') {
                /**
                 * Also do not validate if methodName
                 * represent parameter error mesage
                 */
                continue;
            }

            validator.failMsg = schema[param][methodName].errorMessage || paramErrorMessage || 'Invalid param';

            opts = schema[param][methodName].options;

            if (opts !== null && !Array.isArray(opts)) {
                opts = [opts];
            }

            validator[methodName](...opts);
        }
    }
}

/**
 * Validates and handles errors, return instance of itself to allow for chaining
 *
 * @method makeValidator
 * @param  {string}          methodName
 * @param  {object}          container
 * @return {function}
 */

function makeValidator(methodName, container) {
    return function () {
        if (this.skipValidating) {
            return this;
        }

        let args = [];
        args.push(this.value);
        args = args.concat(Array.prototype.slice.call(arguments));

        let isValid = container[methodName](...args);

        // Perform string replacement in the error message
        let msg = this.failMsg;
        if (typeof msg === 'string') {
            args.forEach(function (arg, i) {
                msg = msg.replace('%' + i, arg);
            });
        }
        let error = formatErrors.call(this, this.param, msg || 'Invalid value', this.value);

        if (isValid.then) {
            let promise = isValid.catch(function () {
                return Promise.reject(error);
            });
            this.lastError = {
                promise: isValid,
                param: this.param,
                value: this.value,
                context: this,
                isAsync: true
            };
            this.ctx._asyncValidationErrors.push(promise);
        } else if (!isValid) {
            this.validationErrors.push(error);
            this.ctx._validationErrors.push(error);
            this.lastError = { param: this.param, value: this.value, isAsync: false };
        } else {
            this.lastError = null;
        }

        return this;
    };
}

/**
 * find location of param
 *
 * @method param
 * @param  {Request} ctx       express request object
 * @param  {(string|string[])} name [description]
 * @return {string}
 */

function locate(ctx, name) {
    if (_.get(ctx.params, name)) {
        return 'params';
    } else if (_.has(ctx.query, name)) {
        return 'query';
    } else if (_.has(ctx.request.body, name)) {
        return 'body';
    }

    // else if (_.has(ctx.headers, name)) {
    //   return 'headers';
    // }

    return undefined;
}

/**
 * format param output if passed in as array (for nested)
 * before calling errorFormatter
 *
 * @method param
 * @param  {(string|string[])} param       parameter as a string or array
 * @param  {string} msg
 * @param  {string} value
 * @return {function}
 */
function formatErrors(param, msg, value) {
    let formattedParam = utils.formatParamOutput(param);

    return this.errorFormatter(formattedParam, msg, value);
}

module.exports = koaValidator;

// module.exports.validator = validator;
// module.exports.utils = utils;
