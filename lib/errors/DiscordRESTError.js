"use strict";

class DiscordRESTError extends Error {
    constructor(req, res, response, stack) {
        super();

        Object.defineProperty(this, "req", {
            enumerable: false,
            value: req
        });
        Object.defineProperty(this, "res", {
            enumerable: false,
            value: res
        });
        Object.defineProperty(this, "response", {
            enumerable: false,
            value: response
        });

        Object.defineProperty(this, "code", {
            enumerable: false,
            value: +response.code || -1
        });
        let message = response.message || "Unknown error";
        if(response.errors) {
            message += "\n  " + this.flattenErrors(response.errors).join("\n  ");
        } else {
            const errors = this.flattenErrors(response);
            if(errors.length > 0) {
                message += "\n  " + errors.join("\n  ");
            }
        }
        Object.defineProperty(this, "message", {
            enumerable: false,
            value: message
        });

        if(stack) {
            this.stack = this.name + ": " + this.message + "\n" + stack;
        } else {
            Error.captureStackTrace(this, DiscordRESTError);
        }
    }

    get headers() {
        return this.response.headers;
    }

    get name() {
        return `${this.constructor.name} [${this.code}]`;
    }

    flattenErrors(errors, keyPrefix = "") {
        return Object.entries(errors).reduce((messages, [fieldName, value]) => {
            if (fieldName === "message" || fieldName === "code") {
                return messages;
            }

            const prefix = keyPrefix + fieldName + ": ";
            if(Array.isArray(value)) {
                return messages.concat(value.map((str) => prefix + str));
            }

            if(value._errors) {
                return messages.concat(value._errors.map((obj) => prefix + obj.message));
            }

            return messages.concat(this.flattenErrors(value, prefix));
        }, []);
    }
}

module.exports = DiscordRESTError;
