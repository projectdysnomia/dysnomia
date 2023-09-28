"use strict";

const Base = require("./Base");
const Invite = require("./Invite");
const {AuditLogActions} = require("../Constants");

/**
* Represents a guild audit log entry describing a moderation action
* @extends Base
*/
class GuildAuditLogEntry extends Base {
    /**
     * The ID of the entry
     * @member {String} GuildAuditLogEntry#id
     */
    constructor(data, guild) {
        super(data.id);
        /**
         * The guild containing the entry
         * @type {Guild}
         */
        this.guild = guild;

        /**
         * The action type of the entry. See Constants.AuditLogActions for more details
         * @type {Number}
         */
        this.actionType = data.action_type;
        /**
         * The reason for the action
         * @type {String?}
         */
        this.reason = data.reason || null;
        /**
         * The user that performed the action. If the user is not cached, this will be an object with an `id` key. No other properties are guaranteed
         * @type {User | Object}
         */
        this.user = guild.shard.client.users.get(data.user_id) || {
            id: data.user_id
        };
        /**
         * The properties of the targeted object before the action was taken
         * For example, if a channel was renamed from #general to #potato, this would be `{name: "general"}`
         * @type {Object?}
         */
        this.before = null;
        /**
         * The properties of the targeted object after the action was taken
         * For example, if a channel was renamed from #general to #potato, this would be `{name: "potato"}`
         * @type {Object?}
         */
        this.after = null;
        if(data.changes) {
            this.before = {};
            this.after = {};
            data.changes.forEach((change) => {
                if(change.old_value != undefined) {
                    this.before[change.key] = change.old_value;
                }
                if(change.new_value != undefined) {
                    this.after[change.key] = change.new_value;
                }
            });
        }

        if(data.target_id) {
            /**
             * The ID of the action target
             * @type {String?}
             */
            this.targetID = data.target_id;
        }
        if(data.options) {
            if(data.options.application_id) {
                /**
                 * The ID of the application that was targeted
                 * @type {String?}
                 */
                this.applicationID = data.options.application_id;
            }
            if(data.options.auto_moderation_rule_name) {
                /**
                 * The name of the auto moderation rule that was triggered
                 * @type {String?}
                 */
                this.autoModerationRuleName = data.options.auto_moderation_rule_name;
            }
            if(data.options.auto_moderation_rule_trigger_type) {
                /**
                 * The trigger type of the auto moderation rule that was triggered
                 * @type {String?}
                 */
                this.autoModerationRuleTriggerType = data.options.auto_moderation_rule_trigger_type;
            }
            if(data.options.count) {
                /**
                 * The number of entities targeted
                 * For example, for action type 26 (MEMBER_MOVE), this is the number of members that were moved/disconnected from the voice channel
                 * @type {Number?}
                 */
                this.count = +data.options.count;
            }
            if(data.options.channel_id) {
                /**
                 * The channel targeted in the entry, action types 26 (MEMBER_MOVE), 72/74/75 (MESSAGE_DELETE/PIN/UNPIN) and 83/84/85 (STAGE_INSTANCE_CREATE/UPDATE/DELETE) only
                 * @type {(CategoryChannel | TextChannel | TextVoiceChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel | StageChannel)?}
                 */
                this.channel = guild.threads.get(data.options.channel_id) || guild.channels.get(data.options.channel_id);

                if(data.options.message_id) {
                    /**
                     * The message that was (un)pinned, action types 74/75 (MESSAGE_PIN/UNPIN) only. If the message is not cached, this will be an object with an `id` key. No other property is guaranteed.
                     * @type {(Message | Object)?}
                     */
                    this.message = this.channel?.messages.get(data.options.message_id) || {id: data.options.message_id};
                }
            }
            if(data.options.delete_member_days) {
                /**
                 * The number of days of inactivity to prune for, action type 21 (MEMBER_PRUNE) only
                 * @type {Number?}
                 */
                this.deleteMemberDays = +data.options.delete_member_days;
                /**
                 * The number of members pruned from the server, action type 21 (MEMBER_PRUNE) only
                 * @type {Number?}
                 */
                this.membersRemoved = +data.options.members_removed;
            }
            if(data.options.type) {
                if(data.options.type === "1") {
                    /**
                     * The member described by the permission overwrite, action types 13-15 (CHANNEL\_OVERWRITE\_CREATE/UPDATE/DELETE) only. If the member is not cached, this could be {id: String}
                     * @type {(Member | Object)?}
                     */
                    this.member = guild.members.get(data.options.id) || {
                        id: data.options.id
                    };
                } else if(data.options.type === "0") {
                    /**
                     * The role described by the permission overwrite, action types 13-15 (CHANNEL\_OVERWRITE\_CREATE/UPDATE/DELETE) only. If the role is not cached, this could be {id: String, name: String}
                     * @type {(Role | Object)?}
                     */
                    this.role = guild.roles.get(data.options.id) || {
                        id: data.options.id,
                        name: data.options.role_name
                    };
                }
            }
            if(data.options.integration_type) {
                /**
                 * The type of integration which performed the action, action types 20 (MEMBER\_KICK) and 25 (MEMBER\_ROLE\_UPDATE) only
                 * @type {String?}
                 */
                this.integrationType = data.options.integration_type;
            }
        }
    }

