"use strict";

const ThreadChannel = require("./ThreadChannel");

/**
* Represents a news thread channel.
* @extends ThreadChannel
*/
class NewsThreadChannel extends ThreadChannel {
    constructor(data, client, messageLimit) {
        super(data, client, messageLimit);
    }
}

module.exports = NewsThreadChannel;
