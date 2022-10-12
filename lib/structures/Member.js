"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");
const User = require("./User");
const VoiceState = require("./VoiceState");

/**
* Represents a server member
* @prop {Number?} accentColor The user's banner color, or null if no banner color (REST only)
* @prop {Array<Object>?} activities The member's current activities
* @prop {String?} avatar The hash of the member's guild avatar, or null if no guild avatar
* @prop {String} avatarURL The URL of the user's avatar which can be either a JPG or GIF
* @prop {String?} banner The hash of the user's banner, or null if no banner (REST only)
* @prop {String?} bannerURL The URL of the user's banner
* @prop {Boolean} bot Whether the user is an OAuth bot or not
* @prop {Object?} clientStatus The member's per-client status
* @prop {String} clientStatus.web The member's status on web. Either "online", "idle", "dnd", or "offline". Will be "online" for bots
* @prop {String} clientStatus.desktop The member's status on desktop. Either "online", "idle", "dnd", or "offline". Will be "offline" for bots
* @prop {String} clientStatus.mobile The member's status on mobile. Either "online", "idle", "dnd", or "offline". Will be "offline" for bots
* @prop {Number?} communicationDisabledUntil Timestamp of timeout expiry. If `null`, the member is not timed out
* @prop {Number} createdAt Timestamp of user creation
* @prop {String} defaultAvatar The hash for the default avatar of a user if there is no avatar set
* @prop {String} defaultAvatarURL The URL of the user's default avatar
* @prop {String} discriminator The discriminator of the user
* @prop {Object?} game The active game the member is playing
* @prop {String} game.name The name of the active game
* @prop {Number} game.type The type of the active game (0 is default, 1 is Twitch, 2 is YouTube)
* @prop {String?} game.url The url of the active game
* @prop {Guild} guild The guild the member is in
* @prop {String} id The ID of the member
* @prop {Number?} joinedAt Timestamp of when the member joined the guild
* @prop {String} mention A string that mentions the member
* @prop {String?} nick The server nickname of the member
* @prop {Boolean?} pending Whether the member has passed the guild's Membership Screening requirements
* @prop {Permission} permissions The guild-wide permissions of the member
* @prop {Number?} premiumSince Timestamp of when the member boosted the guild
* @prop {Array<String>} roles An array of role IDs this member is a part of
* @prop {String} staticAvatarURL The URL of the user's avatar (always a JPG)
* @prop {String} status The member's status. Either "online", "idle", "dnd", or "offline"
* @prop {User} user The user object of the member
* @prop {String} username The username of the user
* @prop {VoiceState} voiceState The voice state of the member
*/
class Member extends Base {
    constructor(data, guild, client) {
        super(data.id || data.user.id);
        if(!data.id && data.user) {
            data.id = data.user.id;
        }
        if((this.guild = guild)) {
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

        this.nick = null;
        this.roles = [];
        this.update(data);
    }

    update(data) {
        if(data.status !== undefined) {
            this.status = data.status;
        }
        if(data.joined_at !== undefined) {
            this.joinedAt = data.joined_at ?  Date.parse(data.joined_at) : null;
        }
        if(data.client_status !== undefined) {
            this.clientStatus = Object.assign({web: "offline", desktop: "offline", mobile: "offline"}, data.client_status);
        }
        if(data.activities !== undefined) {
            this.activities = data.activities;
        }
        if(data.premium_since !== undefined) {
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
            this.pending = data.pending;
        }
        if(data.avatar !== undefined) {
            this.avatar = data.avatar;
        }
        if(data.communication_disabled_until !== undefined) {
            if(data.communication_disabled_until !== null) {
                this.communicationDisabledUntil = Date.parse(data.communication_disabled_until);
            } else {
                this.communicationDisabledUntil = data.communication_disabled_until;
            }
        }
    }

    get accentColor() {
        return this.user.accentColor;
    }

    get avatarURL() {
        return this.avatar ? this.guild.shard.client._formatImage(Endpoints.GUILD_AVATAR(this.guild.id, this.id, this.avatar)) : this.user.avatarURL;
    }

    get banner() {
        return this.user.banner;
    }

    get bannerURL() {
        return this.user.bannerURL;
    }

    get bot() {
        return this.user.bot;
    }

    get createdAt() {
        return this.user.createdAt;
    }

    get defaultAvatar() {
        return this.user.defaultAvatar;
    }

    get defaultAvatarURL() {
        return this.user.defaultAvatarURL;
    }

    get discriminator() {
        return this.user.discriminator;
    }

    get mention() {
        return `<@!${this.id}>`;
    }

    get permissions() {
        return this.guild.permissionsOf(this);
    }

    get staticAvatarURL(){
        return this.user.staticAvatarURL;
    }

    get username() {
        return this.user.username;
    }

    get voiceState() {
        if(this.guild && this.guild.voiceStates.has(this.id)) {
            return this.guild.voiceStates.get(this.id);
        } else {
            return new VoiceState({
                id: this.id
            });
        }
    }

    get game() {
        return this.activities && this.activities.length > 0 ? this.activities[0] : null;
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
