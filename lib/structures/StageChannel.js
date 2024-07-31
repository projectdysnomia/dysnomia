"use strict";

const TextVoiceChannel = require("./TextVoiceChannel");

/**
 * Represents a guild stage channel.
 * @extends TextVoiceChannel
 */
class StageChannel extends TextVoiceChannel {
    #client;
    constructor(data, client, messageLimit) {
        super(data, client, messageLimit);
        this.#client = client;
    }

    update(data, client) {
        super.update(data, client);
        if(data.topic !== undefined) {
            this.topic = data.topic;
        }
    }

    /**
     * Create a stage instance
     * @param {Object} options The stage instance options
     * @param {String} [options.guildScheduledEventID] The ID of the guild scheduled event associated with the stage instance
     * @param {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
     * @param {Boolean} [options.sendStartNotification] Whether to notify @everyone that a stage instance has started or not
     * @param {String} options.topic The stage instance topic
     * @returns {Promise<StageInstance>}
     */
    createInstance(options) {
        return this.#client.createStageInstance.call(this.#client, this.id, options);
    }

    /**
     * Delete the stage instance for this channel
     * @returns {Promise}
     */
    deleteInstance() {
        return this.#client.deleteStageInstance.call(this.#client, this.id);
    }

    /**
     * Update the stage instance for this channel
     * @param {Object} options The properties to edit
     * @param {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public, 2 is guild only
     * @param {String} [options.topic] The stage instance topic
     * @returns {Promise<StageInstance>}
     */
    editInstance(options) {
        return this.#client.editStageInstance.call(this.#client, this.id, options);
    }

    /**
     * Get the stage instance for this channel
     * @returns {Promise<StageInstance>}
     */
    getInstance() {
        return this.#client.getStageInstance.call(this.#client, this.id);
    }
}

module.exports = StageChannel;
