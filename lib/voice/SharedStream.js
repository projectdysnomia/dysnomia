"use strict";

const util = require("node:util");
const Base = require("../structures/Base");
const Piper = require("./Piper");
const VoiceConnection = require("./VoiceConnection");
const Collection = require("../util/Collection");
const {createOpus} = require("../util/Opus");

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch{
    EventEmitter = require("node:events").EventEmitter;
}

/**
* Represents a collection of VoiceConnections sharing an input stream
* @extends EventEmitter
*/
class SharedStream extends EventEmitter {
    #send;
    bitrate = 64_000;
    channels = 2;
    /**
     * Whether the stream ended
     * @type {Boolean}
     */
    ended = true;
    frameDuration = 20;
    /**
     * Whether the voice connection is playing something
     * @type {Boolean}
     */
    playing = false;
    samplingRate = 48_000;
    /**
     * Whether someone is speaking
     * @type {Boolean}
     */
    speaking = false;
    voiceConnections = new Collection(VoiceConnection);

    constructor() {
        super();

        if(!VoiceConnection._converterCommand.cmd) {
            VoiceConnection._converterCommand.pickCommand();
        }

        this.piper = new Piper(VoiceConnection._converterCommand.cmd, () => createOpus(this.samplingRate, this.channels, this.bitrate));
        /**
        * Fired when the shared stream encounters an error
        * @event SharedStream#error
        * @prop {Error} e The error
        */
        this.piper.on("error", (e) => this.emit("error", e));
        if(!VoiceConnection._converterCommand.libopus) {
            this.piper.libopus = false;
        }

        this.#send = this.#sendUnbound.bind(this);
    }

    /**
     * The current volume level of the connection
     * @type {Number}
     */
    get volume() {
        return this.piper.volumeLevel;
    }

    /**
    * Add a voice connection to the shared stream
    * @arg {VoiceConnection} connection The voice connection to add
    */
    add(connection) {
        const _connection = this.voiceConnections.add(connection);
        if(_connection.ready) {
            _connection.setSpeaking(this.speaking);
        } else {
            _connection.once("ready", () => {
                _connection.setSpeaking(this.speaking);
            });
        }
        return _connection;
    }

    /**
    * Play an audio or video resource. If playing from a non-opus resource, FFMPEG should be compiled with --enable-libopus for best performance. If playing from HTTPS, FFMPEG must be compiled with --enable-openssl
    * @arg {ReadableStream | String} resource The audio or video resource, either a ReadableStream, URL, or file path
    * @arg {Object} [options] Music options
    * @arg {Array<String>} [options.encoderArgs] Additional encoder parameters to pass to ffmpeg/avconv (after -i)
    * @arg {String} [options.format] The format of the resource. If null, FFmpeg will attempt to guess and play the format. Available options: "dca", "ogg", "webm", "pcm", null
    * @arg {Number} [options.frameDuration=60] The resource opus frame duration (required for DCA/Ogg)
    * @arg {Number} [options.frameSize=2880] The resource opus frame size
    * @arg {Boolean} [options.inlineVolume=false] Whether to enable on-the-fly volume changing. Note that enabling this leads to increased CPU usage
    * @arg {Array<String>} [options.inputArgs] Additional input parameters to pass to ffmpeg/avconv (before -i)
    * @arg {Number} [options.sampleRate=48000] The resource audio sampling rate
    * @arg {Number} [options.voiceDataTimeout=2000] Timeout when waiting for voice data (-1 for no timeout)
    */
    play(source, options = {}) {
        options.format = options.format || null;
        options.voiceDataTimeout = !isNaN(options.voiceDataTimeout) ? options.voiceDataTimeout : 2000;
        options.inlineVolume = !!options.inlineVolume;
        options.inputArgs = options.inputArgs || [];
        options.encoderArgs = options.encoderArgs || [];

        options.samplingRate = options.samplingRate || this.samplingRate;
        options.frameDuration = options.frameDuration || this.frameDuration;
        options.frameSize = options.frameSize || options.samplingRate * options.frameDuration / 1000;
        options.pcmSize = options.pcmSize || options.frameSize * 2 * this.channels;

        if(!this.piper.encode(source, options)) {
            this.emit("error", new Error("Unable to encode source"));
            return;
        }

        this.ended = false;
        /**
         * The current stream
         * @type {VoiceConnection.CurrentState}
         */
        this.current = {
            startTime: 0, // later
            playTime: 0,
            pausedTimestamp: 0,
            pausedTime: 0,
            bufferingTicks: 0,
            options: options,
            timeout: null,
            buffer: null
        };

        this.playing = true;

        /**
        * Fired when the shared stream starts playing a stream
        * @event SharedStream#start
        */
        this.emit("start");

        this.#send();
    }

