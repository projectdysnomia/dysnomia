"use strict";

class DiscordHTTPError extends Error {
    constructor(req, res, stack) {
        super(`${res.status} ${res.statusText || "Unknown error"} on ${req.method} ${req.path}`);

        Object.defineProperty(this, "req", {
            enumerable: false,
            value: req
        });

        Object.defineProperty(this, "res", {
            enumerable: false,
            value: res
        });

        Object.defineProperty(this, "code", {
            enumerable: false,
            value: res.status
        });

        if(stack) {
            this.stack = this.name + ": " + this.message + "\n" + stack;
        } else {
            Error.captureStackTrace(this, DiscordHTTPError);
        }
    }

    get headers() {
        return this.res.headers;
    }

    get name() {
        return this.constructor.name;
    }
}

module.exports = DiscordHTTPError;
