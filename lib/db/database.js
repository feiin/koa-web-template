const utils = require('../utils');
const SequelizeAdpter = require('./sequelizeAdpter');
const Sequelize = require('sequelize');

// cache for db instances
const cachedInstances = {};

/**
 * 数据库连接池封装
 *
 */
class Db {
    /**
     * 构造Db
     * @param {String} dbType  mysql|mssql
     * @param {String} config  config配置内容
     */
    constructor(dbType, config) {

        if (!config[dbType]) {
            throw new Error(dbType + 'config Error');
        }
        this._config = config[dbType];
        this._databaseInstances = [];
        this.dbType = dbType;
        cachedInstances[dbType] = {};
        this.init();
    }

    init() {

        // get all client's keys
        for (let k of Object.keys(this.config.clients)) {
            if (this.config.clients[k].database) {
                // 指名了database才默认初始化连接
                this._databaseInstances.push(k);
            }
        }

        // created & cached each database instances of Sequelize
        this.databases.forEach(database => {
            this.createClient(database);
        });

    }

    /**
     * 创建Db Client
     * @param {string} databasae
     */
    createClient(database) {

        let options = this._parseConfig(database);
        if (!options || !options.database) {
            console.warn('database 不存在或者未指名数据库', database, options);
            return null;
        }
        this.dialectModule = options.dialectModule;

        let sequelize = new Sequelize(options.database, options.user, options.password, options);
        sequelize
            .authenticate()
            .then(() => {
                //just auth testing
                console.info('Connection has been established.. successfully.', this.dbType, database);
            })
            .catch(err => {
                console.error('Unable to connect to the database:', this.dbType, err, options.database);
            });

        cachedInstances[this.dbType][database] = sequelize;
        return sequelize;

    }

    /**
     * @example use('key')、use('key.database')
     *    key 表示直接使用config key配置连接
     *    key.database 表示使用key配置+database数据库连接
     * @param {String} database 数据库名称
     * @return {SequelizeAdpter} db 连接
     *
     */
    use(database) {
        let db = cachedInstances[this.dbType][database];
        if (!db) {
            // 不存在则动态创建数据库连接
            db = this.createClient(database);
        }

        return new SequelizeAdpter(db);

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
        let db = database, dbName = null;

        // support (instance.name) or (instance)
        if (database.indexOf('.') !== -1) {
            let arrs = database.split('.');
            db = arrs[0];
            dbName = arrs[1];
        };

        let config = utils.getClientConfig(this.config, db);
        if (dbName) {
            config.database = dbName; // 此情况说明指名了instance.database
        }

        return config;
    }

    get databases() {
        return this._databaseInstances;
    }

    get config() {
        return this._config;
    }

    closeAll() {
        // 释放所有数据库连接池
        let closeConns = [];
        for (let key in cachedInstances[this.dbType]) {
            closeConns.push(cachedInstances[this.dbType][key].close());
            cachedInstances[this.dbType][key] = null;
        }
        return Promise.all(closeConns);
    }

};

module.exports = Db;