    /**
    * Remove a voice connection from the shared stream
    * @arg {VoiceConnection} connection The voice connection to remove
    */
    remove(connection) {
        return this.voiceConnections.remove(connection);
    }

    setSpeaking(value) {
        if((value = !!value) != this.speaking) {
            this.speaking = value;
            for(const vc of this.voiceConnections.values()) {
                vc.setSpeaking(value);
            }
        }
    }

    /**
     * Sets the volume of this shared stream if inline volume is enabled
     * @arg {Number} volume The volume as a value from 0 (min) to 1 (max)
     */
    setVolume(volume) {
        this.piper.setVolume(volume);
    }

    /**
    * Stop the bot from sending audio
    */
    stopPlaying() {
        if(this.ended) {
            return;
        }
        this.ended = true;
        if(this.current?.timeout) {
            clearTimeout(this.current.timeout);
            this.current.timeout = null;
        }
        this.current = null;
        this.piper.stop();
        this.piper.resetPackets();

        this.setSpeaking(this.playing = false);

        /**
        * Fired when the shared stream finishes playing a stream
        * @event SharedStream#end
        */
        this.emit("end");
    }

    #incrementSequences() {
        for(const vc of this.voiceConnections.values()) {
            vc.sequence = (vc.sequence + 1) & 0xFFFF;
        }
    }

    #incrementTimestamps(val) {
        for(const vc of this.voiceConnections.values()) {
            vc.timestamp = (vc.timestamp + val) >>> 0;
        }
    }

    #sendUnbound() {
        if(!this.piper.encoding && this.piper.dataPacketCount === 0) {
            return this.stopPlaying();
        }

        this.#incrementTimestamps(this.current.options.frameSize);

        this.#incrementSequences();

        if((this.current.buffer = this.piper.getDataPacket())) {
            if(this.current.startTime === 0) {
                this.current.startTime = Date.now();
            }
            if(this.current.bufferingTicks > 0) {
                this.current.bufferingTicks = 0;
                this.setSpeaking(true);
            }
        } else if(this.current.options.voiceDataTimeout === -1 || this.current.bufferingTicks < this.current.options.voiceDataTimeout / (4 * this.current.options.frameDuration)) { // wait for data
            if(++this.current.bufferingTicks === 1) {
                this.setSpeaking(false);
            } else {
                this.current.pausedTime += 4 * this.current.options.frameDuration;
                this.#incrementTimestamps(3 * this.current.options.frameSize);
                this.current.timeout = setTimeout(this.#send, 4 * this.current.options.frameDuration);
                return;
            }
        } else {
            return this.stopPlaying();
        }

        this.voiceConnections.forEach((connection) => {
            if(connection.ready && this.current.buffer) {
                connection._sendAudioFrame(this.current.buffer);
            }
        });
        this.current.playTime += this.current.options.frameDuration;
        this.current.timeout = setTimeout(this.#send, this.current.startTime + this.current.pausedTime + this.current.playTime - Date.now());
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

module.exports = SharedStream;
