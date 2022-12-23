const cluster = require('cluster');
const crypto = require('crypto');

const utils = {

    /**
     * 得到client配置
     *
     * @example  getClientConfig(db1) 则会将default和db1合并的配置结果
     *
     * 配置结构如下：
     *
     * config = {
     *      clients: {
     *          db1: {},
     *          db2: {}
     *      }
     *      default: {
     *        .....
     *      }
     * }
     * @param {String} clientName - 键值
     * @return {String} 配置结果
     * @api public
     */
    getClientConfig(config, clientName) {
        if (!config.clients) {
            return undefined;
        }

        let defaultConfig = config.default || {};
        let client = config.clients[clientName];
        if (!client) {
            // 找不到默认用默认配置动态连接数据库
            return Object.assign({ database: clientName }, defaultConfig);
        }

        // merge default config with client
        return Object.assign({}, defaultConfig, client);

    },

    /**
     * 判断进程是否在Master上
     *@api public
     *@return {Boolean} isMaster
     */
    isMasterProcess() {

        // console.debug('process.env', process.env);
        if (process.env && process.env.pm_id) {
            //in pm2
            console.debug(`process.env.pm_id: ${process.env.pm_id}, process.env.NODE_APP_INSTANCE: ${process.env.NODE_APP_INSTANCE}`);

            if (process.env.NODE_APP_INSTANCE === '0') {
                console.debug(`master pm2 process, id is: ${process.pid}`);
                return true;
            }
            return false;
        }
        return cluster.isMaster;
    },

    /**
     * 判断进程是否在pm_id上
     *@api public
     *@param {String} pmId pm2进程编号 0,1,2,3,4,5 [CPU有几核则有多少]
     *@return {Boolean} isOnProcess
     */
    isOnProcess(pmId) {

        // console.debug('process.env', process.env);
        if (process.env && process.env.pm_id) {
            //in pm2
            console.debug(`process.env.pm_id: ${process.env.pm_id}, process.env.NODE_APP_INSTANCE: ${process.env.NODE_APP_INSTANCE}`);

            if (process.env.NODE_APP_INSTANCE === pmId) {
                console.debug(`master pm2 process, id is: ${process.pid}`);
                return true;
            }
            return false;
        }
    },

    /**
     * 格式化大写类首字母
     * @param {String} name
     * @return {String}
     * @api public
     *
     */
    capitalizeClassName(name) {
        return name.replace(/\b[a-z]/g, char => char.toUpperCase());
    },

    /**
     * 判断fn 是否为class
     * @param {fn} fn
     * @api public
     * @return {Boolean} 是否为Class
     */
    isClass(fn) {

        let toString = Function.prototype.toString;
        return (typeof fn === 'function' &&
            /^class\s/.test(toString.call(fn)));
    },

    /**
     * 是否为async function
     * @param {Object} obj
     * @api public
     * @return {Boolean} 是否为async func
     */
    isAsyncFunction(obj) {
        return obj
            && obj.constructor
            && 'AsyncFunction' === obj.constructor.name;
    },

    /**
     * 是否为generator function
     * @param {Object} obj
     * @api public
     * @return {Boolean} 是否为generator func
     */
    isGeneratorFunction(obj) {
        return obj
            && obj.constructor
            && 'GeneratorFunction' === obj.constructor.name;
    },

    /**
     * 从ids字符串中转化为Array数组 1,2,3,4  => [1,2,3,4]
     * @param {String} ids
     * @param {Boolean} removeRepeat
     */
    getArrayIds(ids, removeRepeat = true) {
        if (ids === null | ids === undefined) {
            return [];
        }

        if (ids.length === 0) {
            return [];
        }

        let strIds = ids.split(',');
        if (removeRepeat) {
            return [...new Set(strIds)];
        } else {
            return strIds;
        }
    },

    /**
     *
     * @param {String} ids
     * @param {Boolean} removeRepeat
     */
    getIntArrayIds(ids, removeRepeat = true) {
        if (ids === null | ids === undefined) {
            return [];
        }

        if (ids.length === 0) {
            return [];
        }

        let map = new Map();
        const arr = [];
        let strIds = ids.split(',');
        strIds.forEach(a => {
            if (!map.has(a)) {
                let i = parseInt(a, 10);
                if (i > 0) {
                    arr.push(i);
                    map.set(a, 1);
                }
            }
        });
        return arr;
    },

    /**
     * md5 加密
     * @param {String} input
     */
    md5(input) {
        const hash = crypto.createHash('md5');
        return hash.update(input).digest('hex');
    },

    /**
     * delay N ms
     * @param {Number} millisecond
     */
    async delay(millisecond) {
        if (millisecond <= 0) {
            return Promise.resolve(0);
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, millisecond);
        });
    },

    /**
     * 获取客户端真实IP
     * @param {Object} ctx
     */
    getClientIP(ctx) {
        // let clientIP = ctx.get('x-real-ip');
        // if (clientIP) {
        //     return clientIP;
        // }
        // clientIP = ctx.get('http_cdn_src_ip');
        // if (clientIP) {
        //     return clientIP;
        // }
        let clientIP = ctx.ip;
        if (clientIP.indexOf(':ffff') >= 0) {
            //IPv4-compatible address
            let parts = clientIP.split(':');
            clientIP = parts[parts.length - 1];
        }
        return clientIP;
    },

    /**
     * Rsa签名
     * @param {*} str
     * @param {*} privateKey
     * @param {*} signType
     */
    rsaSign(str, privateKey, signType) {
        let sha;
        if (signType === 'RSA2') {
            sha = crypto.createSign('RSA-SHA256');
        } else {
            sha = crypto.createSign('RSA-SHA1');
        }
        sha.update(str, 'utf8');
        return sha.sign(privateKey, 'base64');
    },

    /**
     *  rsa签名校验
     * @param {*} str
     * @param {*} sign
     * @param {*} publicKey
     * @param {*} signType RSA2(RSA-SHA256)/RSA-SHA1
     */
    rsaSignVerify(str, sign, publicKey, signType) {
        let verify;
        if (signType === 'RSA2') {
            verify = crypto.createVerify('RSA-SHA256');
        } else {
            verify = crypto.createVerify('RSA-SHA1');
        }
        verify.update(str, 'utf8');
        let result = verify.verify(publicKey, sign, 'base64');
        return result;
    },

    /**
     * 获取排序后的Object,按属性键值排序
     * @param {Object} obj
     */
    getSortObj(obj) {
        return Object.keys(obj).sort().reduce((r, k) => (r[k] = obj[k], r), {});
    },

    /**
     * Object按Keys排序后组成QueryString
     */
    objectToSortQuery(obj, encode = false) {

        let keys = Object.keys(obj);
        let query = [];
        keys.sort();
        for (let i = 0, l = keys.length; i < l; ++i) {
            let p = keys[i];
            let v = obj[p];
            query.push(p + '=' + (encode ? encodeURIComponent(v) : v));
        }
        return query.join('&');
    },

    /**
     * 解密aes
     * @param {String} algorithm 算法，例如:aes-128-cbc
     * @param {String} key 秘钥, utf8|Buffer
     * @param {String} iv  iv, utf8|Buffer
     * @param {String} data 加密的数据 Base64|Buffer
     * @param {String} [inputEncoding=base64] 输入编码 base64|latin1|hex|null,  If the inputEncoding argument is not given, data must be a Buffer
     * @param {String} [outputEncoding=utf8] 输出编码  utf8|latin1|ascii
     * @param {Boolean} [autoPadding=true] autoPadding
     */
    decryptAes(algorithm, key, iv, data, inputEncoding = 'base64', outputEncoding = 'utf8', autoPadding = true) {

        try {

            let decipher = crypto.createDecipheriv(algorithm, key, iv);

            // 设置自动 padding 为 true，删除填充补位
            decipher.setAutoPadding(autoPadding);
            let decoded = decipher.update(data, inputEncoding, outputEncoding);
            decoded += decipher.final(outputEncoding);

            return decoded;
        } catch (e) {
            console.error('decode token error', e);
            throw e;
        }
    },

    /**
     *
     * @param {String} algorithm 算法，例如:aes-128-cbc
     * @param {String} key 秘钥,utf8|Buffer
     * @param {String} iv  iv,utf8|Buffer
     * @param {String|Buffer} data 需要加密的数据 utf8|Buffer
     * @param {String} [inputEncoding=utf8] 输入编码 utf8|ascii|latin1|null, If the inputEncoding argument is not given, data must be a Buffer
     * @param {String} [outputEncoding=base64] 输出编码  base64|hex|latin1,default:base64
     * @param {Boolean} [autoPadding=true] autoPadding default=true
     */
    encryptAes(algorithm, key, iv, data, inputEncoding = 'utf8', outputEncoding = 'base64', autoPadding = true) {
        try {

            let cipher = crypto.createCipheriv(algorithm, key, iv);

            // 设置自动 padding 为 true，删除填充补位
            cipher.setAutoPadding(autoPadding);
            let encoded = cipher.update(data, inputEncoding, outputEncoding);
            encoded += cipher.final(outputEncoding);

            return encoded;
        } catch (e) {
            console.error('encryptAes error', e);
            throw e;
        }
    },
    /**
    * 生成随机长度代码0-Z
    * @param {*} len 
    */
    generateHash(len) {
        var hash = "";
        for (; hash.length < len; hash += Math.random().toString(36).substr(2));
        return hash.substr(0, len);
    }


};

module.exports = utils;
