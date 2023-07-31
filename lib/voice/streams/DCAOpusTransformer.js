"use strict";

const BaseTransformer = require("./BaseTransformer");

class DCAOpusTransformer extends BaseTransformer {
    #remainder = null;

    process(buffer) {
        if(buffer.length - buffer._index < 2) {
            return true;
        }

        const opusLen = buffer.readInt16LE(buffer._index);
        buffer._index += 2;

        if(buffer.length - buffer._index < opusLen) {
            return true;
        }

        buffer._index += opusLen;
        this.push(buffer.subarray(buffer._index - opusLen, buffer._index));
    }

    _transform(chunk, enc, cb) {
        if(this.#remainder)  {
            chunk = Buffer.concat([this.#remainder, chunk]);
            this.#remainder = null;
        }

        if(!this.head) {
            if(chunk.length < 4) {
                this.#remainder = chunk;
                return cb();
            } else {
                const dcaVersion = chunk.subarray(0, 4);
                if(dcaVersion[0] !== 68 || dcaVersion[1] !== 67 || dcaVersion[2] !== 65) { // DCA0 or invalid
                    this.head = true; // Attempt to play as if it were a DCA0 file
                } else if(dcaVersion[3] === 49) { // DCA1
                    if(chunk.length < 8) {
                        this.#remainder = chunk;
                        return cb();
                    }
                    const jsonLength = chunk.subarray(4, 8).readInt32LE(0);
                    if(chunk.length < 8 + jsonLength) {
                        this.#remainder = chunk;
                        return cb();
                    }
                    const jsonMetadata = chunk.subarray(8, 8 + jsonLength);
                    this.emit("debug", jsonMetadata);
                    chunk = chunk.subarray(8 + jsonLength);
                    this.head = true;
                } else {
                    this.emit("error", new Error("Unsupported DCA version: " + dcaVersion.toString()));
                }
            }
        }

        chunk._index = 0;

        while(chunk._index < chunk.length) {
            const offset = chunk._index;
            const ret = this.process(chunk);
            if(ret) {
                this.#remainder = chunk.subarray(offset);
                cb();
                return;
            }
        }

        this.setTransformCB(cb);
    }
}

module.exports = DCAOpusTransformer;
