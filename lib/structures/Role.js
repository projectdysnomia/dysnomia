"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");
const Permission = require("./Permission");

/**
* Represents a role
* @extends Base
*/
class Role extends Base {
    /**
     * The ID of the role
     * @member {String} Role#id
     */
    /**
     * Timestamp of the role's creation
     * @member {Number} Role#createdAt
     */
    constructor(data, guild) {
        super(data.id);
        /**
         * The guild that owns the role
         * @type {Guild}
         */
        this.guild = guild;
        this.update(data);
    }

    update(data) {
        if(data.name !== undefined) {
            /**
             * The name of the role
             * @type {String}
             */
            this.name = data.name;
        }
        if(data.mentionable !== undefined) {
            /**
             * Whether the role is mentionable or not
             * @type {Boolean}
             */
            this.mentionable = data.mentionable;
        }
        if(data.managed !== undefined) {
            /**
             * Whether a guild integration manages this role or not
             * @type {Boolean}
             */
            this.managed = data.managed;
        }
        if(data.hoist !== undefined) {
            /**
             * Whether users with this role are hoisted in the user list or not
             * @type {Boolean}
             */
            this.hoist = data.hoist;
        }
        if(data.color !== undefined) {
            /**
             * The hex color of the role in base 10
             * @type {Number}
             */
            this.color = data.color;
        }
        if(data.position !== undefined) {
            /**
             * The position of the role
             * @type {Number}
             */
            this.position = data.position;
        }
        if(data.permissions !== undefined) {
            /**
             * The permissions representation of the role
             * @type {Permission}
             */
            this.permissions = new Permission(data.permissions);
        }
        if(data.tags !== undefined) {
            /**
             * The tags of the role
             * @type {Object<string, string | boolean>}
             * @prop {String?} bot_id The ID of the bot associated with the role
             * @prop {String?} integration_id The ID of the integration associated with the role
             * @prop {Boolean?} premium_subscriber Whether the role is the guild's premium subscriber role
             */
            this.tags = data.tags;
            if(this.tags.guild_connections === null) {
                this.tags.guild_connections = true;
            }
            if(this.tags.premium_subscriber === null) {
                this.tags.premium_subscriber = true;
            }
            if(this.tags.available_for_purchase === null) {
                this.tags.available_for_purchase = true;
            }
        }
        if(data.icon !== undefined) {
            /**
             * The hash of the role's icon, or null if no icon
             * @type {String?}
             */
            this.icon = data.icon;
        }
        if(data.unicode_emoji !== undefined) {
            /**
             * Unicode emoji for the role
             * @type {String?}
             */
            this.unicodeEmoji = data.unicode_emoji;
        }
        if(data.flags !== undefined) {
            /**
             * Role flags. See [Discord's documentation](https://discord.com/developers/docs/topics/permissions#role-object-role-flags) for a list of them
             * @type {Number}
             */
            this.flags = data.flags;
        }
    }

    /**
     * The URL of the role's icon
     * @type {String}
     */
    get iconURL() {
        return this.icon ? this.guild.shard.client._formatImage(Endpoints.ROLE_ICON(this.id, this.icon)) : null;
    }

    /**
     * Generates a JSON representation of the role permissions
     * @type {Object<string, boolean>}
     */
    get json() {
        return this.permissions.json;
    }

    /**
     * A string that mentions the role
     * @type {String}
     */
    get mention() {
        return `<@&${this.id}>`;
    }

    /**
    * Delete the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    delete(reason) {
        return this.guild.shard.client.deleteRole.call(this.guild.shard.client, this.guild.id, this.id, reason);
    }

    /**
    * Edit the guild role
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.color] The hex color of the role, in number form (ex: 0x3da5b3 or 4040115)
    * @arg {Boolean} [options.hoist] Whether to hoist the role in the user list or not
    * @arg {String} [options.icon] The role icon as a base64 data URI
    * @arg {Boolean} [options.mentionable] Whether the role is mentionable or not
    * @arg {String} [options.name] The name of the role
    * @arg {BigInt | Number} [options.permissions] The role permissions number
    * @arg {String?} [options.unicodeEmoji] The role's unicode emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Role>}
    */
    edit(options, reason) {
        return this.guild.shard.client.editRole.call(this.guild.shard.client, this.guild.id, this.id, options, reason);
    }

    /**
    * Edit the role's position. Note that role position numbers are highest on top and lowest at the bottom.
    * @arg {Number} position The new position of the role
    * @returns {Promise}
    */
    editPosition(position) {
        return this.guild.shard.client.editRolePosition.call(this.guild.shard.client, this.guild.id, this.id, position);
    }

    toJSON(props = []) {
        return super.toJSON([
            "color",
            "hoist",
            "icon",
            "flags",
            "managed",
            "mentionable",
            "name",
            "permissions",
            "position",
            "tags",
            "unicodeEmoji",
            ...props
        ]);
    }
}

module.exports = Role;
