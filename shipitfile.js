
module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        production: {
            servers: ['root@your.production.server.here'],//服务器IP配置
            deployTo: '/data/koa-web-template',//发布目录
            branch: 'master'
        },
        test: {
            servers: 'root@your.test.server.here',//服务器IP配置
            deployTo: '/data/koa-web-template', //发布目录
            branch: 'main'
        },
        default: {
            workspace: '/tmp/koa-web-template', //本地的临时工作目录
            repositoryUrl: 'git@github.com:feiin/koa-web-template.git',
            ignores: ['.git', 'node_modules', 'dev.js', 'apidoc.json'],
            keepReleases: 5,
            deleteOnRollback: false
        }
    });

    shipit.on('published', function () {
        if (shipit.options.environment === 'test') {
            let command = [
                'cd /data/koa-web-template/current',
                '&& npm install',
                '&& (pm2 delete koa-web-template || make install)',
                '&& pm2 start ./pm2/pm2_test.json',
                '&& pm2 save'
            ].join(' ');
            return shipit.remote(command);
        }

        if (shipit.options.environment === 'production') {
            let command = [
                'cd /data/koa-web-template/current',
                '&& npm install --production',
                '&& (pm2 delete koa-web-template || make install)',
                '&& pm2 start ./pm2/pm2_production.json',
                '&& pm2 save'
            ].join(' ');
            return shipit.remote(command);
        }
    });
};
