"use strict";

const Base = require("./Base");

/**
 * Represents a Soundboard Sound
 * @extends Base
 */
class SoundboardSound extends Base {
    /**
     * The ID of the soundboard sound
     * @member {String} SoundboardSound#id
     */

    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;
        if(data.guild_id !== undefined) {
            /**
             * The guild where the soundboard sound was created in (not present for default soundboard sounds). If the guild is uncached, this will be an object with an `id` key. No other keys are guaranteed
             * @type {Guild?}
             */
            this.guild = client.guilds.get(data.guild_id) || {id: data.guild_id};
        }
    }

    update(data) {
        if(data.name !== undefined) {
            /**
             * The name of the soundboard sound
             * @type {String}
             */
            this.name = data.name;
        }
        if(data.volume !== undefined) {
            /**
             * The volume of the soundboard sound, between 0 and 1
             * @type {Number}
             */
            this.volume = data.volume;
        }
        if(data.emoji_id !== undefined) {
            /**
             * The ID of the relating custom emoji (will always be null for default soundboard sounds)
             * @type {String?}
             */
            this.emojiID = data.emoji_id;
        }
        if(data.emoji_name !== undefined) {
            /**
             * The name of the relating default emoji
             * @type {String?}
             */
            this.emojiName = data.emoji_name;
        }
        if(data.available !== undefined) {
            /**
             * Whether the soundboard sound is available or not (will always be true for default soundboard sounds)
             * @type {Boolean}
             */
            this.available = data.available;
        }
        if(data.user !== undefined) {
            /**
             * The user that created the soundboard sound (not present for default soundboard sounds, or if the bot doesn't have either create/editGuildExpressions permissions)
             * @type {User?}
             */
            this.user = this.#client.users.update(data.user, this.#client);
        }
    }

    /**
     * Delete the soundboard sound (not available for default soundboard sounds)
     * @param {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    delete(reason) {
        return this.#client.deleteGuildSoundboardSound.call(this.#client, this.guild.id, this.id, reason);
    }

    /**
     * Edit the soundboard sound (not available for default soundboard sounds)
     * @param {Object} options The properties to edit
     * @param {String?} [options.emojiID] The ID of the relating custom emoji (mutually exclusive with options.emojiName)
     * @param {String?} [options.emojiName] The name of the relating default emoji (mutually exclusive with options.emojiID)
     * @param {String} [options.name] The name of the soundboard sound (2-32 characters)
     * @param {Number?} [options.volume] The volume of the soundboard sound, between 0 and 1
     * @param {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<SoundboardSound>}
     */
    edit(options) {
        return this.#client.editGuildSoundboardSound.call(this.#client, this.guild.id, this.id, options);
    }

    /**
     * Send the soundboard sound to a connected voice channel
     * @param {String} channelID The ID of the connected voice channel
     * @returns {Promise}
     */
    send(channelID) {
        return this.#client.sendSoundboardSound.call(this.#client, channelID, {soundID: this.id, sourceGuildID: this.guild.id});
    }

    toJSON(props = []) {
        return super.toJSON([
            "available",
            "emojiID",
            "emojiName",
            "guild",
            "name",
            "user",
            "volume",
            ...props
        ]);
    }
}

module.exports = SoundboardSound;
