"use strict";

const Channel = require("./Channel");
const Collection = require("../util/Collection");
const Message = require("./Message");
const {ChannelTypes} = require("../Constants");
const User = require("./User");

/**
* Represents a private channel.
* @extends Channel
*/
class PrivateChannel extends Channel {
    #client;
    constructor(data, client) {
        super(data, client);
        this.#client = client;
        /**
         * The ID of the last message in this channel
         * @type {String}
         */
        this.lastMessageID = data.last_message_id;

        this.rateLimitPerUser = data.rate_limit_per_user;
        if(this.type === ChannelTypes.DM || this.type === undefined) {
            /**
             * The recipient in this private channel (private channels only)
             * @type {User}
             */
            this.recipient = new User(data.recipients[0], client);
        }
        /**
         * Collection of Messages in this channel
         * @type {Collection<Message>}
         */
        this.messages = new Collection(Message, client.options.messageLimit);
    }

    /**
    * Add a reaction to a message
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    addMessageReaction(messageID, reaction) {
        return this.#client.addMessageReaction.call(this.#client, this.id, messageID, reaction);
    }

    /**
    * Create a message in a text channel
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {Buffer} content.attachments[].file A buffer containing file data
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object} [content.messageReference] The message reference, used when replying to messages
    * @arg {String} [content.messageReference.channelID] The channel ID of the referenced message
    * @arg {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
    * @arg {String} [content.messageReference.guildID] The guild ID of the referenced message
    * @arg {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
    * @arg {Array<String>} [content.stickerIDs] An array of IDs corresponding to stickers to send
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise<Message>}
    */
    createMessage(content) {
        return this.#client.createMessage.call(this.#client, this.id, content);
    }

    /**
    * Delete a message
    * @arg {String} messageID The ID of the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessage(messageID, reason) {
        return this.#client.deleteMessage.call(this.#client, this.id, messageID, reason);
    }

    /**
    * Edit a message
    * @arg {String} messageID The ID of the message
    * @arg {String | Array | Object} content A string, array of strings, or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {String} content.attachments[].id The ID of an attachment (set only when you want to update an attachment)
    * @arg {Buffer} content.attachments[].file A buffer containing file data (set only when uploading new files)
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for flags reference
    * @returns {Promise<Message>}
    */
    editMessage(messageID, content) {
        return this.#client.editMessage.call(this.#client, this.id, messageID, content);
    }

    /**
    * Get a previous message in a text channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise<Message>}
    */
    getMessage(messageID) {
        return this.#client.getMessage.call(this.#client, this.id, messageID);
    }

    /**
    * Get a list of users who reacted with a specific reaction
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {Object} [options] Options for the request.
    * @arg {Number} [options.limit=100] The maximum number of users to get
    * @arg {String} [options.after] Get users after this user IDD
    * @returns {Promise<Array<User>>}
    */
    getMessageReaction(messageID, reaction, options) {
        return this.#client.getMessageReaction.call(this.#client, this.id, messageID, reaction, options);
    }

    /**
    * Get a previous message in a text channel
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] Get messages after this message ID
    * @arg {String} [options.around] Get messages around this message ID (does not work with limit > 100)
    * @arg {String} [options.before] Get messages before this message ID
    * @arg {Number} [options.limit=50] The max number of messages to get
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
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    pinMessage(messageID) {
        return this.#client.pinMessage.call(this.#client, this.id, messageID);
    }

    /**
    * Remove a reaction from a message
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
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
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    unpinMessage(messageID) {
        return this.#client.unpinMessage.call(this.#client, this.id, messageID);
    }

    /**
    * Un-send a message. You're welcome Programmix
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    unsendMessage(messageID) {
        return this.#client.deleteMessage.call(this.#client, this.id, messageID);
    }

    toJSON(props = []) {
        return super.toJSON([
            "lastMessageID",
            "messages",
            "recipient",
            ...props
        ]);
    }
}

module.exports = PrivateChannel;
