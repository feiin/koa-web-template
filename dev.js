const path = require('path');
const spawn = require('child_process');
const chokidar = require('chokidar');
const EventEmitter = require('events');


let binPath = path.resolve(__dirname, './bin/www');
let webProcess = spawn.fork(binPath);

/**
 * 文件监听包装类
 */
class NWatcher {
    constructor(dir, options) {

        this.emitter = new EventEmitter();
        this.watcher = chokidar.watch(dir, options);

        this.watcher.on('ready', () => {

            this.watcher.on('change', (path) => {
                this.emitter.emit('change');
            });

            this.watcher.on('add', (path) => {
                this.emitter.emit('change');
            });

            this.watcher.on('unlink', (path) => {
                this.emitter.emit('change');
            });

        });
    }

    /**
     * 事件
     * @param {event} event
     * @param {fn} fn
     */
    on(event, fn) {
        this.emitter.on(event, fn);
    }

}


let nodeWatcher = new NWatcher(path.resolve(__dirname, './'), {
    ignored: ['*.md', '.git/*', '.vscode/*', 'node_modules', 'views', 'public'],
    ignoreInitial: false,
    cwd: __dirname
});

nodeWatcher.on('change', () => {
    reloadWebServe(() => {
        //web-loaed;
        console.log('hot reload finished');
    });
});


function reloadWebServe(cb) {

    webProcess.kill('SIGINT');
    webProcess = spawn.fork(binPath);
    webProcess.on('message', (message) => {
        cb();
    });
};

process.on('SIGINT', () => {
    process.exit(0);
});

