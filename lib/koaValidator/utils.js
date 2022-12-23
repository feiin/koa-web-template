/**
 * 由https://github.com/luckcoding/koa-middle-validator
 * 移植过来，更好适配koa2
 * 此库由express-validator fork过来的, 底层采用validator封装
 * see href=https://github.com/express-validator/express-validator
 */

let validator = require('validator');

module.exports = exports = {};

// Convert nested params as array into string for output
// Ex: ['users', '0', 'fields', 'email'] to 'users[0].fields.email'
exports.formatParamOutput = function formatParamOutput(param) {
    if (Array.isArray(param)) {
        param = param.reduce(function (prev, curr) {
            let part = '';
            if (validator.isInt(curr)) {
                part = '[' + curr + ']';
            } else if (prev) {
                part = '.' + curr;
            } else {
                part = curr;
            }

            return prev + part;
        });
    }

    return param;
};

/**
 * 装配错误结果
 * @param {Object} obj 对象
 * @param {Array} errors 错误信息
 * @return obj
 */
exports.decorateAsValidationResult = function decorateAsValidationResult(obj, errors) {
    let onlyFirstError = false;

    obj.isEmpty = function isEmpty() {
        return !errors.length;
    };

    obj.array = function allErrors() {
        let used = {};
        return !onlyFirstError ? errors : errors.filter(function (error) {
            if (used[error.param]) {
                return false;
            }

            used[error.param] = true;
            return true;
        });
    };

    obj.mapped = function mappedErrors() {
        return errors.reduce(function (mapping, error) {
            if (!onlyFirstError || !mapping[error.param]) {
                mapping[error.param] = error;
            }

            return mapping;
        }, {});
    };

    obj.useFirstErrorOnly = function useFirstErrorOnly(flag) {
        onlyFirstError = flag === undefined || flag;
        return obj;
    };

    obj.throw = function throwError() {
        if (errors.length) {
            throw decorateAsValidationResult(new Error('Validation failed'), errors);
        }
    };

    return obj;
};
