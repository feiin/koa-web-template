const statues = require('./statuses');

/**
 * 构造响应respond body
 * @param {Any} data
 * @param {Int} status default(0)
 * @param {String} message default('')
 * @return {Object} result { data: data, status: status, message: message }
 * @api public
 */
function respond(data, status = 0, message) {
    if (message === undefined) {
        message = statues[status];
    }
    return { data: data, status: status, message: message };
}


module.exports = respond;
