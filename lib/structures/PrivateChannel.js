"use strict";

const Channel = require("./Channel");
const Collection = require("../util/Collection");
const Message = require("./Message");
const User = require("./User");
const emitDeprecation = require("../util/emitDeprecation");

/**
 * Represents a private channel.
 * @extends Channel
 */
class PrivateChannel extends Channel {
    #client;

    /**
     * The recipients of this private channel
     * @type {Collection<User>}
     */
    recipients = new Collection(User);

    constructor(data, client) {
        super(data, client);
        this.#client = client;
        /**
         * The ID of the last message in this channel
         * @type {String}
         */
        this.lastMessageID = data.last_message_id;

        this.rateLimitPerUser = data.rate_limit_per_user;

        data.recipients?.forEach((recipient) => {
            this.recipients.add(client.options.restMode ? new User(recipient, client) : client.users.add(recipient, client));
        });

        /**
         * Collection of Messages in this channel
         * @type {Collection<Message>}
         */
        this.messages = new Collection(Message, client.options.messageLimit);
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
     * Create a message in a text channel
     * @param {String | Object} content A string or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
     * @param {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {Buffer} content.attachments[].file A buffer containing file data
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} [content.content] A content string
     * @param {Boolean} [content.enforceNonce] If set and nonce is present, check the message for uniqueness in the past few minutes
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Object} [content.messageReference] The message reference, used when replying to messages
     * @param {String} [content.messageReference.channelID] The channel ID of the referenced message. Required if forwarding a message
     * @param {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
     * @param {String} [content.messageReference.guildID] The guild ID of the referenced message
     * @param {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
     * @param {Number} [content.messageReference.type=0] The type of message reference (0 is reply, 1 is forward). Note that this may become required in the future
     * @param {String | Number} [content.nonce] A value that can be used to check if the message was sent
     * @param {Object} [content.poll] A poll object. See [Discord's Documentation](https://discord.com/developers/docs/resources/poll#poll-create-request-object-poll-create-request-object-structure) for object structure
     * @param {Array<String>} [content.stickerIDs] An array of IDs corresponding to stickers to send
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
     * Edit a message
     * @param {String} messageID The ID of the message
     * @param {String | Array | Object} content A string, array of strings, or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {String} content.attachments[].id The ID of an attachment (set only when you want to update an attachment)
     * @param {Buffer} content.attachments[].file A buffer containing file data (set only when uploading new files)
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} [content.content] A content string
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Number} [content.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for flags reference
     * @returns {Promise<Message>}
     */
    editMessage(messageID, content) {
        return this.#client.editMessage.call(this.#client, this.id, messageID, content);
    }

    /**
     * Get a previous message in a text channel
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
     * Get a previous message in a text channel
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
     * Get all the pins in a text channel
     * @returns {Promise<Array<Message>>}
     */
    getPins() {
        return this.#client.getPins.call(this.#client, this.id);
    }

    /**
     * Leave the channel
     * @returns {Promise}
     */
    leave() {
        return this.#client.deleteChannel.call(this.#client, this.id);
    }

    /**
     * Pin a message
     * @param {String} messageID The ID of the message
     * @returns {Promise}
     */
    pinMessage(messageID) {
        return this.#client.pinMessage.call(this.#client, this.id, messageID);
    }

    /**
     * The first recipient in this private channel. May be null if the recipient list wasn't present in the channel data.
     * @deprecated Use the {@link PrivateChannel#recipients} collection instead
     * @type {User?}
     */
    get recipient() {
        emitDeprecation("PRIVATE_CHANNEL_RECIPIENT");
        return this.recipients.values().next().value;
    }

    /**
     * Remove a reaction from a message
     * @param {String} messageID The ID of the message
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @returns {Promise}
     */
    removeMessageReaction(messageID, reaction) {
        return this.#client.removeMessageReaction.call(this.#client, this.id, messageID, reaction);
    }

    /**
     * Send typing status in a text channel
     * @returns {Promise}
     */
    sendTyping() {
        return this.#client.sendChannelTyping.call(this.#client, this.id);
    }

    /**
     * Unpin a message
     * @param {String} messageID The ID of the message
     * @returns {Promise}
     */
    unpinMessage(messageID) {
        return this.#client.unpinMessage.call(this.#client, this.id, messageID);
    }

    /**
     * Un-send a message. You're welcome Programmix
     * @param {String} messageID The ID of the message
     * @returns {Promise}
     */
    unsendMessage(messageID) {
        return this.#client.deleteMessage.call(this.#client, this.id, messageID);
    }

    toJSON(props = []) {
        return super.toJSON([
            "lastMessageID",
            "messages",
            "recipients",
            ...props
        ]);
    }
}

module.exports = PrivateChannel;
