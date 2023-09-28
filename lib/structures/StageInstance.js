"use strict";

const Base = require("./Base");

/**
* Represents a stage instance
*/
class StageInstance extends Base {
    /**
     * The ID of the stage instance
     * @member {String} StageInstance#id
     */
    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;
        /**
         * The associated stage channel
         * @type {StageChannel}
         */
        this.channel = client.getChannel(data.channel_id) || {id: data.channel_id};
        /**
         * The guild of the associated stage channel
         * @type {Guild}
         */
        this.guild = client.guilds.get(data.guild_id) || {id: data.guild_id};
        /**
         * The event associated with this instance
         * @type {GuildScheduledEvent}
         */
        this.guildScheduledEvent = this.guild.events?.get(data.guild_scheduled_event_id) || {id: data.guild_scheduled_event_id};
        this.update(data);
    }

    update(data) {
        if(data.discoverable_disabled !== undefined) {
            /**
             * Whether or not stage discovery is disabled
             * @deprecated Deprecated in Discord's API
             * @type {Boolean}
             */
            this.discoverableDisabled = data.discoverable_disabled;
        }
        if(data.privacy_level !== undefined) {
            /**
             * The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
             * @type {Number}
             */
            this.privacyLevel = data.privacy_level;
        }
        if(data.topic !== undefined) {
            /**
             * The stage instance topic
             * @type {String}
             */
            this.topic = data.topic;
        }
    }

    /**
    * Delete this stage instance
    * @returns {Promise}
    */
    delete() {
        return this.#client.deleteStageInstance.call(this.#client, this.channel.id);
    }

    /**
    * Update this stage instance
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
    * @arg {String} [options.topic] The stage instance topic
    * @returns {Promise<StageInstance>}
    */
    edit(options) {
        return this.#client.editStageInstance.call(this.#client, this.channel.id, options);
    }
}

module.exports = StageInstance;
