"use strict";

const DiscordHTTPError = require("../errors/DiscordHTTPError");
const DiscordRESTError = require("../errors/DiscordRESTError");
const Mutex = require("../util/Mutex");

/**
 * Utility function to parse the response.
 * @arg {Object} res The response.
 */
function parseResponse(res) {
    if(res.headers.get("content-type") === "application/json") {
        return res.json();
    }

    return null;
}

/**
 * Utility function to parse the ratelimit scope.
 * @arg {String} scope The X-RateLimit-Scope header.
 */
function parseScope(scope) {
    switch(scope) {
        case "user": return "User";
        case "global": return "Global";
        case "shared": return "Shared";
        default: return "Unexpected";
    }
}

/**
 * Represents a bucket for handling ratelimiting.
 */
class SequentialBucket {
    /**
     * The maximum requests that can be made by the bucket.
     * @type {Number}
     */
    limit = 1;

    /**
     * The remaining requests that can be made by the bucket.
     * @type {Number}
     */
    remaining = 1;

    /**
     * The timestamp of the next reset.
     * @type {Number}
     */
    reset = 0;

    /**
     * Represents the RequestHandler.
     * @type {RequestHandler}
     */
    #handler;

    /**
     * The hash used to identify the bucket.
     * @type {String}
     */
    #hash;

    /**
     * The major parameter of the requests.
     * @type {String}
     */
    #majorParameter;

    /**
     * A simple tool to synchronize async operations.
     * @type {Mutex}
     */
    #mutex = new Mutex();

    /**
     * Represents a bucket for handling ratelimiting.
     * @arg {RequestHandler} rest Represents the RequestHandler.
     * @arg {String} hash The hash used to identify the bucket.
     * @arg {String} majorParameter The major parameter of the requests.
     */
    constructor(rest, hash, majorParameter) {
        this.#handler = rest;
        this.#hash = hash;
        this.#majorParameter = majorParameter;
    }

    /**
     * The identifier of the bucket.
     * @type {String}
     * @readonly
     */
    get id() {
        return `${this.#hash}:${this.#majorParameter}`;
    }

    /**
     * Whether the bucket is no longer in use.
     * @type {Boolean}
     * @readonly
     */
    get inactive() {
        return !this.limited && !this.#handler.limited && !this.#mutex.locked;
    }

    /**
     * Whether the bucket is currently limited.
     * @type {Boolean}
     * @readonly
     */
    get limited() {
        return this.remaining <= 0 && Date.now() < this.reset;
    }

    /**
     * Enqueue a request to be sent.
     * @arg {Object} request The request to enqueue.
     * @arg {Boolean} next Whether to insert the request at the start of the queue.
     * @returns {Promise<Object>} Resolves with the returned JSON data.
     */
    async add(request, next) {
        const release = await this.#mutex.acquire(next);
        try {
            return await this.#execute(request);
        } finally {
            release();
        }
    }

    /**
     * Makes a request to the API.
     * @arg {Object} request The request to execute.
     * @arg {Number} [attempts=0] The amount of attempts.
     * @returns {Promise<Object>} Resolves with the returned JSON data.
     */
    async #execute(request, attempts = 0) {
        const stackHolder = {};
        Error.captureStackTrace(stackHolder);

        if(stackHolder.stack.startsWith("Error\n")) {
            stackHolder.stack = stackHolder.stack.substring(6);
        }

        while(this.limited || this.#handler.limited) {
            if(this.#handler.limited) {
                const delay = this.#handler.globalReset - Date.now();
                if(!this.#handler.globalTimeout) {
                    this.#setGlobalTimeout(delay);
                }

                await this.#handler.globalTimeout;
                continue;
            }

            const delay = this.reset - Date.now();
            await Mutex.wait(delay);
        }

        if(this.#handler.globalReset < Date.now()) {
            this.#handler.globalReset = Date.now() + 1000;
            this.#handler.globalBlock = false;
        }

