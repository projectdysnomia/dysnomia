"use strict";

const Endpoints = require("../rest/Endpoints");
const PrivateChannel = require("./PrivateChannel");

/**
 * Represents a group channel
 * @extends PrivateChannel
 */
class GroupChannel extends PrivateChannel { // (╯°□°）╯︵ ┻━┻
    #client;
    constructor(data, client) {
        super(data, client);
        this.#client = client;

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
            ...props
        ]);
    }
}

module.exports = GroupChannel;
