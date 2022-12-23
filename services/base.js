
/**
 * services Base基类
 * 构造函数初始化db,logger属性
 */
class Base {
    constructor(context) {

        this.configs = context.configs;
        this.context = context;
        this.mysql = context.mysql;
        this.mssql = context.mssql;
        this.logger = context.logger;
        this.redis = context.redis;
    }
}

module.exports = Base;
