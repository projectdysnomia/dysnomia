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
    * @arg {Object} event The new guild scheduled event object
    * @arg {String} [event.channelID] The channel ID of the event. If updating `entityType` to `3` (external), this **must** be set to `null`
    * @arg {String} [event.description] The description of the event
    * @arg {Object} [event.entityMetadata] The entity metadata for the scheduled event. This is required if updating `entityType` to `3` (external)
    * @arg {String} [event.entityMetadata.location] Location of the event. This is required if updating `entityType` to `3` (external)
    * @arg {Number} [event.entityType] The [entity type](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types) of the scheduled event
    * @arg {String} [event.image] Base 64 encoded image for the event
    * @arg {String} [event.name] The name of the event
    * @arg {String} [event.privacyLevel] The privacy level of the event
    * @arg {Date} [event.scheduledEndTime] The time when the scheduled event is scheduled to end. This is required if updating `entityType` to `3` (external)
    * @arg {Date} [event.scheduledStartTime] The time the event will start
    * @arg {Number} [event.status] The [status](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-status) of the scheduled event
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<GuildScheduledEvent>}
    */
    edit(event, reason) {
        return this.#client.editGuildScheduledEvent.call(this.#client, this.guildID, this.id, event, reason);
    }

    /**
    * Get a list of users subscribed to the guild scheduled event
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Get users after this user ID. If `options.before` is provided, this will be ignored. Fetching users in between `before` and `after` is not supported
    * @arg {String} [options.before] Get users before this user ID
    * @arg {Number} [options.limit=100] The number of users to get (max 100). Pagination will only work if one of `options.after` or `options.after` is also provided
    * @arg {Boolean} [options.withMember] Include guild member data
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
