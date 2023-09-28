"use strict";

const ThreadChannel = require("./ThreadChannel");

/**
* Represents a public thread channel. See ThreadChannel for extra properties.
* @extends ThreadChannel
*/
class PublicThreadChannel extends ThreadChannel {
    constructor(data, client, messageLimit) {
        super(data, client, messageLimit);
    }

    update(data, client) {
        super.update(data, client);
        if(data.applied_tags !== undefined) {
            /**
             * An array of applied tag IDs for the thread (available only in threads in thread-only channels)
             * @type {Array<String>?}
             */
            this.appliedTags = data.applied_tags;
        }
    }
}

module.exports = PublicThreadChannel;
