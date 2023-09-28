"use strict";

const Base = require("./Base");

/**
* Represents a guild
* @extends Base
*/
class UnavailableGuild extends Base {
    /**
     * The ID of the guild
     * @member {String} UnavailableGuild#id
     */
    constructor(data, client) {
        super(data.id);
        /**
         * The shard that owns this guild
         * @type {Shard}
         */
        this.shard = client.shards.get(client.guildShardMap[this.id]);
        /**
         * Whether the guild is unavailable or not
         * @type {Boolean}
         */
        this.unavailable = !!data.unavailable;
    }

    toJSON(props = []) {
        return super.toJSON([
            "unavailable",
            ...props
        ]);
    }
}

module.exports = UnavailableGuild;
