"use strict";
const util = require("node:util");
const Base = require("../../structures/Base");
const ChildProcess = require("node:child_process");
const DuplexStream = require("node:stream").Duplex;
const PassThroughStream = require("node:stream").PassThrough;

const delegateEvents = {
    readable: "_reader",
    data: "_reader",
    end: "_reader",
    drain: "_writer",
    finish: "_writer"
};

class FFmpegDuplex extends DuplexStream {
    #onError;
    #process;
    #stderr;
    #stdin;
    #stdout;
    constructor(command, options = {}) {
        options.highWaterMark ??= 0;
        super(options);

        this.command = command;
        this._reader = new PassThroughStream(options);
        this._writer = new PassThroughStream(options);

        this.#onError = this.emit.bind(this, "error");

        this._reader.on("error", this.#onError);
        this._writer.on("error", this.#onError);

        this._readableState = this._reader._readableState;
        this._writableState = this._writer._writableState;

        ["on", "once", "removeListener", "removeListeners", "listeners"].forEach((method) => {
            const og = DuplexStream.prototype[method];

            this[method] = function(ev, fn) {
                const substream = delegateEvents[ev];
                if(substream) {
                    return this[substream][method](ev, fn);
                } else {
                    return og.call(this, ev, fn);
                }
            };
        });
    }

    destroy() {
    }

    end(chunk, enc, cb) {
        return this._writer.end(chunk, enc, cb);
    }

    kill() {
    }

    noop() {
    }

    pipe(dest, opts) {
        return this._reader.pipe(dest, opts);
    }

    read(size) {
        return this._reader.read(size);
    }

    setEncoding(enc) {
        return this._reader.setEncoding(enc);
    }

    spawn(args, options = {}) {
        let ex, exited, killed, ended;
        let stderr = [];

        const onStdoutEnd = () => {
            if(exited && !ended) {
                ended = true;
                this._reader.end();
                setImmediate(this.emit.bind(this, "close"));
            }
        };

        const onStderrData = (chunk) => {
            stderr.push(chunk);
        };

        const cleanup = () => {
            this.#process =
            this.#stderr =
            this.#stdout =
            this.#stdin =
            stderr =
            ex =
            killed = null;

            this.kill =
            this.destroy = this.noop;
        };

        const onExit = (code, signal) => {
            if(exited) {
                return;
            }
            exited = true;

            if(killed) {
                if(ex) {
                    this.emit("error", ex);
                }
                this.emit("close");
            } else if(code === 0 && signal == null) {
                // All is well
                onStdoutEnd();
            } else {
                // Everything else
                ex = new Error("Command failed: " + Buffer.concat(stderr).toString("utf8"));
                ex.killed = this.#process.killed || killed;
                ex.code = code;
                ex.signal = signal;
                this.emit("error", ex);
                this.emit("close");
            }

            cleanup();
        };

        const onError = (err) => {
            ex = err;
            this.#stdout.destroy();
            this.#stderr.destroy();
            onExit();
        };

        const kill = () => {
            if(killed) {
                return;
            }
            this.#stdout.destroy();
            this.#stderr.destroy();

            killed = true;

            try {
                this.#process.kill(options.killSignal || "SIGTERM");
                setTimeout(() => this.#process && this.#process.kill("SIGKILL"), 2000);
            } catch(e) {
                ex = e;
                onExit();
            }
        };

        this.#process = ChildProcess.spawn(this.command, args, options);
        this.#stdin = this.#process.stdin;
        this.#stdout = this.#process.stdout;
        this.#stderr = this.#process.stderr;
        this._writer.pipe(this.#stdin);
        this.#stdout.pipe(this._reader, {
            end: false
        });
        this.kill = this.destroy = kill;

        this.#stderr.on("data", onStderrData);

        // In some cases ECONNRESET can be emitted by stdin because the process is not interested in any
        // more data but the _writer is still piping. Forget about errors emitted on stdin and stdout
        this.#stdin.on("error", this.noop);
        this.#stdout.on("error", this.noop);

        this.#stdout.on("end", onStdoutEnd);

        this.#process.once("close", onExit);
        this.#process.once("error", onError);

        return this;
    }

    unpipe(dest) {
        return this._reader.unpipe(dest) || this.kill();
    }

    write(chunk, enc, cb) {
        return this._writer.write(chunk, enc, cb);
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

FFmpegDuplex.prototype.addListener = FFmpegDuplex.prototype.on;

FFmpegDuplex.spawn = function(connection, args, options) {
    return new FFmpegDuplex(connection, options).spawn(args, options);
};

module.exports = FFmpegDuplex;
