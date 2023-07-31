"use strict";

const util = require("node:util");
const Base = require("../structures/Base");
const DCAOpusTransformer = require("./streams/DCAOpusTransformer");
const FFmpegOggTransformer = require("./streams/FFmpegOggTransformer");
const FFmpegPCMTransformer = require("./streams/FFmpegPCMTransformer");
const FS = require("node:fs");
const HTTP = require("node:http");
const HTTPS = require("node:https");
const OggOpusTransformer = require("./streams/OggOpusTransformer");
const PassThroughStream = require("node:stream").PassThrough;
const PCMOpusTransformer = require("./streams/PCMOpusTransformer");
const Stream = require("node:stream").Stream;
const VolumeTransformer = require("./streams/VolumeTransformer");
const WebmOpusTransformer = require("./streams/WebmOpusTransformer");

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch{
    EventEmitter = require("node:events").EventEmitter;
}

function resolveHTTPType(link) {
    return link.startsWith("http://") ? HTTP : HTTPS;
}

function webGetter(link, depth = 8) {
    return new Promise((resolve, reject) => {
        resolveHTTPType(link).get(link, (res) => {
            const {statusCode, headers} = res.hasOwnProperty("statusCode") ? res : res.res;

            if(statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) {
                if(depth <= 0) {
                    reject(new Error("too many redirects"));
                } else {
                    resolve(webGetter(headers.location, depth - 1));
                }
            } else {
                resolve(res);
            }
        }).once("error", reject);
    });
}

class Piper extends EventEmitter {
    #dataPacketMax = 30;
    #dataPacketMin = 15;
    #dataPackets = [];
    #endStream;
    #retransformer = [];
    encoding = false;
    libopus = true;
    opus = null;
    volumeLevel = 1;

    constructor(converterCommand, opusFactory) {
        super();

        this.reset();

        this.converterCommand = converterCommand;
        this.opusFactory = opusFactory;

        this.addDataPacket = this.addDataPacket.bind(this);
    }

    get dataPacketCount() {
        return this.#dataPackets.length;
    }

    addDataPacket(packet) {
        if(!this.encoding) {
            return;
        }
        if(this.#dataPackets.push(packet) < this.#dataPacketMax && this.#endStream?.manualCB) {
            process.nextTick(() => {
                if(this.#endStream?.manualCB) {
                    this.#endStream.transformCB();
                }
            });
        }
    }

