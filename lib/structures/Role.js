"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");
const Permission = require("./Permission");

/**
* Represents a role
* @prop {Number} color The hex color of the role in base 10
* @prop {Number} createdAt Timestamp of the role's creation
* @prop {Boolean} hoist Whether users with this role are hoisted in the user list or not
* @prop {String?} icon The hash of the role's icon, or null if no icon
* @prop {String?} iconURL The URL of the role's icon
* @prop {String} id The ID of the role
* @prop {Object} json Generates a JSON representation of the role permissions
* @prop {Guild} guild The guild that owns the role
* @prop {Boolean} managed Whether a guild integration manages this role or not
* @prop {String} mention A string that mentions the role
* @prop {Boolean} mentionable Whether the role is mentionable or not
* @prop {String} name The name of the role
* @prop {Permission} permissions The permissions representation of the role
* @prop {Number} position The position of the role
* @prop {Object?} tags The tags of the role
* @prop {String?} tags.bot_id The ID of the bot associated with the role
* @prop {String?} tags.integration_id The ID of the integration associated with the role
* @prop {Boolean?} tags.premium_subscriber Whether the role is the guild's premium subscriber role
* @prop {String?} unicodeEmoji Unicode emoji for the role
*/
class Role extends Base {
    constructor(data, guild) {
        super(data.id);
        this.guild = guild;
        this.update(data);
    }

    update(data) {
        if(data.name !== undefined) {
            this.name = data.name;
        }
        if(data.mentionable !== undefined) {
            this.mentionable = data.mentionable;
        }
        if(data.managed !== undefined) {
            this.managed = data.managed;
        }
        if(data.hoist !== undefined) {
            this.hoist = data.hoist;
        }
        if(data.color !== undefined) {
            this.color = data.color;
        }
        if(data.position !== undefined) {
            this.position = data.position;
        }
        if(data.permissions !== undefined) {
            this.permissions = new Permission(data.permissions);
        }
        if(data.tags !== undefined) {
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
            this.icon = data.icon;
        }
        if(data.unicode_emoji !== undefined) {
            this.unicodeEmoji = data.unicode_emoji;
        }
    }

    get iconURL() {
        return this.icon ? this.guild.shard.client._formatImage(Endpoints.ROLE_ICON(this.id, this.icon)) : null;
    }

    get json() {
        return this.permissions.json;
    }

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
