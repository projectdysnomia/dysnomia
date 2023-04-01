"use strict";

const BaseTransformer = require("./BaseTransformer");

class PCMOpusTransformer extends BaseTransformer {
    #remainder = null;
    constructor(options = {}) {
        super(options);

        this.opus = options.opusFactory();
        this.frameSize = options.frameSize || 2880;
        this.pcmSize = options.pcmSize || 11520;
    }

    _destroy(...args) {
        this.opus.delete?.();

        return super._destroy(...args);
    }

    _flush(cb) {
        if(this.#remainder) {
            const buf = Buffer.allocUnsafe(this.pcmSize);
            this.#remainder.copy(buf);
            buf.fill(0, this.#remainder.length);
            this.push(this.opus.encode(buf, this.frameSize));
            this.#remainder = null;
        }
        cb();
    }

    _transform(chunk, enc, cb) {
        if(this.#remainder) {
            chunk = Buffer.concat([this.#remainder, chunk]);
            this.#remainder = null;
        }

        if(chunk.length < this.pcmSize) {
            this.#remainder = chunk;
            return cb();
        }

        chunk._index = 0;

        while(chunk._index + this.pcmSize < chunk.length) {
            chunk._index += this.pcmSize;
            this.push(this.opus.encode(chunk.subarray(chunk._index - this.pcmSize, chunk._index), this.frameSize));
        }

        if(chunk._index < chunk.length) {
            this.#remainder = chunk.subarray(chunk._index);
        }

        this.setTransformCB(cb);
    }
}

module.exports = PCMOpusTransformer;
