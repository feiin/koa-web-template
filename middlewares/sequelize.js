
const Db = require('../lib/db/database');

/**
 * sequelize 数据库中间件
 * @param {object} config  数据库配置
 * @return async func(ctx, next)
 */
function sequelizer(config) {

    let mysql = null, mssql = null;
    if (config.mysql) {
        mysql = new Db('mysql', config);
        global.mysql = mysql;
    }

    if (config.mssql) {
        mssql = new Db('mssql', config);
        global.mssql = mssql;
    }


    //设置到global

    return async function (ctx, next) {
        if (ctx.context) {
            ctx.context.mssql = global.mssql;
            ctx.context.mysql = global.mysql;
        }
        await next();
    };

}

module.exports = sequelizer;
