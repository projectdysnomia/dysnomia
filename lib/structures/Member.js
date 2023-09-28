"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");
const User = require("./User");
const VoiceState = require("./VoiceState");

/**
* Represents a server member
* @extends Base
*/
class Member extends Base {
    /**
     * The ID of the member
     * @member {String} Member#id
     */
    /**
     * The guild the member is in
     * @member {Guild} Member#guild
     */
    constructor(data, guild, client) {
        super(data.id || data.user.id);
        if(!data.id && data.user) {
            data.id = data.user.id;
        }
        if((this.guild = guild)) {
            /**
             * The user object of the member
             * @type {User}
             */
            this.user = guild.shard.client.users.get(data.id);
            if(!this.user && data.user) {
                this.user = guild.shard.client.users.add(data.user, guild.shard.client);
            }
            if(!this.user) {
                throw new Error("User associated with Member not found: " + data.id);
            }
        } else if(data.user) {
            if(!client) {
                this.user = new User(data.user);
            } else {
                this.user = client.users.update(data.user, client);
            }
        } else {
            this.user = null;
        }

        /**
         * The server nickname of the member
         * @type {String?}
         */
        this.nick = null;
        /**
         * An array of role IDs this member is a part of
         * @type {Array<String>}
         */
        this.roles = [];
        /**
         * The guild member flag bit set
         * @type {Number}
         */
        this.flags = 0;
        this.update(data);
    }

    update(data) {
        if(data.status !== undefined) {
            /**
             * The member's status. Either "online", "idle", "dnd", or "offline"
             * @type {String}
             */
            this.status = data.status;
        }
        if(data.joined_at !== undefined) {
            /**
             * Timestamp of when the member joined the guild
             * @type {Number?}
             */
            this.joinedAt = data.joined_at ?  Date.parse(data.joined_at) : null;
        }
        if(data.client_status !== undefined) {
            /**
             * The member's per-client status
             * @type {Member.ClientStatus}
             */
            this.clientStatus = Object.assign({web: "offline", desktop: "offline", mobile: "offline"}, data.client_status);
        }
        if(data.activities !== undefined) {
            /**
             * The member's current activities
             * @type {Array<Member.Activity>?}
             */
            this.activities = data.activities;
        }
        if(data.premium_since !== undefined) {
            /**
             * Timestamp of when the member boosted the guild
             * @type {Number?}
             */
            this.premiumSince = data.premium_since === null ? null : Date.parse(data.premium_since);
        }
        if(data.hasOwnProperty("mute") && this.guild) {
            const state = this.guild.voiceStates.get(this.id);
            if(data.channel_id === null && !data.mute && !data.deaf && !data.suppress) {
                this.guild.voiceStates.delete(this.id);
            } else if(state) {
                state.update(data);
            } else if(data.channel_id || data.mute || data.deaf || data.suppress) {
                this.guild.voiceStates.update(data);
            }
        }
        if(data.nick !== undefined) {
            this.nick = data.nick;
        }
        if(data.roles !== undefined) {
            this.roles = data.roles;
        }
        if(data.pending !== undefined) {
            /**
             * Whether the member has passed the guild's Membership Screening requirements
             * @type {Boolean?}
             */
            this.pending = data.pending;
        }
        if(data.avatar !== undefined) {
            /**
             * The hash of the member's guild avatar, or null if no guild avatar
             * @type {String?}
             */
            this.avatar = data.avatar;
        }
        if(data.communication_disabled_until !== undefined) {
            if(data.communication_disabled_until !== null) {
                /**
                 * Timestamp of timeout expiry. If `null`, the member is not timed out
                 * @type {Number?}
                 */
                this.communicationDisabledUntil = Date.parse(data.communication_disabled_until);
            } else {
                this.communicationDisabledUntil = data.communication_disabled_until;
            }
        }
        if(data.flags !== undefined) {
            this.flags = data.flags;
        }
    }

    /**
     * The user's banner color, or null if no banner color (REST only)
     * @type {Number?}
     */
    get accentColor() {
        return this.user.accentColor;
    }

    /**
     * The URL of the user's avatar which can be either a JPG or GIF
     * @type {String}
     */
    get avatarURL() {
        return this.avatar ? this.guild.shard.client._formatImage(Endpoints.GUILD_AVATAR(this.guild.id, this.id, this.avatar)) : this.user.avatarURL;
    }

    /**
     * The hash of the user's banner, or null if no banner (REST only)
     * @type {String?}
     */
    get banner() {
        return this.user.banner;
    }

    /**
     * The URL of the user's banner
     * @type {String?}
     */
    get bannerURL() {
        return this.user.bannerURL;
    }

    /**
     * Whether the user is an OAuth bot or not
     * @type {Boolean}
     */
    get bot() {
        return this.user.bot;
    }

    /**
     * Timestamp of user creation
     * @type {Number}
     */
    get createdAt() {
        return this.user.createdAt;
    }

    /**
     * The hash for the default avatar of a user if there is no avatar set
     * @type {String}
     */
    get defaultAvatar() {
        return this.user.defaultAvatar;
    }

