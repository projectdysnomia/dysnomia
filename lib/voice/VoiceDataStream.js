"use strict";

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch{
    EventEmitter = require("node:events").EventEmitter;
}

/**
* Represents a voice data stream
* @extends EventEmitter
*/
class VoiceDataStream extends EventEmitter {
    constructor(type) {
        super();
        /**
         * The targeted voice data type for the stream, either "opus" or "pcm"
         * @type {String}
         */
        this.type = type;
    }
}

module.exports = VoiceDataStream;
