"use strict";

const TextVoiceChannel = require("./TextVoiceChannel");

/**
* Represents a guild stage channel. See TextVoiceChannel for more properties and methods.
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
    * @arg {Object} options The stage instance options
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
    * @arg {Boolean} [options.sendStartNotification] Whether to notify @everyone that a stage instance has started or not
    * @arg {String} options.topic The stage instance topic
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
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public, 2 is guild only
    * @arg {String} [options.topic] The stage instance topic
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
