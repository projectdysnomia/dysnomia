"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints.js");

/**
 * Represents a GuildPreview structure
 * @extends Base
 */
class GuildPreview extends Base {
    #client;
    /**
     * The ID of the guild
     * @member {String} GuildPreview#id
     */
    constructor(data, client) {
        super(data.id);
        this.#client = client;

        /**
         * The name of the guild
         * @type {String}
         */
        this.name = data.name;
        /**
         * The hash of the guild icon, or null if no icon
         * @type {String?}
         */
        this.icon = data.icon;
        /**
         * The description for the guild
         * @type {String?}
         */
        this.description = data.description;
        /**
         * The hash of the guild splash image, or null if no splash (VIP only)
         * @type {String?}
         */
        this.splash = data.splash;
        /**
         * The hash of the guild discovery splash image, or null if no splash
         * @type {String?}
         */
        this.discoverySplash = data.discovery_splash;
        /**
         * An array of guild feature strings
         * @type {Array<String>}
         */
        this.features = data.features;
        /**
         * The **approximate** number of members in the guild
         * @type {Number}
         */
        this.approximateMemberCount = data.approximate_member_count;
        /**
         * The **approximate** number of presences in the guild
         * @type {Number}
         */
        this.approximatePresenceCount = data.approximate_presence_count;
        /**
         * An array of guild emoji objects
         * @type {Array<Object>}
         */
        this.emojis = data.emojis;
        /**
         * An array of guild sticker objects
         * @type {Array<Object>}
         */
        this.stickers = data.stickers;
    }

    /**
     * The URL of the guild's icon
     * @type {String?}
     */
    get iconURL() {
        return this.icon ? this.#client._formatImage(Endpoints.GUILD_ICON(this.id, this.icon)) : null;
    }

    /**
     * The URL of the guild's splash image
     * @type {String?}
     */
    get splashURL() {
        return this.splash ? this.#client._formatImage(Endpoints.GUILD_SPLASH(this.id, this.splash)) : null;
    }

    /**
     * The URL of the guild's discovery splash image
     * @type {String?}
     */
    get discoverySplashURL() {
        return this.discoverySplash ? this.#client._formatImage(Endpoints.GUILD_DISCOVERY_SPLASH(this.id, this.discoverySplash)) : null;
    }

    /**
     * Get the guild's discovery splash with the given format and size
     * @param {String} [format] The filetype of the discovery splash ("jpg", "jpeg", "png", "gif", or "webp")
     * @param {Number} [size] The size of the discovery splash (any power of two between 16 and 4096)
     * @param {Boolean} [forceStatic=false] Whether to force the discovery splash to be static even if it is animated
     * @returns {String?}
     */
    dynamicDiscoverySplashURL(format, size, forceStatic) {
        return this.discoverySplash ? this.#client._formatImage(Endpoints.GUILD_DISCOVERY_SPLASH(this.id, this.discoverySplash), format, size, forceStatic) : null;
    }

    /**
     * Get the guild's icon with the given format and size
     * @param {String} [format] The filetype of the icon ("jpg", "jpeg", "png", "gif", or "webp")
     * @param {Number} [size] The size of the icon (any power of two between 16 and 4096)
     * @param {Boolean} [forceStatic=false] Whether to force the icon to be static even if it is animated
     * @returns {String?}
     */
    dynamicIconURL(format, size, forceStatic) {
        return this.icon ? this.#client._formatImage(Endpoints.GUILD_ICON(this.id, this.icon), format, size, forceStatic) : null;
    }

    /**
     * Get the guild's splash with the given format and size
     * @param {String} [format] The filetype of the splash ("jpg", "jpeg", "png", "gif", or "webp")
     * @param {Number} [size] The size of the splash (any power of two between 16 and 4096)
     * @param {Boolean} [forceStatic=false] Whether to force the splash to be static even if it is animated
     * @returns {String?}
     */
    dynamicSplashURL(format, size, forceStatic) {
        return this.splash ? this.#client._formatImage(Endpoints.GUILD_SPLASH(this.id, this.splash), format, size, forceStatic) : null;
    }

    toJSON(props = []) {
        return super.toJSON([
            "approximateMemberCount",
            "approximatePresenceCount",
            "description",
            "discoverySplash",
            "emojis",
            "features",
            "icon",
            "name",
            "splash",
            ...props
        ]);
    }
}

module.exports = GuildPreview;
