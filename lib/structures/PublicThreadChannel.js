"use strict";

const ThreadChannel = require("./ThreadChannel");

/**
* Represents a public thread channel. See ThreadChannel for extra properties.
* @extends ThreadChannel
* @prop {Array<String>} appliedTags An array of applied tag IDs for the thread (available in `GUILD_FORUM` threads only)
*/
class PublicThreadChannel extends ThreadChannel {
    constructor(data, client, messageLimit) {
        super(data, client, messageLimit);
        this.update(data);
    }

    update(data) {
        super.update(data);
        if (data.applied_tags !== undefined) {
            this.appliedTags = data.applied_tags;
        }
    }
}

module.exports = PublicThreadChannel;
