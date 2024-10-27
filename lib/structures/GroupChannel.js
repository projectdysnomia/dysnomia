"use strict";

const Collection = require("../util/Collection");
const Endpoints = require("../rest/Endpoints");
const PrivateChannel = require("./PrivateChannel");
const User = require("./User");

/**
 * Represents a group channel
 * @extends PrivateChannel
 */
class GroupChannel extends PrivateChannel { // (╯°□°）╯︵ ┻━┻
    #client;
    /**
     * The recipients of this group channel
     * @type {Collection<User>}
     */
    recipients = new Collection(User);
    constructor(data, client) {
        super(data, client);
        this.#client = client;

        data.recipients?.forEach((recipient) => {
            this.recipients.add(client.options.restMode ? new User(recipient, client) : client.users.add(recipient, client));
        });
        this.update(data);
    }

    update(data) {
        if(data.name !== undefined) {
            /**
             * The name of this group channel
             * @type {String}
             */
            this.name = data.name;
        }
        if(data.owner_id !== undefined) {
            /**
             * The ID of the owner of this group channel
             * @type {String}
             */
            this.ownerID = data.owner_id;
        }
        if(data.icon !== undefined) {
            /**
             * The hash of the group channel icon
             * @type {String?}
             */
            this.icon = data.icon;
        }
    }

    /**
     * The URL of the group channel icon
     * @type {String?}
     */
    get iconURL() {
        return this.icon ? this.#client._formatImage(Endpoints.CHANNEL_ICON(this.id, this.icon)) : null;
    }

    /**
     * Get the group's icon with the given format and size
     * @param {String} [format] The filetype of the icon ("jpg", "jpeg", "png", "gif", or "webp")
     * @param {Number} [size] The size of the icon (any power of two between 16 and 4096)
     * @returns {String?}
     */
    dynamicIconURL(format, size) {
        return this.icon ? this.#client._formatImage(Endpoints.CHANNEL_ICON(this.id, this.icon), format, size) : null;
    }

    toJSON(props = []) {
        return super.toJSON([
            "icon",
            "name",
            "ownerID",
            "recipients",
            ...props
        ]);
    }
}

module.exports = GroupChannel;
