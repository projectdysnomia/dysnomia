"use strict";

const Base = require("../structures/Base");
const {fetch, FormData} = typeof window !== "undefined" ? window : require("undici");

const USER_AGENT = `DiscordBot (https://github.com/projectdysnomia/dysnomia, ${require("../../package.json").version})`;

/**
 * Represents the request.
 */
class Request {
    /**
     * The data to be set for the request body.
     * @type {FormData | String}
     */
    data;

    /**
     * The RequestHandler.
     * @type {RequestHandler}
     */
    handler;

    /**
     * The headers to attach to the request.
     * @type {Object}
     */
    headers = {
        "Accept-Encoding": "gzip,deflate",
        "User-Agent": USER_AGENT
    };

    /**
     * The major parameter of the request.
     * @type {String}
     */
    majorParameter;

    /**
     * An uppercase HTTP method.
     * @type {String}
     */
    method;

    /**
     * Data regarding the request.
     * @type {Object}
     */
    options;

    /**
     * The endpoint to make the request to.
     * @type {String}
     */
    path;

    /**
     * The route to make the request to.
     * @type {String}
     */
    route;

    /**
     * The URL to make the request to.
     * @type {URL}
     */
    url;

    /**
     * Represents the request.
     * @arg {RequestHandler} handler Represents the RequestHandler.
     * @arg {String} method An uppercase HTTP method.
     * @arg {String} path The endpoint to make the request to.
     * @arg {Object} options Data regarding the request.
     * @arg {Boolean} [options.auth] Whether to add the "Authorization" header.
     * @arg {Object} [options.body] The data to be set for the request body.
     * @arg {Object} [options.headers] The headers to attach to the request.
     * @arg {Object[]} [options.files] The files to attach to the request body.
     * @arg {Boolean} [options.formData] Whether to attach the body directly to form data instead of "payload_json" when sending files.
     * @arg {Object} [options.query] An object of query keys and their values.
     * @arg {String} [options.reason] The reason to display in the audit log.
     */
    constructor(handler, method, path, options) {
        this.handler = handler;
        this.method = method;
        this.path = path;
        this.options = options;

        this.url = new URL(handler.options.baseURL + path);
        if(typeof options.query === "object") {
            for(const key in options.query) {
                if(options.query[key] !== undefined) {
                    this.url.searchParams.append(key, options.query[key]);
                }
            }
        }

        if(typeof options.headers === "object") {
            for(const key in options.headers) {
                this.headers[key] = options.headers[key];
            }
        }

        if(options.reason) {
            this.headers["X-Audit-Log-Reason"] = encodeURIComponent(options.reason);
        }

        this.setBody(options.body, options.files);
        this.majorParameter = this.#getMajorParameter();
        this.route = this.#getRoute();
    }

    /**
     * The identifier of the request.
     * @type {String}
     * @readonly
     */
    get id() {
        return `${this.method}:${this.route}`;
    }

    /**
     * Sends the request to Discord.
     * @returns {Promise<Object>} The response.
     */
    async send() {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), this.handler.options.requestTimeout);

        return fetch(this.url, {
            body: this.data,
            dispatcher: this.handler.options.agent,
            headers: this.headers,
            method: this.method,
            signal: controller.signal
        });
    }

    /**
     * Attach data to the request.
     * @arg {Object} body Optional data to attach to the request.
     * @arg {Object[]} files Optional files to attach to the request.
     * @returns {Request}
     */
    setBody(body, files) {
        if(files?.length) {
            const form = new FormData();
            for(let i = 0; i < files.length; i++) {
                if(files[i]) {
                    form.append(`files[${i}]`, files[i].file, files[i].name);
                }
            }

            if(body) {
                if(this.options.formData) {
                    for(const key in body) {
                        form.append(key, body[key]);
                    }
                } else {
                    form.append("payload_json", body);
                }
            }

            this.data = form;
        } else if(body) {
            this.data = JSON.stringify(body, (k, v) => (typeof v === "bigint" ? v.toString() : v));
            this.headers["Content-Type"] = "application/json";
        }

        return this;
    }

    /**
     * Returns the major parameter based of the request.
     * @returns {String} The major parameter.
     */
    #getMajorParameter() {
        return /^\/(?:channels|guilds|webhooks)\/(\d{16,19})/.exec(this.path)?.[1] ?? "global";
    }

    /**
     * Returns the route based of the request.
     * @returns {String} The route of the request.
     */
    #getRoute() {
        const route = this.path
            .replace(/\/reactions\/.*/g, "/reactions/:id")
            .replace(/\d{16,19}/g, ":id");

        let exceptions = "";
        if(this.method === "DELETE" && route === "/channels/:id/messages/:id") {
            const messageID = this.path.slice(this.path.lastIndexOf("/") + 1);
            const createdAt = Base.getCreatedAt(messageID);

            const diff = Date.now() - createdAt;
            if(diff >= 1_209_600_000) {
                exceptions += ";old";
            } else if(diff <= 10_000) {
                exceptions += ";new";
            }
        }

        return route + exceptions;
    }
}

module.exports = Request;