    /**
     * The object of the action target
     * If the item is not cached, this property will be null
     * If the action targets a guild, this could be a Guild object
     * If the action targets a guild channel, this could be a CategoryChannel, TextChannel, or TextVoiceChannel object
     * If the action targets a member, this could be a Member object
     * If the action targets a role, this could be a Role object
     * If the action targets an invite, this is an Invite object
     * If the action targets a webhook, this is null
     * If the action targets a emoji, this could be an emoji object
     * If the action targets a sticker, this could be a sticker object
     * If the action targets a message, this is a User object
     * If the action targets an application command, this is null
     * If the action targets an auto moderation rule, this is null
     * If the action targets a stage instance, this is a StageInstance object
     * If the action targets a thread, this is a ThreadChannel object
     * If the action is an auto moderation rule execution, this is a User object
     * @type {(CategoryChannel | Guild | Member | Invite | Role | Object | TextChannel | TextVoiceChannel | NewsChannel | StageInstance | ThreadChannel)?}
     */
    get target() { // pay more, get less
        if(this.actionType < 10) { // Guild
            return this.guild;
        } else if(this.actionType < 20) { // Channel
            return this.guild?.channels.get(this.targetID);
        } else if(this.actionType < 30) { // Member
            if(this.actionType === AuditLogActions.MEMBER_MOVE || this.actionType === AuditLogActions.MEMBER_DISCONNECT) { // MEMBER_MOVE / MEMBER_DISCONNECT
                return null;
            }
            return this.guild?.members.get(this.targetID);
        } else if(this.actionType < 40) { // Role
            return this.guild?.roles.get(this.targetID);
        } else if(this.actionType < 50) { // Invite
            const changes = this.actionType === 42 ? this.before : this.after; // Apparently the meaning of life is a deleted invite
            return new Invite({
                code: changes.code,
                channel: {
                    id: changes.channel_id
                },
                guild: this.guild,
                uses: changes.uses,
                max_uses: changes.max_uses,
                max_age: changes.max_age,
                temporary: changes.temporary
            }, this.guild?.shard.client);
        } else if(this.actionType < 60) { // Webhook
            return null; // Go get the webhook yourself
        } else if(this.actionType < 70) { // Emoji
            return this.guild?.emojis.find((emoji) => emoji.id === this.targetID);
        } else if(this.actionType < 80) { // Message
            return this.guild?.shard.client.users.get(this.targetID);
        } else if(this.actionType < 83) { // Integrations
            return null;
        } else if(this.actionType < 90) { // Stage Instances
            return this.guild?.stageInstances.get(this.targetID);
        } else if(this.actionType < 100) { // Sticker
            return this.guild?.stickers.find((sticker) => sticker.id === this.targetID);
        } else if(this.actionType < 110) { // Guild Scheduled Events
            return this.guild?.events.get(this.targetID);
        } else if(this.actionType < 120) { // Thread
            return this.guild?.threads.get(this.targetID);
        } else if(this.actionType < 140) { // Application Command
            return null;
        } else if(this.actionType < 143) { // Auto Moderation Rule Updates
            return null;
        } else if(this.actionType < 146) { // Auto Moderation Actions
            return this.guild?.shard.client.users.get(this.targetID);
        } else {
            throw new Error("Unrecognized action type: " + this.actionType);
        }
    }

    toJSON(props = []) {
        return super.toJSON([
            "actionType",
            "after",
            "before",
            "channel",
            "count",
            "deleteMemberDays",
            "member",
            "membersRemoved",
            "reason",
            "role",
            "targetID",
            "user",
            ...props
        ]);
    }
}

module.exports = GuildAuditLogEntry;
