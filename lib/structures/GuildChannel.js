"use strict";

const Channel = require("./Channel");
const Permission = require("./Permission");
const {Permissions} = require("../Constants");

/**
* Represents a guild channel. You also probably want to look at CategoryChannel, NewsChannel, StoreChannel, TextChannel, ThreadChannel, and TextVoiceChannel.
* @extends Channel
*/
class GuildChannel extends Channel {
    #client;
    constructor(data, client) {
        super(data, client);
        this.#client = client;
        /**
         * The guild that owns the channel
         * @type {Guild}
         */
        this.guild = client.guilds.get(data.guild_id) || {
            id: data.guild_id
        };

        if(data.permissions !== undefined) {
            /**
             * The permissions of the bot user in this channel (available only for channels resolved via interactions)
             * @type {Permission?}
             */
            this.permissions = new Permission(data.permissions, 0);
        }

        this.update(data, client);
    }

    update(data) {
        if(data.type !== undefined) {
            this.type = data.type;
        }
        if(data.name !== undefined) {
            /**
             * The name of the channel
             * @type {String}
             */
            this.name = data.name;
        }
        if(data.parent_id !== undefined) {
            /**
             * The ID of the category this channel belongs to or the channel ID where the thread originated from (thread channels only)
             * @type {String?}
             */
            this.parentID = data.parent_id;
        }
        if(data.flags !== undefined) {
            /**
             * The flags of this channel
             * @type {Number?}
             */
            this.flags = data.flags;
        }
    }

    /**
    * Delete the channel
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    delete(reason) {
        return this.#client.deleteChannel.call(this.#client, this.id, reason);
    }

    /**
    * Delete a channel permission overwrite
    * @arg {String} overwriteID The ID of the overwritten user or role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deletePermission(overwriteID, reason) {
        return this.#client.deleteChannelPermission.call(this.#client, this.id, overwriteID, reason);
    }

    /**
    * Edit the channel's properties
    * @arg {Object} options The properties to edit
    * @arg {Boolean} [options.archived] The archive status of the channel (thread channels only)
    * @arg {Array<String>} [options.appliedTags] An array of applied tag IDs for the thread (available only in threads in thread-only channels)
    * @arg {Number} [options.autoArchiveDuration] The duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080 (thread channels only)
    * @arg {Array<Object>} [options.availableTags] Available tags for a forum channel
    * @arg {Number} [options.bitrate] The bitrate of the channel (guild voice channels only)
    * @arg {Number?} [options.defaultAutoArchiveDuration] The default duration of newly created threads in minutes to automatically archive the thread after inactivity (60, 1440, 4320, 10080) (guild text/news channels only)
    * @arg {Object} [options.defaultReactionEmoji] The emoji to show as the reaction button (forum channels only)
    * @arg {Number} [options.defaultSortOrder] The default thread sorting order
    * @arg {Number} [options.defaultThreadRateLimitPerUser] The initial ratelimit of the channel to use on newly created threads, in seconds. 0 means no ratelimit is enabled
    * @arg {Boolean} [options.invitable] Whether non-moderators can add other non-moderators to the channel (private thread channels only)
    * @arg {Boolean} [options.locked] The lock status of the channel (thread channels only)
    * @arg {String} [options.name] The name of the channel
    * @arg {Boolean} [options.nsfw] The nsfw status of the channel
    * @arg {Number?} [options.parentID] The ID of the parent channel category for this channel (guild text/voice channels only) or the channel ID where the thread originated from (thread channels only)
    * @arg {Array<Object>} [options.permissionOverwrites] An array containing permission overwrite objects
    * @arg {Number} [options.position] The sorting position of the channel
    * @arg {Number} [options.rateLimitPerUser] The time in seconds a user has to wait before sending another message (does not affect bots or users with manageMessages/manageChannel permissions) (guild text and thread channels only)
    * @arg {String?} [options.rtcRegion] The RTC region ID of the channel (automatic if `null`) (guild voice channels only)
    * @arg {String} [options.topic] The topic of the channel (guild text channels only)
    * @arg {Number} [options.userLimit] The channel user limit (guild voice channels only)
    * @arg {Number} [options.videoQualityMode] The camera video quality mode of the channel (guild voice channels only). `1` is auto, `2` is 720p
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<CategoryChannel | ForumChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>}
    */
    edit(options, reason) {
        return this.#client.editChannel.call(this.#client, this.id, options, reason);
    }

    /**
    * Create a channel permission overwrite
    * @arg {String} overwriteID The ID of the overwritten user or role
    * @arg {BigInt | Number} allow The permissions number for allowed permissions
    * @arg {BigInt | Number} deny The permissions number for denied permissions
    * @arg {Number} type The object type of the overwrite, either 1 for "member" or 0 for "role"
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<PermissionOverwrite>}
    */
    editPermission(overwriteID, allow, deny, type, reason) {
        return this.#client.editChannelPermission.call(this.#client, this.id, overwriteID, allow, deny, type, reason);
    }

    /**
    * Edit the channel's position. Note that channel position numbers are lowest on top and highest at the bottom.
    * @arg {Number} position The new position of the channel
    * @arg {Object} [options] Additional options when editing position
    * @arg {Boolean} [options.lockPermissions] Whether to sync the permissions with the new parent if moving to a new category
    * @arg {String} [options.parentID] The new parent ID (category channel) for the channel that is moved
    * @returns {Promise}
    */
    editPosition(position, options) {
        return this.#client.editChannelPosition.call(this.#client, this.id, position, options);
    }

    /**
    * Get the channel-specific permissions of a member
    * @arg {String | Member | Object} memberID The ID of the member or a Member object
    * @returns {Permission}
    */
    permissionsOf(memberID) {
        const member = typeof memberID === "string" ? this.guild.members.get(memberID) : memberID;
        let permission = this.guild.permissionsOf(member).allow;
        if(permission & Permissions.administrator) {
            return new Permission(Permissions.all);
        }
        const channel = this instanceof ThreadChannel ? this.guild.channels.get(this.parentID) : this;
        let overwrite = channel?.permissionOverwrites.get(this.guild.id);
        if(overwrite) {
            permission = (permission & ~overwrite.deny) | overwrite.allow;
        }
        let deny = 0n;
        let allow = 0n;
        for(const roleID of member.roles) {
            if((overwrite = channel?.permissionOverwrites.get(roleID))) {
                deny |= overwrite.deny;
                allow |= overwrite.allow;
            }
        }
        permission = (permission & ~deny) | allow;
        overwrite = channel?.permissionOverwrites.get(member.id);
        if(overwrite) {
            permission = (permission & ~overwrite.deny) | overwrite.allow;
        }
        return new Permission(permission);
    }

    toJSON(props = []) {
        return super.toJSON([
            "name",
            "parentID",
            "flags",
            ...props
        ]);
    }
}

module.exports = GuildChannel;

const ThreadChannel = require("./ThreadChannel");
