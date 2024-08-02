"use strict";

const VoiceChannel = require("./VoiceChannel");
const Collection = require("../util/Collection");
const Message = require("./Message");

/**
 * Represents a Text-in-Voice channel. See VoiceChannel for more properties and methods.
 * @extends VoiceChannel
 */
class TextVoiceChannel extends VoiceChannel {
    #client;
    constructor(data, client, messageLimit) {
        super(data, client);
        this.#client = client;
        /**
         * Collection of Messages in this channel
         * @type {Collection<Message>}
         */
        this.messages = new Collection(Message, messageLimit == null ? client.options.messageLimit : messageLimit);
        /**
         * Whether the channel is an NSFW channel or not
         * @type {Boolean}
         */
        this.nsfw = data.nsfw;
        /**
         * The ID of the last message in this channel
         * @type {String?}
         */
        this.lastMessageID = data.last_message_id || null;
    }

    update(data, client) {
        super.update(data, client);
        // "not yet, possibly TBD"
        if(data.rate_limit_per_user !== undefined) {
            /**
             * The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
             * @type {Number}
             */
            this.rateLimitPerUser = data.rate_limit_per_user;
        }
        if(data.user_limit !== undefined) {
            /**
             * The max number of users that can join the channel
             * @type {Number?}
             */
            this.userLimit = data.user_limit;
        }
        if(data.video_quality_mode !== undefined) {
            /**
             * The camera video quality mode of the voice channel. `1` is auto, `2` is 720p
             * @type {Number?}
             */
            this.videoQualityMode = data.video_quality_mode;
        }
    }

    /**
     * Add a reaction to a message
     * @param {String} messageID The ID of the message
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @returns {Promise}
     */
    addMessageReaction(messageID, reaction) {
        return this.#client.addMessageReaction.call(this.#client, this.id, messageID, reaction);
    }

    /**
     * Create an invite for the channel
     * @param {Object} [options] Invite generation options
     * @param {Number} [options.maxAge] How long the invite should last in seconds
     * @param {Number} [options.maxUses] How many uses the invite should last for
     * @param {Boolean} [options.temporary] Whether the invite grants temporary membership or not
     * @param {Boolean} [options.unique] Whether the invite is unique or not
     * @param {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise<Invite>}
     */
    createInvite(options, reason) {
        return this.#client.createChannelInvite.call(this.#client, this.id, options, reason);
    }

    /**
     * Create a message in the channel
     * @param {String | Object} content A string or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
     * @param {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {Buffer} content.attachments[].file A buffer containing file data
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} content.content A content string
     * @param {Boolean} [content.enforceNonce] If set and nonce is present, check the message for uniqueness in the past few minutes
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Object} [content.messageReference] The message reference, used when replying to messages
     * @param {String} [content.messageReference.channelID] The channel ID of the referenced message
     * @param {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
     * @param {String} [content.messageReference.guildID] The guild ID of the referenced message
     * @param {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
     * @param {String | Number} [content.nonce] A unique value that can be used to check if the message was sent
     * @param {Object} [content.poll] A poll object. See [Discord's Documentation](https://discord.com/developers/docs/resources/poll#poll-create-request-object-poll-create-request-object-structure) for object structure
     * @param {Array<String>} [content.stickerIDs] An array of IDs corresponding to the stickers to send
     * @param {Boolean} [content.tts] Set the message TTS flag
     * @returns {Promise<Message>}
     */
    createMessage(content) {
        return this.#client.createMessage.call(this.#client, this.id, content);
    }

