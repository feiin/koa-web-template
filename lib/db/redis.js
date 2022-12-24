const utils = require('../utils');
const Redis = require('ioredis');


// cache for redis instances
const redisInstances = {};

/**
 * Redis连接池封装
 *
 */
class RedisDb {
    /**
     * 构造Db
     * @param {String} config  config配置内容
     */
    constructor(config) {

        if (!config.redis) {
            throw new Error('redis config Error');
        }
        this._config = config.redis;
        this._redisInstances = [];
        this.init();
    }

    init() {

        // get all client's keys
        for (let k of Object.keys(this.config.clients)) {
            if (this.config.clients[k].host) {
                // 指名了redis host才默认初始化连接
                this._redisInstances.push(k);
            }
        }

        // created & cached database instances of redis
        this.databases.forEach(database => {
            this.createClient(database);
        });

    }

    /**
     * 创建Redis Client
     * @param {string} databasae
     */
    createClient(database) {

        let options = this._parseConfig(database);
        if (!options || !options.host) {
            console.warn('redis配置不存在', database, options);
            return null;
        }

        if (options.cluster === true && !config.nodes) {
            console.warn('redis配置错误', database, options);
            return null;
        }

        let client = null;
        if (options.cluster === true) {
            // 兼容集群模式
            client = new Redis.Cluster(config.nodes, options);
            client.on('connect', function () {
                console.info('cluster connect success');
            });
            client.on('error', function (error) {
                console.error(error);
            });

        } else {
            // 创建redis实例
            client = new Redis(options);
            client.on('connect', function () {
                console.info('redis connect success', options);
            });
            client.on('error', function (error) {
                console.error('error', error);
            });
        }

        redisInstances[database] = client;
        return client;
    }

    /**
     * @example use('key')
     *    key 表示直接使用config key配置连接
     * @param {String} database 配置名称
     * @return {Redis} RedisClient redis实例
     *
     */
    use(database) {
        let db = redisInstances[database];
        if (!db) {
            // 不存在则动态redis连接
            db = this.createClient(database);
        }
        return db;
    }

    /**
     * 解析配置
     * @param {String} database
     */
    _parseConfig(database) {

        if (!database) {
            return null;
        }

        // db
        let db = database;
        let config = utils.getClientConfig(this.config, db);

        return config;
    }

    get databases() {
        return this._redisInstances;
    }

    get config() {
        return this._config;
    }

    closeAll() {
        // 释放所有数据库连接池
        let closeConns = [];
        for (let key in redisInstances) {
            redisInstances[key] = null;
        }
        return Promise.all(closeConns);
    }

};

module.exports = RedisDb;
