"use strict";

const util = require("node:util");
const Base = require("../structures/Base");

/**
* Handle ratelimiting something
*/
class Bucket {
    #queue = [];
    /**
     * Timestamp of last token clearing
     * @type {Number}
     */
    lastReset = 0;
    /**
     * Timestamp of last token consumption
     * @type {Number}
     */
    lastSend = 0;
    /**
     * How many tokens the bucket has consumed in this interval
     * @type {Number}
     */
    tokens = 0;
    /**
    * Construct a Bucket
    * @arg {Number} tokenLimit The max number of tokens the bucket can consume per interval
    * @arg {Number} interval How long (in ms) to wait between clearing used tokens
    * @arg {Object} [options] Optional parameters
    * @arg {Object} options.latencyRef A latency reference object
    * @arg {Number} options.latencyRef.latency Interval between consuming tokens
    * @arg {Number} options.reservedTokens How many tokens to reserve for priority operations
    */
    constructor(tokenLimit, interval, options = {}) {
        /**
         * The max number tokens the bucket can consume per interval
         * @type {Number}
         */
        this.tokenLimit = tokenLimit;
        /**
         * How long (in ms) to wait between clearing used tokens
         * @type {Number}
         */
        this.interval = interval;
        this.latencyRef = options.latencyRef || {latency: 0};
        this.reservedTokens = options.reservedTokens || 0;
    }

    check() {
        if(this.timeout || this.#queue.length === 0) {
            return;
        }
        if(this.lastReset + this.interval + this.tokenLimit * this.latencyRef.latency < Date.now()) {
            this.lastReset = Date.now();
            this.tokens = Math.max(0, this.tokens - this.tokenLimit);
        }

        let val;
        let tokensAvailable = this.tokens < this.tokenLimit;
        let unreservedTokensAvailable = this.tokens < (this.tokenLimit - this.reservedTokens);
        while(this.#queue.length > 0 && (unreservedTokensAvailable || (tokensAvailable && this.#queue[0].priority))) {
            this.tokens++;
            tokensAvailable = this.tokens < this.tokenLimit;
            unreservedTokensAvailable = this.tokens < (this.tokenLimit - this.reservedTokens);
            const item = this.#queue.shift();
            val = this.latencyRef.latency - Date.now() + this.lastSend;
            if(this.latencyRef.latency === 0 || val <= 0) {
                item.func();
                this.lastSend = Date.now();
            } else {
                setTimeout(() => {
                    item.func();
                }, val);
                this.lastSend = Date.now() + val;
            }
        }

        if(this.#queue.length > 0 && !this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.check();
            }, this.tokens < this.tokenLimit ? this.latencyRef.latency : Math.max(0, this.lastReset + this.interval + this.tokenLimit * this.latencyRef.latency - Date.now()));
        }
    }

    /**
    * Queue something in the Bucket
    * @arg {Function} func A callback to call when a token can be consumed
    * @arg {Boolean} [priority=false] Whether or not the callback should use reserved tokens
    */
    queue(func, priority=false) {
        if(priority) {
            this.#queue.unshift({func, priority});
        } else {
            this.#queue.push({func, priority});
        }
        this.check();
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

module.exports = Bucket;
