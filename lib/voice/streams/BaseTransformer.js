"use strict";

const util = require("node:util");
const Base = require("../../structures/Base");
const TransformStream = require("node:stream").Transform;

class BaseTransformer extends TransformStream {
    #transformCB;
    manualCB = false;
    constructor(options = {}) {
        options.allowHalfOpen ??= true;
        options.highWaterMark ??= 0;
        super(options);
    }

    setTransformCB(cb) {
        if(this.manualCB) {
            this.transformCB();
            this.#transformCB = cb;
        } else {
            cb();
        }
    }

    transformCB() {
        if(this.#transformCB) {
            this.#transformCB();
            this.#transformCB = null;
        }
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

module.exports = BaseTransformer;
