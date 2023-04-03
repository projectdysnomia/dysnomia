"use strict";

const Base = require("./Base");
const Guild = require("./Guild");
const GuildScheduledEvent = require("./GuildScheduledEvent");

/**
* Represents an invite. Some properties are only available when fetching invites from channels, which requires the Manage Channel permission.
* @prop {TextChannel | NewsChannel | TextVoiceChannel | StageChannel | Object} channel Info on the invite channel
* @prop {String} channel.id The ID of the invite's channel
* @prop {String?} channel.name The name of the invite's channel
* @prop {Number} channel.type The type of the invite's channel
* @prop {String?} channel.icon The icon of a channel (group dm)
* @prop {String} code The invite code
* @prop {Number?} createdAt Timestamp of invite creation
* @prop {Number?} expiresAt Timestamp of invite expiration
* @prop {Guild?} guild Info on the invite guild
* @prop {GuildScheduledEvent?} guildScheduledEvent The guild scheduled event associated with the invite
* @prop {User?} inviter The invite creator
* @prop {Number?} maxAge How long the invite lasts in seconds
* @prop {Number?} maxUses The max number of invite uses
* @prop {Number?} memberCount The **approximate** member count for the guild
* @prop {Number?} presenceCount The **approximate** presence count for the guild
* @prop {Object?} stageInstance  [DEPRECATED] The active public stage instance data for the stage channel this invite is for
* @prop {Member[]} stageInstance.members The members in the stage instance
* @prop {Number} stageInstance.participantCount The number of participants in the stage instance
* @prop {Number} stageInstance.speakerCount The number of speakers in the stage instance
* @prop {String} stageInstance.topic The topic of the stage instance
* @prop {Object?} targetApplication The target application
* @prop {Number?} targetType The type of the target application
* @prop {User?} targetUser The user whose stream is displayed for the invite (voice channel only)
* @prop {Boolean?} temporary Whether the invite grants temporary membership or not
* @prop {Number?} uses The number of invite uses
*/
class Invite extends Base {
    #client;
    #createdAt;
    constructor(data, client) {
        super();
        this.#client = client;
        this.code = data.code;
        if(data.guild && client.guilds.has(data.guild.id)) {
            this.channel = client.guilds.get(data.guild.id).channels.update(data.channel, client);
        } else {
            this.channel = data.channel;
        }
        if(data.guild) {
            if(client.guilds.has(data.guild.id)) {
                this.guild = client.guilds.update(data.guild, client);
            } else {
                this.guild = new Guild(data.guild, client);
            }
        }
        if(data.inviter) {
            this.inviter = client.users.add(data.inviter, client);
        }
        this.uses = data.uses !== undefined ? data.uses : null;
        this.maxUses = data.max_uses !== undefined ? data.max_uses : null;
        this.maxAge = data.max_age !== undefined ? data.max_age : null;
        this.temporary = data.temporary !== undefined ? data.temporary : null;
        this.#createdAt = data.created_at !== undefined ? data.created_at : null;
        this.presenceCount = data.approximate_presence_count !== undefined ? data.approximate_presence_count : null;
        this.memberCount = data.approximate_member_count !== undefined ? data.approximate_member_count : null;
        if(data.stage_instance !== undefined) {
            data.stage_instance.members = data.stage_instance.members.map((m) => {
                m.id = m.user.id;
                return m;
            });
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
            this.targetApplication = data.target_application;
        }
        if(data.target_type !== undefined) {
            this.targetType = data.target_type;
        }
        if(data.target_user !== undefined) {
            this.targetUser = client.users.update(data.target_user, this.#client);
        }
        if(data.expires_at !== undefined) {
            this.expiresAt = Date.parse(data.expires_at);
        }
        if(data.guild_scheduled_event !== undefined) {
            this.guildScheduledEvent = new GuildScheduledEvent(data.guild_scheduled_event, client);
        }
    }

    get createdAt() {
        return Date.parse(this.#createdAt);
    }

    /**
    * Delete the invite
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    delete(reason) {
        return this.#client.rest.deleteInvite(this.code, reason);
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
