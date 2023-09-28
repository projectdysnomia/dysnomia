"use strict";

const ThreadChannel = require("./ThreadChannel");

/**
* Represents a private thread channel. See ThreadChannel for extra properties.
* @extends ThreadChannel
*/
class PrivateThreadChannel extends ThreadChannel {
    constructor(data, client, messageLimit) {
        super(data, client, messageLimit);
    }

    update(data, client) {
        super.update(data, client);
        if(data.thread_metadata !== undefined) {
            /**
             * Metadata for the thread
             * @override
             * @type {ThreadChannel.ThreadMetadata}
             */
            this.threadMetadata = {
                archiveTimestamp: Date.parse(data.thread_metadata.archive_timestamp),
                archived: data.thread_metadata.archived,
                autoArchiveDuration: data.thread_metadata.auto_archive_duration,
                createTimestamp: !data.thread_metadata.create_timestamp ? null : Date.parse(data.thread_metadata.create_timestamp),
                invitable: data.thread_metadata.invitable,
                locked: data.thread_metadata.locked
            };
        }
    }
}

module.exports = PrivateThreadChannel;