        let res;
        let latency = Date.now();
        try {
            res = await request.send();
            latency = Date.now() - latency;
        } catch(error) {
            if(attempts >= this.#handler.options.retryLimit) {
                if(error.name === "AbortError") {
                    throw new Error(
                        `Request timed out (>${this.#handler.options.requestTimeout}ms) on ${request.method} ${
                            request.path
                        }`
                    );
                }

                throw error;
            }

            return this.#execute(request, ++attempts);
        }

        if(this.#handler.rest.listenerCount("response")) {
            this.#handler.rest.emit("response", {
                auth: request.options.auth ?? false,
                body: request.options.body,
                files: request.options.files,
                latency: latency,
                method: request.method,
                response: res.clone(),
                url: request.url
            });
        }

        const retryAfter = this.#handle(request, res, latency);
        this.#handler.rest.emit("debug", `${request.method} ${request.route} (${this.id}) ${res.status}: ${latency}ms | ${this.remaining}/${this.limit} left | Reset ${this.reset} (${this.reset - Date.now()}ms left)`);

        if(res.status >= 200 && res.status < 300) {
            return parseResponse(res);
        }

        if(res.status >= 400 && res.status < 500) {
            const data = await parseResponse(res);
            if(res.status === 429) {
                const delay = data.retry_after ? data.retry_after * 1000 : retryAfter;
                this.#handler.rest.emit("debug", `${parseScope(res.headers.get("x-ratelimit-scope"))} 429. Retrying in ${delay}ms (${this.id})`);

                if(delay) {
                    await Mutex.wait(delay);
                }

                return this.#execute(request, attempts);
            }

            throw new DiscordRESTError(request, res, data, stackHolder.stack);
        }

        if(res.status >= 500 && res.status < 600) {
            if(attempts >= this.#handler.options.retryLimit) {
                throw new DiscordHTTPError(request, res, stackHolder.stack);
            }

            return this.#execute(request, ++attempts);
        }

        return null;
    }

    /**
     * Handles rate-limiting and updates the bucket.
     * @arg {Object} request The request that got sent to Discord.
     * @arg {Object} response The response returned by Discord.
     * @returns {Number} The number of milliseconds to wait when limited.
     */
    #handle(request, response, latency) {
        const hash = response.headers.get("x-ratelimit-bucket");
        const limit = response.headers.get("x-ratelimit-limit");
        const remaining = response.headers.get("x-ratelimit-remaining");
        const resetAfter = response.headers.get("x-ratelimit-reset-after")
            || response.headers.get("retry-after");

        const now = Date.now();
        if(hash) {
            if(this.#hash !== hash) {
                this.#handler.hashes.set(request.id, {
                    value: hash,
                    lastAccess: now
                });

                this.#handler.rest.emit("debug", `Updated bucket hash (${this.#hash}) to ${hash}`);
            } else {
                const hashData = this.#handler.hashes.get(request.id);
                if(hashData) {
                    hashData.lastAccess = now;
                }
            }
        }

        if(limit) {
            this.limit = +limit;
        }

        this.remaining = remaining ? +remaining : 1;

        let retryAfter = 0;
        if(resetAfter) {
            retryAfter = +resetAfter * 1000 + this.#handler.options.ratelimiterOffset;
        }

        if(retryAfter > 0) {
            if(response.headers.get("x-ratelimit-global")) {
                this.#handler.globalReset = now + retryAfter;
                this.#handler.globalBlock = true;
            } else {
                this.reset = now + retryAfter;
            }

            return retryAfter;
        }

        const serverDate = response.headers.has("date")
            ? Date.parse(response.headers.get("date"))
            : now;

        const offset = now - serverDate + latency;
        this.reset = Math.max(+(response.headers.get("x-ratelimit-reset") || 0) * 1000 + offset, now)
            + this.#handler.options.ratelimiterOffset;
    }

    /**
     * Sets the global timeout by creating a promise that resolves after the specified delay.
     * @arg {Number} delay How long (in milliseconds) the global limit lasts.
     */
    #setGlobalTimeout(delay) {
        this.#handler.globalTimeout = Mutex.wait(delay).then(() => {
            this.#handler.globalTimeout = undefined;
        });
    }
}

module.exports = SequentialBucket;