    encode(source, options) {
        if(this.encoding || this.streams.length) {
            this.emit("error", new Error("Already encoding"));
            return false;
        }

        if(typeof source === "string") {
            if(options.format === "dca" || options.format === "ogg" || options.format === "webm" || options.format === "pcm") {
                if(source.startsWith("http://") || source.startsWith("https://")) {
                    const passThrough = new PassThroughStream();
                    webGetter(source).then((res) => res.pipe(passThrough)).catch((e) => this.stop(e));
                    source = passThrough;
                } else {
                    try {
                        FS.statSync(source);
                    } catch(err) {
                        if(err.code === "ENOENT") {
                            this.emit("error", new Error("That file does not exist."));
                        } else {
                            this.emit("error", new Error("An error occured trying to access that file."));
                        }
                        this.reset();
                        return false;
                    }
                    source = FS.createReadStream(source);
                }
            }
        } else if(!(source instanceof Stream) || !source.pipe) {
            this.emit("error", new Error("Invalid source type"));
            return false;
        }

        this.#dataPacketMax = 30;
        this.#dataPacketMin = 15;

        if(typeof source !== "string") {
            this.streams.push(source.once("error", (e) => this.stop(e)));
        }

        if(options.format === "opusPackets") { // eslint-disable no-empty
        } else if(options.format === "dca") {
            this.streams.push(source.pipe(new DCAOpusTransformer()).once("error", (e) => this.stop(e)));
        } else if(options.format === "ogg") {
            this.streams.push(source.pipe(new OggOpusTransformer()).once("error", (e) => this.stop(e)));
        } else if(options.format === "webm") {
            this.streams.push(source.pipe(new WebmOpusTransformer()).once("error", (e) => this.stop(e)));
        } else if(!options.format || options.format === "pcm") {
            if(options.inlineVolume) {
                if(!options.format) {
                    if(!this.converterCommand) {
                        this.emit("error", new Error("FFmpeg/avconv was not found on this system. Playback of this audio format is impossible"));
                        this.reset();
                        return false;
                    }
                    if(typeof source === "string") {
                        this.streams.push(source = new FFmpegPCMTransformer({
                            command: this.converterCommand,
                            input: source,
                            encoderArgs: options.encoderArgs,
                            inputArgs: options.inputArgs
                        }).once("error", (e) => this.stop(e)));
                    } else {
                        this.streams.push(source = source.pipe(new FFmpegPCMTransformer({
                            command: this.converterCommand,
                            encoderArgs: options.encoderArgs,
                            inputArgs: options.inputArgs
                        })).once("error", (e) => this.stop(e)));
                    }
                }
                this.streams.push(this.volume = source = source.pipe(new VolumeTransformer()).once("error", (e) => this.stop(e)));
                this.volume.setVolume(this.volumeLevel);
                this.streams.push(this.volume.pipe(new PCMOpusTransformer({
                    opusFactory: this.opusFactory,
                    frameSize: options.frameSize,
                    pcmSize: options.pcmSize
                })).once("error", (e) => this.stop(e)));
                this.#dataPacketMax = 1; // Live volume updating
                this.#dataPacketMin = 4;
            } else {
                if(this.libopus) {
                    if(typeof source === "string") {
                        this.streams.push(source = new FFmpegOggTransformer({
                            command: this.converterCommand,
                            input: source,
                            encoderArgs: options.encoderArgs,
                            inputArgs: options.inputArgs,
                            format: options.format,
                            frameDuration: options.frameDuration
                        }).once("error", (e) => this.stop(e)));
                    } else {
                        this.streams.push(source = source.pipe(new FFmpegOggTransformer({
                            command: this.converterCommand,
                            encoderArgs: options.encoderArgs,
                            inputArgs: options.inputArgs,
                            format: options.format,
                            frameDuration: options.frameDuration
                        })).once("error", (e) => this.stop(e)));
                    }
                    this.streams.push(source.pipe(new OggOpusTransformer()).once("error", (e) => this.stop(e)));
                } else {
                    if(typeof source === "string") {
                        this.streams.push(source = new FFmpegPCMTransformer({
                            command: this.converterCommand,
                            input: source,
                            encoderArgs: options.encoderArgs,
                            inputArgs: options.inputArgs
                        }).once("error", (e) => this.stop(e)));
                    } else {
                        this.streams.push(source = source.pipe(new FFmpegPCMTransformer({
                            command: this.converterCommand,
                            encoderArgs: options.encoderArgs,
                            inputArgs: options.inputArgs
                        })).once("error", (e) => this.stop(e)));
                    }
                    this.streams.push(source.pipe(new PCMOpusTransformer({
                        opusFactory: this.opusFactory,
                        frameSize: options.frameSize,
                        pcmSize: options.pcmSize
                    })).once("error", (e) => this.stop(e)));
                }
            }
        } else {
            this.emit("error", new Error("Unrecognized format"));
            this.reset();
            return false;
        }

        this.#endStream = this.streams[this.streams.length - 1];
        if(this.#endStream.hasOwnProperty("manualCB")) {
            this.#endStream.manualCB = true;
        }

        this.#endStream.on("data", this.addDataPacket);
        this.#endStream.once("end", () => this.stop(null, source));

        this.emit("start");

        return (this.encoding = true);
    }

    getDataPacket() {
        if(this.#dataPackets.length < this.#dataPacketMin && this.#endStream?.manualCB) {
            this.#endStream.transformCB();
        }
        if(this.#retransformer.length === 0) {
            return this.#dataPackets.shift();
        } else {
            // If we don't have an opus instance yet, create one.
            this.opus ??= this.opusFactory();

            const packet = this.opus.decode(this.#dataPackets.shift());
            for(let i = 0, num; i < packet.length - 1; i += 2) {
                num = ~~(this.#retransformer.shift() * packet.readInt16LE(i));
                packet.writeInt16LE(num >= 32767 ? 32767 : num <= -32767 ? -32767 : num, i);
            }
            return this.opus.encode(packet, 3840 / 2 / 2);
        }
    }

    reset() {
        if(this.streams) {
            for(const stream of this.streams) {
                if(typeof stream.destroy === "function") {
                    stream.destroy();
                } else {
                    stream.unpipe();
                }
            }
        }

        this.streams = [];
        this.#endStream = null;
        this.volume = null;
    }

    resetPackets() {
        // We no longer need this to convert inline volume, so... let it go.
        if(this.opus) {
            this.opus.delete?.();
            this.opus = null;
        }
        this.#dataPackets = [];
    }

    setVolume(volume) {
        this.volumeLevel = volume;
        if(!this.volume) {
            return;
        }
        this.volume.setVolume(volume);
    }

    stop(e, source) {
        if(source && !this.streams.includes(source)) {
            return;
        }

        if(e) {
            this.emit("error", e);
        }

        if(this.throttleTimeout) {
            clearTimeout(this.throttleTimeout);
            this.throttleTimeout = null;
        }

        if(this.streams.length === 0) {
            return;
        }

        this.#endStream?.removeAllListeners("data");

        this.reset();
        if(this.encoding) {
            this.encoding = false;
            this.emit("stop");
        }
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

module.exports = Piper;
