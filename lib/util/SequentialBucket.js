"use strict";

const util = require("node:util");
const Base = require("../structures/Base");

/**
* Ratelimit requests and release in sequence
* TODO: add latencyref
*/
class SequentialBucket {
    #queue = [];
    /**
     * Whether the queue is being processed
     * @type {Boolean}
     */
    processing = false;
    /**
     * Timestamp of next reset
     * @type {Number}
     */
    reset = 0;
    /**
     * How many tokens the bucket has left in the current interval
     * @member {Number} SequentialBucket#remaining
     */

    /**
    * Construct a SequentialBucket
    * @arg {Number} limit The max number of tokens the bucket can consume per interval
    * @arg {Object} [latencyRef] An object
    * @arg {Number} latencyRef.latency Interval between consuming tokens
    */
    constructor(limit, latencyRef = {latency: 0}) {
        /**
         * How many tokens the bucket can consume in the current interval
         * @type {Number}
         */
        this.limit = this.remaining = limit;
        this.latencyRef = latencyRef;
    }

    check(override) {
        if(this.#queue.length === 0) {
            if(this.processing) {
                clearTimeout(this.processing);
                this.processing = false;
            }
            return;
        }
        if(this.processing && !override) {
            return;
        }
        const now = Date.now();
        const offset = this.latencyRef.latency;
        if(!this.reset || this.reset < now - offset) {
            this.reset = now - offset;
            this.remaining = this.limit;
        }
        this.last = now;
        if(this.remaining <= 0) {
            this.processing = setTimeout(() => {
                this.processing = false;
                this.check(true);
            }, Math.max(0, (this.reset || 0) - now + offset) + 1);
            return;
        }
        --this.remaining;
        this.processing = true;
        this.#queue.shift()(() => {
            if(this.#queue.length > 0) {
                this.check(true);
            } else {
                this.processing = false;
            }
        });
    }

    /**
    * Queue something in the SequentialBucket
    * @arg {Function} func A function to call when a token can be consumed. The function will be passed a callback argument, which must be called to allow the bucket to continue to work
    */
    queue(func, short) {
        if(short) {
            this.#queue.unshift(func);
        } else {
            this.#queue.push(func);
        }
        this.check();
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

module.exports = SequentialBucket;
