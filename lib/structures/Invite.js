"use strict";

const Base = require("./Base");
const Guild = require("./Guild");
const GuildScheduledEvent = require("./GuildScheduledEvent");

/**
* Represents an invite. Some properties are only available when fetching invites from channels, which requires the Manage Channel permission.
* @extends Base
*/
class Invite extends Base {
    /**
     * Invites don't have an ID.
     * @private
     * @override
     * @member {undefined} Invite#id
     */

    #client;
    #createdAt;
    constructor(data, client) {
        super();
        this.#client = client;
        /**
         * The invite code
         * @type {String}
         */
        this.code = data.code;
        if(data.guild && client.guilds.has(data.guild.id)) {
            /**
             * Info on the invite channel
             * @type {TextChannel | NewsChannel | TextVoiceChannel | StageChannel | Invite.UncachedInviteChannel}
             */
            this.channel = client.guilds.get(data.guild.id).channels.update(data.channel, client);
        } else {
            this.channel = data.channel;
        }
        if(data.guild) {
            if(client.guilds.has(data.guild.id)) {
                /**
                 * Info on the invite guild
                 * @type {Guild?}
                 */
                this.guild = client.guilds.update(data.guild, client);
            } else {
                this.guild = new Guild(data.guild, client);
            }
        }
        if(data.inviter) {
            /**
             * The invite creator
             * @type {User?}
             */
            this.inviter = client.users.add(data.inviter, client);
        }
        /**
         * The number of invite uses
         * @type {Number?}
         */
        this.uses = data.uses !== undefined ? data.uses : null;
        /**
         * The max number of invite uses
         * @type {Number?}
         */
        this.maxUses = data.max_uses !== undefined ? data.max_uses : null;
        /**
         * How long the invite lasts in seconds
         * @type {Number?}
         */
        this.maxAge = data.max_age !== undefined ? data.max_age : null;
        /**
         * Whether the invite grants temporary membership or not
         * @type {Boolean?}
         */
        this.temporary = data.temporary !== undefined ? data.temporary : null;
        this.#createdAt = data.created_at !== undefined ? data.created_at : null;
        /**
         * The **approximate** presence count for the guild
         * @type {Number?}
         */
        this.presenceCount = data.approximate_presence_count !== undefined ? data.approximate_presence_count : null;
        /**
         * The **approximate** member count for the guild
         * @type {Number?}
         */
        this.memberCount = data.approximate_member_count !== undefined ? data.approximate_member_count : null;
        if(data.stage_instance !== undefined) {
            data.stage_instance.members = data.stage_instance.members.map((m) => {
                m.id = m.user.id;
                return m;
            });
            /**
             * The active public stage instance data for the stage channel this invite is for
             * @deprecated Deprecated in Discord's API
             * @type {Invite.StageInstance}
             */
            this.stageInstance = {
                members: data.stage_instance.members.map((m) => this.guild.members.update(m, this.guild)),
                participantCount: data.stage_instance.participant_count,
                speakerCount: data.stage_instance.speaker_count,
                topic: data.stage_instance.topic
            };
        } else {
            this.stageInstance = null;
        }
        if(data.target_application !== undefined) {
            /**
             * The target application
             * @type {Object?}
             */
            this.targetApplication = data.target_application;
        }
        if(data.target_type !== undefined) {
            /**
             * The type of the target application
             * @type {Number?}
             */
            this.targetType = data.target_type;
        }
        if(data.target_user !== undefined) {
            /**
             * The user whose stream is displayed for the invite (voice channel only)
             * @type {User?}
             */
            this.targetUser = client.users.update(data.target_user, this.#client);
        }
        if(data.expires_at !== undefined) {
            /**
             * Timestamp of invite expiration
             * @type {Number?}
             */
            this.expiresAt = Date.parse(data.expires_at);
        }
        if(data.guild_scheduled_event !== undefined) {
            /**
             * The guild scheduled event associated with the invite
             * @type {GuildScheduledEvent?}
             */
            this.guildScheduledEvent = new GuildScheduledEvent(data.guild_scheduled_event, client);
        }
    }

    /**
     * Timestamp of invite creation
     * @type {Number?}
     */
    get createdAt() {
        return Date.parse(this.#createdAt);
    }

    /**
    * Delete the invite
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    delete(reason) {
        return this.#client.deleteInvite.call(this.#client, this.code, reason);
    }

    toString() {
        return `[Invite ${this.code}]`;
    }

    toJSON(props = []) {
        return super.toJSON([
            "channel",
            "code",
            "createdAt",
            "guild",
            "maxAge",
            "maxUses",
            "memberCount",
            "presenceCount",
            "revoked",
            "temporary",
            "uses",
            ...props
        ]);
    }
}

module.exports = Invite;

/**
 * Information about an uncached invite
 * @typedef Invite.UncachedInviteChannel
 * @prop {String} id The ID of the invite's channel
 * @prop {String?} name The name of the invite's channel
 * @prop {Number} type The type of the invite's channel
 * @prop {String?} icon The icon of a channel (group dm)
 */

/**
 * Information about the active public stage instance
 * @deprecated Deprecated in Discord's API
 * @typedef Invite.StageInstance
 * @prop {Member[]} members The members in the stage instance
 * @prop {Number} participantCount The number of participants in the stage instance
 * @prop {Number} speakerCount The number of speakers in the stage instance
 * @prop {String} topic The topic of the stage instance
 */
