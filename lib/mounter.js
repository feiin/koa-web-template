const fs = require('fs');
const path = require('path');
const { capitalizeClassName } = require('./utils');
const routerLoader = require('./loaders/router');
const controllerLoader = require('./loaders/controller');


/**
 * 目录加载器,按目录层次组装并加载
 *
 *      options:
 *            {
 *               {Object} exports 导出目标对象
 *               {String} directory 目录路径
 *               {Boolean} capitalizeClass 是否格式化类首字母(大写) default: false
 *               {Boolean} skipIndex 是否跳过index.js, 默认:true
 *               {Function} loader 自定义加载器
 *            }
 * @param {Object} options 参数
 * @api private
 *
 */
function loadDirectory(options) {

    let configs = Object.assign({ capitalizeClass: false, skipIndex: true }, options);
    let { exports, directory, capitalizeClass, skipIndex } = configs;

    fs.readdirSync(directory).forEach((filename) => {
        let fullPath,
            stat,
            match;

        // 跳过index.js
        if (skipIndex && (filename === 'index.js' || /^\./.test(filename))) {
            return;
        }

        fullPath = path.join(directory, filename);
        stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 递归加载文件夹
            exports[filename] = {};
            let opt = Object.assign({}, configs);
            opt.exports = exports[filename];
            opt.directory = fullPath;
            loadDirectory(opt);

        } else {
            match = /(\w+)\.js$/.exec(filename);
            if (match) {
                let name = capitalizeClass ? capitalizeClassName(match[1]) : match[1];

                // 如果自定义了加载器则调用加载器
                if (configs.loader) {
                    configs.loader(require(fullPath), configs, name);
                } else {
                    exports.__defineGetter__(name, () => {
                        return require(fullPath);
                    });
                }


            }
        }
        return exports;
    });
}

/**
 * 挂载对象
 */
let mounter = {

    // 中间件
    middlewares: {},
    services: {},
    controllers: {},
    routers: function (app) {
        console.log('app', app);

        // 加载路由
        loadDirectory({
            exports: {},
            app: app,
            directory: path.resolve(__dirname, '../routes'),
            loader: routerLoader
        });
    },
    loader: loadDirectory //加载器
};

// 加载中间件
loadDirectory({
    exports: mounter.middlewares,
    directory: path.resolve(__dirname, '../middlewares')
});

// 加载services
loadDirectory({
    exports: mounter.services,
    directory: path.resolve(__dirname, '../services'),
    capitalizeClass: true,
    skipIndex: true
});

// 加载controllers
loadDirectory({
    exports: mounter.controllers,
    directory: path.resolve(__dirname, '../controllers'),
    loader: controllerLoader
});

module.exports = mounter;
