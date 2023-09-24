"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");

/**
* Represents a user
* @extends Base
*/
class User extends Base {
    /**
     * The ID of the user
     * @member {String} User#id
     */
    /**
     * Timestamp of the user's creation
     * @member {Number} User#createdAt
     */

    #client;
    #missingClientError;
    constructor(data, client) {
        super(data.id);
        if(!client) {
            this.#missingClientError = new Error("Missing client in constructor"); // Preserve constructor callstack
        }
        this.#client = client;
        /**
         * Whether the user is an OAuth bot or not
         * @type {Boolean}
         */
        this.bot = !!data.bot;
        /**
         * Whether the user is an official Discord system user (e.g. urgent messages)
         * @type {Boolean}
         */
        this.system = !!data.system;
        this.update(data);
    }

    update(data) {
        if(data.avatar !== undefined) {
            /**
             * The hash of the user's avatar, or null if no avatar
             * @type {String?}
             */
            this.avatar = data.avatar;
        }
        if(data.username !== undefined) {
            /**
             * The username of the user
             * @type {String}
             */
            this.username = data.username;
        }
        if(data.discriminator !== undefined) {
            /**
             * The discriminator of the user - if a single zero digit ("0"), the user is using the unique username system
             * @type {String}
             */
            this.discriminator = data.discriminator;
        }
        if(data.public_flags !== undefined) {
            /**
             * Publicly visible flags for this user
             * @type {Number?}
             */
            this.publicFlags = data.public_flags;
        }
        if(data.banner !== undefined) {
            /**
             * The hash of the user's banner, or null if no banner (REST only)
             * @type {String?}
             */
            this.banner = data.banner;
        }
        if(data.accent_color !== undefined) {
            /**
             * The user's banner color, or null if no banner color (REST only)
             * @type {Number?}
             */
            this.accentColor = data.accent_color;
        }
        if(data.global_name !== undefined) {
            /**
             * The globally visible display name of the user
             * @type {String?}
             */
            this.globalName = data.global_name;
        }
    }

    /**
     * The URL of the user's avatar which can be either a JPG or GIF
     * @type {String}
     */
    get avatarURL() {
        if(this.#missingClientError) {
            throw this.#missingClientError;
        }
        return this.avatar ? this.#client._formatImage(Endpoints.USER_AVATAR(this.id, this.avatar)) : this.defaultAvatarURL;
    }

    /**
     * The URL of the user's banner
     * @type {String?}
     */
    get bannerURL() {
        if(!this.banner) {
            return null;
        }
        if(this.#missingClientError) {
            throw this.#missingClientError;
        }
        return this.#client._formatImage(Endpoints.BANNER(this.id, this.banner));
    }

    /**
     * The hash for the default avatar of a user if there is no avatar set
     * @type {String}
     */
    get defaultAvatar() {
        if(this.discriminator === "0") {
            return Base.getDiscordEpoch(this.id) % 6;
        }
        return this.discriminator % 5;
    }

    /**
     * The URL of the user's default avatar
     * @type {String}
     */
    get defaultAvatarURL() {
        return `${Endpoints.CDN_URL}${Endpoints.DEFAULT_USER_AVATAR(this.defaultAvatar)}.png`;
    }

    /**
     * A string that mentions the user
     * @type {String}
     */
    get mention() {
        return `<@${this.id}>`;
    }

    /**
     * The URL of the user's avatar (always a JPG)
     * @type {String}
     */
    get staticAvatarURL() {
        if(this.#missingClientError) {
            throw this.#missingClientError;
        }
        return this.avatar ? this.#client._formatImage(Endpoints.USER_AVATAR(this.id, this.avatar), "jpg") : this.defaultAvatarURL;
    }

    /**
    * Get the user's avatar with the given format and size
    * @arg {String} [format] The filetype of the avatar ("jpg", "jpeg", "png", "gif", or "webp")
    * @arg {Number} [size] The size of the avatar (any power of two between 16 and 4096)
    * @returns {String}
    */
    dynamicAvatarURL(format, size) {
        if(!this.avatar) {
            return this.defaultAvatarURL;
        }
        if(this.#missingClientError) {
            throw this.#missingClientError;
        }
        return this.#client._formatImage(Endpoints.USER_AVATAR(this.id, this.avatar), format, size);
    }

    /**
    * Get the user's banner with the given format and size
    * @arg {String} [format] The filetype of the banner ("jpg", "jpeg", "png", "gif", or "webp")
    * @arg {Number} [size] The size of the banner (any power of two between 16 and 4096)
    * @returns {String?}
    */
    dynamicBannerURL(format, size) {
        if(!this.banner) {
            return null;
        }
        if(this.#missingClientError) {
            throw this.#missingClientError;
        }
        return this.#client._formatImage(Endpoints.BANNER(this.id, this.banner), format, size);
    }

    /**
    * Get a DM channel with the user, or create one if it does not exist
    * @returns {Promise<PrivateChannel>}
    */
    getDMChannel() {
        return this.#client.getDMChannel.call(this.#client, this.id);
    }

    toJSON(props = []) {
        return super.toJSON([
            "accentColor",
            "avatar",
            "banner",
            "bot",
            "discriminator",
            "globalName",
            "publicFlags",
            "system",
            "username",
            ...props
        ]);
    }
}

module.exports = User;
