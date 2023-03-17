"use strict";

const Endpoints = require("./Endpoints");
const Request = require("./Request");
const SequentialBucket = require("./SequentialBucket");

/**
 * Represents a class to handle requests.
 */
class RequestHandler {
    /**
     * A map with SequentialBuckets.
     * @type {Map<String, SequentialBucket>}
     */
    buckets = new Map();

    /**
     * Whether we are currently globally limited.
     * @type {Boolean}
     */
    globalBlock = false;

    /**
     * The timestamp of the next reset.
     * @type {Number}
     */
    globalReset = 0;

    /**
     * A promise that will resolve as soon we are no longer limited.
     * @type {Promise<void>}
     */
    globalTimeout;

    /**
     * A map with bucket hash data.
     * @type {Map<String, Object>}
     */
    hashes = new Map();

    /**
     * Options for the RequestHandler.
     * @type {Object}
     */
    options;

    /**
     * The REST client.
     * @type {RESTClient}
     */
    rest;

    /**
     * The authentication token.
     * @type {String}
     */
    #token;

    /**
     * Represents a class to handle requests.
     * @arg {RESTClient} rest The REST client.
     * @arg {RESTOptions} options Options for the RequestHandler.
     * @arg {Object} [options.agent] The dispatcher to use for undici.
     * @arg {String} [options.baseURL] The base URL to use for API requests.
     * @arg {Number} [options.ratelimiterOffset=0] A number of milliseconds to offset the ratelimit timing calculations by.
     * @arg {Number} [options.requestTimeout=15000] A number of milliseconds before requests are considered timed out.
     * @arg {Number} [options.retryLimit=3] The amount of times it will retry to send the request.
     * @arg {String} [options.token] The authentication token.
     */
    constructor(rest, options = {}) {
        this.rest = rest;
        this.options = {
            agent: options.agent,
            baseURL: options.baseURL ?? Endpoints.BASE_URL,
            ratelimiterOffset: options.ratelimiterOffset ?? 0,
            requestTimeout: options.requestTimeout ?? 15000,
            retryLimit: options.retryLimit ?? 3
        };

        if(options.token) {
            this.#token = options.token;
        }
    }

    /**
     * Whether we are currently globally limited.
     * @readonly
     */
    get limited() {
        return this.globalBlock && Date.now() < this.globalReset;
    }

    /**
     * Makes a request to the API.
     * @arg {String} method An uppercase HTTP method.
     * @arg {String} path The endpoint to make the request to.
     * @arg {Object} options Data regarding the request.
     * @arg {Boolean} [options.auth] Whether to add the "Authorization" header.
     * @arg {Object} [options.body] The data to be set for the request body.
     * @arg {Object} [options.headers] The headers to attach to the request.
     * @arg {Object[]} [options.files] The files to attach to the request body.
     * @arg {Boolean} [options.formdata] Whether to attach the body directly to form data instead of "payload_json" when sending files.
     * @arg {Object} [options.query] An object of query keys and their values.
     * @arg {String} [options.reason] The reason to display in the audit log.
     * @returns {Promise<Object>} Resolves with the returned JSON data.
     */
    async request(method, path, options = {}) {
        const request = new Request(this, method, path, options);
        if(options.auth) {
            if(!this.#token) {
                throw new Error("Missing required token");
            }

            request.headers["Authorization"] = this.#token;
        }

        const hash = this.hashes.get(request.id)?.value ?? request.id;

        const bucket = this.#getBucket(hash, request.majorParameter);
        return bucket.add(request);
    }

    /**
     * Get or create a SequentialBucket for the request.
     * @arg {String} hash The hash of bucket.
     * @arg {String} majorParameter The major parameter of the bucket.
     * @returns {SequentialBucket}
     */
    #getBucket(hash, majorParameter) {
        const bucket = this.buckets.get(`${hash}:${majorParameter}`);
        if(bucket) {
            return bucket;
        }

        const newBucket = new SequentialBucket(this, hash, majorParameter);
        this.buckets.set(newBucket.id, newBucket);

        return newBucket;
    }
}

module.exports = RequestHandler;