    /**
     * Delete a message
     * @param {String} messageID The ID of the message
     * @param {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    deleteMessage(messageID, reason) {
        return this.#client.deleteMessage.call(this.#client, this.id, messageID, reason);
    }

    /**
     * Bulk delete messages (bot accounts only)
     * @param {Array<String>} messageIDs Array of message IDs to delete
     * @param {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    deleteMessages(messageIDs, reason) {
        return this.#client.deleteMessages.call(this.#client, this.id, messageIDs, reason);
    }

    /**
     * Edit a message
     * @param {String} messageID The ID of the message
     * @param {String | Array | Object} content A string, array of strings, or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {String} content.attachments[].id The ID of an attachment (set only when you want to update an attachment)
     * @param {Buffer} content.attachments[].file A buffer containing file data (set only when uploading new files)
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} content.content A content string
     * @param {Boolean} [content.disableEveryone] Whether to filter @everyone/@here or not (overrides default)
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Number} [content.flags] A number representing the flags to apply to the message. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for flags reference
     * @returns {Promise<Message>}
     */
    editMessage(messageID, content) {
        return this.#client.editMessage.call(this.#client, this.id, messageID, content);
    }

    /**
     * Get all invites in the channel
     * @returns {Promise<Array<Invite>>}
     */
    getInvites() {
        return this.#client.getChannelInvites.call(this.#client, this.id);
    }

    /**
     * Get a previous message in the channel
     * @param {String} messageID The ID of the message
     * @returns {Promise<Message>}
     */
    getMessage(messageID) {
        return this.#client.getMessage.call(this.#client, this.id, messageID);
    }

    /**
     * Get a list of users who reacted with a specific reaction
     * @param {String} messageID The ID of the message
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @param {Object} [options] Options for the request.
     * @param {Number} [options.limit=100] The maximum number of users to get
     * @param {String} [options.after] Get users after this user ID
     * @param {Number} [options.type=0] The type of reaction to get
     * @returns {Promise<Array<User>>}
     */
    getMessageReaction(messageID, reaction, options) {
        return this.#client.getMessageReaction.call(this.#client, this.id, messageID, reaction, options);
    }

    /**
     * Get previous messages in the channel
     * @param {Object} [options] Options for the request.
     * @param {String} [options.after] Get messages after this message ID
     * @param {String} [options.around] Get messages around this message ID (does not work with limit > 100)
     * @param {String} [options.before] Get messages before this message ID
     * @param {Number} [options.limit=50] The max number of messages to get
     * @returns {Promise<Array<Message>>}
     */
    getMessages(options) {
        return this.#client.getMessages.call(this.#client, this.id, options);
    }

    /**
     * Purge previous messages in the channel with an optional filter (bot accounts only)
     * @param {Object} options Options for the request.
     * @param {String} [options.after] Get messages after this message ID
     * @param {String} [options.before] Get messages before this message ID
     * @param {Function} [options.filter] Optional filter function that returns a boolean when passed a Message object
     * @param {Number} options.limit The max number of messages to search through, -1 for no limit
     * @param {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Number>} Resolves with the number of messages deleted
     */
    purge(limit, options) {
        return this.#client.purgeChannel.call(this.#client, this.id, limit, options);
    }

    /**
     * Remove a reaction from a message
     * @param {String} messageID The ID of the message
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @param {String} [userID="@me"] The ID of the user to remove the reaction for
     * @returns {Promise}
     */
    removeMessageReaction(messageID, reaction, userID) {
        return this.#client.removeMessageReaction.call(this.#client, this.id, messageID, reaction, userID);
    }

    /**
     * Remove all reactions from a message for a single emoji
     * @param {String} messageID The ID of the message
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @returns {Promise}
     */
    removeMessageReactionEmoji(messageID, reaction) {
        return this.#client.removeMessageReactionEmoji.call(this.#client, this.id, messageID, reaction);
    }

    /**
     * Remove all reactions from a message
     * @param {String} messageID The ID of the message
     * @returns {Promise}
     */
    removeMessageReactions(messageID) {
        return this.#client.removeMessageReactions.call(this.#client, this.id, messageID);
    }

    /**
     * Send typing status in the channel
     * @returns {Promise}
     */
    sendTyping() {
        return this.#client.sendChannelTyping.call(this.#client, this.id);
    }

    toJSON(props = []) {
        return super.toJSON([
            "lastMessageID",
            "messages",
            "nsfw",
            "rateLimitPerUser",
            "userLimit",
            "videoQualityMode",
            ...props
        ]);
    }
}

module.exports = TextVoiceChannel;
