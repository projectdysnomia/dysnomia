"use strict";

const util = require("node:util");
const Base = require("../../structures/Base");
const TransformStream = require("node:stream").Transform;

class BaseTransformer extends TransformStream {
    manualCB = false;
    constructor(options = {}) {
        options.allowHalfOpen ??= true;
        options.highWaterMark ??= 0;
        super(options);
    }

    setTransformCB(cb) {
        if(this.manualCB) {
            this.transformCB();
            this._transformCB = cb;
        } else {
            cb();
        }
    }

    transformCB() {
        if(this._transformCB) {
            this._transformCB();
            this._transformCB = null;
        }
    }

    [util.inspect.custom]() {
        return Base.prototype[util.inspect.custom].call(this);
    }
}

module.exports = BaseTransformer;
