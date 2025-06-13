"use strict";

const util = require("node:util");
const Base = require("../structures/Base");

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch{
    EventEmitter = require("node:events").EventEmitter;
}

class BrowserWebSocketError extends Error {
    constructor(message, event) {
        super(message);
        this.event = event;
    }
}

/**
 * Represents a browser's websocket usable by Dysnomia
 * @extends EventEmitter
 */
class BrowserWebSocket extends EventEmitter {
    #ws;
    /**
     * Creates a browser web socket
     * @param {String} url The URL to connect to
     */
    constructor(url) {
        super();

        if(typeof window === "undefined") {
            throw new Error("BrowserWebSocket cannot be used outside of a browser environment");
        }

        this.#ws = new window.WebSocket(url);
        this.#ws.binaryType = "arraybuffer";
        this.#ws.onopen = () => this.emit("open");
        this.#ws.onmessage = this.#onMessage.bind(this);
        this.#ws.onerror = (event) => this.emit("error", new BrowserWebSocketError("Unknown error", event));
        this.#ws.onclose = (event) => this.emit("close", event.code, event.reason);
    }

    get readyState() {
        return this.#ws.readyState;
    }

    close(code, reason) {
        return this.#ws.close(code, reason);
    }

    removeEventListener(type, listener) {
        return this.removeListener(type, listener);
    }

    send(data) {
        return this.#ws.send(data);
    }

    terminate() {
        return this.#ws.close();
    }

    async #onMessage(event) {
        if(event.data instanceof window.Blob) {
            this.emit("message", await event.data.arrayBuffer());
        } else {
            this.emit("message", event.data);
        }
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

BrowserWebSocket.CONNECTING = 0;
BrowserWebSocket.OPEN = 1;
BrowserWebSocket.CLOSING = 2;
BrowserWebSocket.CLOSED = 3;

module.exports = BrowserWebSocket;
