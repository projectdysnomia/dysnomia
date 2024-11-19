"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");

/**
 * Represents a guild scheduled event
 * @extends Base
 */
class GuildScheduledEvent extends Base {
    /**
     * The ID of the guild event
     * @member {String} GuildScheduledEvent#id
     */
    #client;
    constructor(data, client) {
        super(data.id);

        this.#client = client;
        if(data.creator !== undefined) {
            /**
             * The user that created the scheduled event. For events created before October 25 2021, this will be null. Please see the relevant Discord documentation for more details
             * @type {User?}
             */
            this.creator = client.users.update(data.creator, this.client);
        } else {
            this.creator = null;
        }
        /**
         * The guild which the event belongs to. Can be partial with only `id` if not cached
         * @type {Guild | Object}
         */
        this.guild = client.guilds.get(data.guild_id) || {
            id: data.guild_id
        };
        /**
         * The time the event will end, or null if the event does not have a scheduled time to end
         * @type {Number?}
         */
        this.scheduledEndTime = null;
        this.update(data);
    }

    update(data) {
        if(data.channel_id !== undefined) {
            if(data.channel_id !== null) {
                /**
                 * The channel where the event will be held. This will be null if the event is external (`entityType` is `3`). Can be partial with only `id` if the channel or guild is not cached
                 * @type {(VoiceChannel | StageChannel | Object)?}
                 */
                this.channel = this.#client.guilds.get(data.guild_id)?.channels.get(data.channel_id) || {id: data.channel_id};
            } else {
                this.channel = null;
            }
        }
        if(data.name !== undefined) {
            /**
             * The name of the event
             * @type {String}
             */
            this.name = data.name;
        }
        if(data.description !== undefined) {
            /**
             * The description of the event
             * @type {String?}
             */
            this.description = data.description;
        }
        if(data.scheduled_start_time !== undefined) {
            /**
             * The time the event will start
             * @type {Number}
             */
            this.scheduledStartTime = Date.parse(data.scheduled_start_time);
        }
        if(data.scheduled_end_time !== undefined) {
            this.scheduledEndTime = Date.parse(data.scheduled_end_time);
        }
        if(data.privacy_level !== undefined) {
            /**
             * Event privacy level
             * @type {Number}
             */
            this.privacyLevel = data.privacy_level;
        }
        if(data.status !== undefined) {
            /**
             * The [status](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-status) of the scheduled event
             * @type {Number}
             */
            this.status = data.status;
        }
        if(data.entity_type !== undefined) {
            /**
             * The [entity type](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types) of the scheduled event
             * @type {Number}
             */
            this.entityType = data.entity_type;
        }
        if(data.entity_id !== undefined) {
            /**
             * The entity ID associated to the event
             * @type {String?}
             */
            this.entityID = data.entity_id;
        }
        if(data.entity_metadata !== undefined) {
            /**
             * Metadata for the event. This will be null if the event is not external (`entityType` is not `3`)
             * @type {GuildScheduledEvent.EntityMetadata?}
             */
            this.entityMetadata = data.entity_metadata;
        }
        if(data.user_count !== undefined) {
            /**
             * The number of users subscribed to the event
             * @type {Number?}
             */
            this.userCount = data.user_count;
        }
        if(data.image !== undefined) {
            /**
             * The hash of the event's image, or null if no image
             * @type {String?}
             */
            this.image = data.image;
        }
        if(data.recurrence_rule !== undefined) {
            /**
             * The recurrence rules for the event
             * @type {GuildScheduledEvent.RecurrenceRule?}
             */
            this.recurrenceRule = data.recurrence_rule != null
                ? {
                        start: Date.parse(data.recurrence_rule.start),
                        end: data.recurrence_rule.end ? Date.parse(data.recurrence_rule.end) : null,
                        frequency: data.recurrence_rule.frequency,
                        interval: data.recurrence_rule.interval,
                        byWeekday: data.recurrence_rule.by_weekday,
                        byNWeekday: data.recurrence_rule.by_n_weekday,
                        byMonth: data.recurrence_rule.by_month,
                        byMonthDay: data.recurrence_rule.by_month_day,
                        byYearDay: data.recurrence_rule.by_year_day,
                        count: data.recurrence_rule.count
                    }
                : null;
        }
    }

    /**
     * The URL of the event's image, or null if no image
     * @type {String?}
     */
    get imageURL() {
        return this.image ? this.#client._formatImage(Endpoints.GUILD_SCHEDULED_EVENT_COVER(this.id, this.image)) : null;
    }

    /**
     * Delete this scheduled event
     * @returns {Promise}
     */
    delete() {
        return this.#client.deleteGuildScheduledEvent.call(this.#client, this.guildID, this.id);
    }

