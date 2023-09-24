"use strict";

const Collection = require("../util/Collection");
const GuildChannel = require("./GuildChannel");
const PermissionOverwrite = require("./PermissionOverwrite");

/**
* Represents a guild category channel. See GuildChannel for more properties and methods.
* @extends GuildChannel
*/
class CategoryChannel extends GuildChannel {
    constructor(data, client) {
        super(data, client);
    }

    update(data, client) {
        super.update(data, client);
        if(data.permission_overwrites) {
            /**
             * Collection of PermissionOverwrites in this channel
             * @type {Collection<PermissionOverwrite>}
             */
            this.permissionOverwrites = new Collection(PermissionOverwrite);
            data.permission_overwrites.forEach((overwrite) => {
                this.permissionOverwrites.add(overwrite);
            });
        }
        if(data.position !== undefined) {
            /**
             * The position of the channel
             * @type {Number}
             */
            this.position = data.position;
        }
    }

    /**
     * A collection of guild channels that are part of this category
     * @type {Collection<GuildChannel>}
     */
    get channels() {
        const channels = new Collection(GuildChannel);
        if(this.guild?.channels) {
            for(const channel of this.guild.channels.values()) {
                if(channel.parentID === this.id) {
                    channels.add(channel);
                }
            }
        }
        return channels;
    }

    toJSON(props = []) {
        return super.toJSON([
            "permissionOverwrites",
            "position",
            ...props
        ]);
    }
}

module.exports = CategoryChannel;
