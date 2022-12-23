const defaultCodes = require('./httpcode/http.json');
const codes = require('./httpcode/codes.js');

let statuses = Object.create(null);

/**
 * map status code
 * @param {Object} statuses
 * @param {Object} codes
 */
function statusesMap(statuses, codes) {

    Object.keys(codes).forEach((code) => {
        let message = codes[code];
        let status = Number(code);
        statuses[status] = message;

    });
}

statusesMap(statuses, defaultCodes);// 默认状态码
statusesMap(statuses, codes); // 业务codes

module.exports = statuses;

