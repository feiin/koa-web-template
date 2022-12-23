const configPath = '../configs/' + (process.env.NODE_ENV || 'development') + '';
const configs = require(configPath);
const http = require('http');

const testUrl = true;
let server = null;

if (testUrl) {
    server = 'http://' + configs.host + ':' + configs.port;
} else {
    //for mocha testing
    configs.log.level = 'error';
    let log = console.log;
    const app = require('../app.js');
    console.log = log;
    server = http.createServer(app.callback());
}

module.exports = {
    testUrl: testUrl,
    server: server,
    release: () => {
        if (!testUrl) {
            return global.db.closeAll();
        }
        return Promise.resolve();
    }
};