    /**
     * Edit this scheduled event
     * @param {Object} event The new guild scheduled event object
     * @param {String} [event.channelID] The channel ID of the event. If updating `entityType` to `3` (external), this **must** be set to `null`
     * @param {String} [event.description] The description of the event
     * @param {Object} [event.entityMetadata] The entity metadata for the scheduled event. This is required if updating `entityType` to `3` (external)
     * @param {String} [event.entityMetadata.location] Location of the event. This is required if updating `entityType` to `3` (external)
     * @param {Number} [event.entityType] The [entity type](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types) of the scheduled event
     * @param {String} [event.image] Base 64 encoded image for the event
     * @param {String} [event.name] The name of the event
     * @param {String} [event.privacyLevel] The privacy level of the event
     * @param {GuildScheduledEvent.RecurrenceRuleEdit?} [event.recurrenceRule] The recurrence rules for the event. Note that [there are some limitations on what can be set](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-structure).
     * @param {Date} [event.scheduledEndTime] The time when the scheduled event is scheduled to end. This is required if updating `entityType` to `3` (external)
     * @param {Date} [event.scheduledStartTime] The time the event will start
     * @param {Number} [event.status] The [status](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-status) of the scheduled event
     * @param {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise<GuildScheduledEvent>}
     */
    edit(event, reason) {
        return this.#client.editGuildScheduledEvent.call(this.#client, this.guildID, this.id, event, reason);
    }

    /**
     * Get a list of users subscribed to the guild scheduled event
     * @param {Object} [options] Options for the request
     * @param {String} [options.after] Get users after this user ID. If `options.before` is provided, this will be ignored. Fetching users in between `before` and `after` is not supported
     * @param {String} [options.before] Get users before this user ID
     * @param {Number} [options.limit=100] The number of users to get (max 100). Pagination will only work if one of `options.after` or `options.after` is also provided
     * @param {Boolean} [options.withMember] Include guild member data
     * @returns {Promise<Array<{guildScheduledEventID: String, member: Member | undefined, user: User}>>}
     */
    getUsers(options) {
        return this.#client.getGuildScheduledEventUsers.call(this.#client, this.guild.id, this.id, options);
    }

    toJSON(props = []) {
        return super.toJSON([
            "channel",
            "creator",
            "description",
            "entityID",
            "entityMetadata",
            "entityType",
            "guild",
            "name",
            "privacyLevel",
            "scheduledEndTime",
            "scheduledStartTime",
            "status",
            "userCount",
            ...props
        ]);
    }
}

module.exports = GuildScheduledEvent;

/**
 * Metadata for the event
 * @typedef GuildScheduledEvent.EntityMetadata
 * @prop {String?} location Location of the event
 */
/**
 * The recurrence rules for the event
 * @typedef GuildScheduledEvent.RecurrenceRule
 * @prop {Number} start The start timestamp of the recurrence interval
 * @prop {Number?} end The ending timestamp of the recurrence interval
 * @prop {Number} frequency The frequency of the event - see [Discord's documentation](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-frequency) for possible values
 * @prop {Number} interval The spacing between events (interval * frequency)
 * @prop {Array<Number>?} byWeekday A set of specific days in a week for the event to recur on - see [Discord's documentation](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-weekday) on how weekdays are defined (mutually exclusive with `byNWeekday` and the combination of `byMonth` and `byMonthDay`)
 * @prop {Array<{ n: Number, day: Number }>?} byNWeekday A list of specific days (defined by the `day` key in the object) in a specific week (defined by the `n` key in the object) to recur on (mutually exclusive with `byWeekday` and the combination of `byMonth` and `byMonthDay`)
 * @prop {Number?} byMonth A set of specific months for the event to recur on - see [Discord's documentation](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-month) on how months are defined (mutually exclusive with `byWeekday` and `byNWeekday`)
 * @prop {Array<Number>?} byMonthDay A set of specific days in a month for the event to recur on (mutually exclusive with `byWeekday` and `byNWeekday`)
 * @prop {Array<Number>?} byYearDay A set of specific days in a year for the event to recur on
 * @prop {Number?} count The total amount of times the event is allowed to recur before stopping
 */
/**
 * The new recurrence rules for the event
 * @typedef GuildScheduledEvent.RecurrenceRuleEdit
 * @prop {Date} [start] The start timestamp of the recurrence interval
 * @prop {Number} [frequency] The frequency of the event - see [Discord's documentation](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-frequency) for possible values
 * @prop {Number} [interval] The spacing between events (interval * frequency)
 * @prop {Array<Number>?} [byWeekday] A set of specific days in a week for the event to recur on - see [Discord's documentation](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-weekday) on how weekdays are defined (mutually exclusive with `byNWeekday` and the combination of `byMonth` and `byMonthDay`)
 * @prop {Array<{ n: Number, day: Number }>?} [byNWeekday] A list of specific days (defined by the `day` key in the object) in a specific week (defined by the `n` key in the object) to recur on (mutually exclusive with `byWeekday` and the combination of `byMonth` and `byMonthDay`)
 * @prop {Number?} [byMonth] A set of specific months for the event to recur on - see [Discord's documentation](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-recurrence-rule-object-guild-scheduled-event-recurrence-rule-month) on how months are defined (mutually exclusive with `byWeekday` and `byNWeekday`)
 * @prop {Array<Number>?} [byMonthDay] A set of specific days in a month for the event to recur on (mutually exclusive with `byWeekday` and `byNWeekday`)
 */