    /**
     * The URL of the user's default avatar
     * @type {String}
     */
    get defaultAvatarURL() {
        return this.user.defaultAvatarURL;
    }

    /**
     * The discriminator of the user - if a single zero digit ("0"), the user is using the unique username system
     * @type {String}
     */
    get discriminator() {
        return this.user.discriminator;
    }

    /**
     * The globally visible display name of the user
     * @type {String?}
     */
    get globalName() {
        return this.user.globalName;
    }

    /**
     * A string that mentions the member
     * @type {String}
     */
    get mention() {
        return `<@!${this.id}>`;
    }

    /**
     * The guild-wide permissions of the member
     * @type {Permission}
     */
    get permissions() {
        return this.guild.permissionsOf(this);
    }

    /**
     * The URL of the user's avatar (always a JPG)
     * @type {String}
     */
    get staticAvatarURL(){
        return this.user.staticAvatarURL;
    }

    /**
     * The username of the user
     * @type {String}
     */
    get username() {
        return this.user.username;
    }

    /**
     * The voice state of the member
     * @type {VoiceState}
     */
    get voiceState() {
        return this.guild?.voiceStates.get(this.id) || new VoiceState({
            id: this.id
        });
    }

    /**
     * The active game the member is playing
     * @type {Member.Activity?}
     */
    get game() {
        return this.activities?.length > 0 ? this.activities[0] : null;
    }

    /**
    * Add a role to the guild member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    addRole(roleID, reason) {
        return this.guild.shard.client.addGuildMemberRole.call(this.guild.shard.client, this.guild.id, this.id, roleID, reason);
    }

    /**
    * Ban the user from the guild
    * @arg {Number} [options.deleteMessageSeconds=0] Number of seconds to delete messages for, between 0 and 604,800 inclusive
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    ban(options) {
        return this.guild.shard.client.banGuildMember.call(this.guild.shard.client, this.guild.id, this.id, options);
    }

    /**
    * Get the member's avatar with the given format and size
    * @arg {String} [format] The filetype of the avatar ("jpg", "jpeg", "png", "gif", or "webp")
    * @arg {Number} [size] The size of the avatar (any power of two between 16 and 4096)
    * @returns {String}
    */
    dynamicAvatarURL(format, size) {
        if(!this.avatar) {
            return this.user.dynamicAvatarURL(format, size);
        }
        return this.guild.shard.client._formatImage(Endpoints.GUILD_AVATAR(this.guild.id, this.id, this.avatar), format, size);
    }
    /**
    * Edit the guild member
    * @arg {Object} options The properties to edit
    * @arg {String?} [options.channelID] The ID of the voice channel to move the member to (must be in voice). Set to `null` to disconnect the member
    * @arg {Date?} [options.communicationDisabledUntil] When the user's timeout should expire. Set to `null` to instantly remove timeout
    * @arg {Boolean} [options.deaf] Server deafen the user
    * @arg {Number} [options.flags] The guild member flag bit set
    * @arg {Boolean} [options.mute] Server mute the user
    * @arg {String} [options.nick] Set the user's server nickname, "" to remove
    * @arg {Array<String>} [options.roles] The array of role IDs the user should have
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    edit(options, reason) {
        return this.guild.shard.client.editGuildMember.call(this.guild.shard.client, this.guild.id, this.id, options, reason);
    }




    /**
    * Kick the member from the guild
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    kick(reason) {
        return this.guild.shard.client.kickGuildMember.call(this.guild.shard.client, this.guild.id, this.id, reason);
    }

    /**
    * Remove a role from the guild member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    removeRole(roleID, reason) {
        return this.guild.shard.client.removeGuildMemberRole.call(this.guild.shard.client, this.guild.id, this.id, roleID, reason);
    }

    /**
    * Unban the user from the guild
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    unban(reason) {
        return this.guild.shard.client.unbanGuildMember.call(this.guild.shard.client, this.guild.id, this.id, reason);
    }

    toJSON(props = []) {
        return super.toJSON([
            "activities",
            "communicationDisabledUntil",
            "flags",
            "joinedAt",
            "nick",
            "pending",
            "premiumSince",
            "roles",
            "status",
            "user",
            "voiceState",
            ...props
        ]);
    }
}

module.exports = Member;

/**
 * The member's per-client status
 * @typedef Member.ClientStatus
 * @prop {String} web The member's status on web. Either "online", "idle", "dnd", or "offline". Will be "online" for bots
 * @prop {String} desktop The member's status on desktop. Either "online", "idle", "dnd", or "offline". Will be "offline" for bots
 * @prop {String} mobile The member's status on mobile. Either "online", "idle", "dnd", or "offline". Will be "offline" for bots
 */

/**
 * The member's activity. See [Discord's documentation](https://discord.com/developers/docs/topics/gateway-events#activity-object) for more properties
 * @typedef Member.Activity
 * @prop {String} game.name The name of the active game
 * @prop {Number} game.type The type of the active game (0 is default, 1 is Twitch, 2 is YouTube)
 * @prop {String?} game.url The url of the active game
 * @prop {String?} game.state The state of the active game
 */
