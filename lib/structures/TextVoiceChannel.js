"use strict";

const VoiceChannel = require("./VoiceChannel");
const Collection = require("../util/Collection");
const Message = require("./Message");

/**
* Represents a Text-in-Voice channel. See VoiceChannel for more properties and methods.
* @extends VoiceChannel
* @prop {String} lastMessageID The ID of the last message in this channel
* @prop {Collection<Message>} messages Collection of Messages in this channel
* @prop {Boolean} nsfw Whether the channel is an NSFW channel or not
* @prop {Number} rateLimitPerUser The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
* @prop {Number?} userLimit The max number of users that can join the channel
* @prop {Number?} videoQualityMode The camera video quality mode of the voice channel. `1` is auto, `2` is 720p
*/
class TextVoiceChannel extends VoiceChannel {
    constructor(data, client, messageLimit) {
        super(data, client);
        this.messages = new Collection(Message, messageLimit == null ? client.options.messageLimit : messageLimit);
        this.nsfw = data.nsfw;
        this.lastMessageID = data.last_message_id || null;
        this.update(data);
    }

    update(data) {
        super.update(data);
        // "not yet, possibly TBD"
        if(data.rate_limit_per_user !== undefined) {
            this.rateLimitPerUser = data.rate_limit_per_user;
        }
        if(data.user_limit !== undefined) {
            this.userLimit = data.user_limit;
        }
        if(data.video_quality_mode !== undefined) {
            this.videoQualityMode = data.video_quality_mode;
        }
    }

    /**
    * Add a reaction to a message
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    addMessageReaction(messageID, reaction) {
        return this.client.rest.addMessageReaction(this.id, messageID, reaction);
    }

    /**
    * Create an invite for the channel
    * @arg {Object} [options] Invite generation options
    * @arg {Number} [options.maxAge] How long the invite should last in seconds
    * @arg {Number} [options.maxUses] How many uses the invite should last for
    * @arg {Boolean} [options.temporary] Whether the invite grants temporary membership or not
    * @arg {Boolean} [options.unique] Whether the invite is unique or not
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Invite>}
    */
    createInvite(options, reason) {
        return this.client.rest.createChannelInvite(this.id, options, reason);
    }

    /**
    * Create a message in the channel
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
    * @arg {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {Buffer} content.attachments[].file A buffer containing file data
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} content.content A content string
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object} [content.messageReference] The message reference, used when replying to messages
    * @arg {String} [content.messageReference.channelID] The channel ID of the referenced message
    * @arg {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
    * @arg {String} [content.messageReference.guildID] The guild ID of the referenced message
    * @arg {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
    * @arg {Array<String>} [content.stickerIDs] An array of IDs corresponding to the stickers to send
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise<Message>}
    */
    createMessage(content) {
        return this.client.rest.createMessage(this.id, content);
    }

    /**
    * Delete a message
    * @arg {String} messageID The ID of the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessage(messageID, reason) {
        return this.client.rest.deleteMessage(this.id, messageID, reason);
    }

    /**
    * Bulk delete messages (bot accounts only)
    * @arg {Array<String>} messageIDs Array of message IDs to delete
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessages(messageIDs, reason) {
        return this.client.rest.deleteMessages(this.id, messageIDs, reason);
    }

    /**
    * Edit a message
    * @arg {String} messageID The ID of the message
    * @arg {String | Array | Object} content A string, array of strings, or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {String} content.attachments[].id The ID of an attachment (set only when you want to update an attachment)
    * @arg {Buffer} content.attachments[].file A buffer containing file data (set only when uploading new files)
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} content.content A content string
    * @arg {Boolean} [content.disableEveryone] Whether to filter @everyone/@here or not (overrides default)
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] A number representing the flags to apply to the message. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for flags reference
    * @returns {Promise<Message>}
    */
    editMessage(messageID, content) {
        return this.client.rest.editMessage(this.id, messageID, content);
    }

    /**
    * Get all invites in the channel
    * @returns {Promise<Array<Invite>>}
    */
    getInvites() {
        return this.client.rest.getChannelInvites(this.id);
    }

    /**
    * Get a previous message in the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise<Message>}
    */
    getMessage(messageID) {
        return this.client.rest.getMessage(this.id, messageID);
    }

    /**
    * Get a list of users who reacted with a specific reaction
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {Object} [options] Options for the request.
    * @arg {Number} [options.limit=100] The maximum number of users to get
    * @arg {String} [options.after] Get users after this user ID
    * @returns {Promise<Array<User>>}
    */
    getMessageReaction(messageID, reaction, options) {
        return this.client.rest.getMessageReaction(this.id, messageID, reaction, options);
    }

    /**
    * Get previous messages in the channel
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] Get messages after this message ID
    * @arg {String} [options.around] Get messages around this message ID (does not work with limit > 100)
    * @arg {String} [options.before] Get messages before this message ID
    * @arg {Number} [options.limit=50] The max number of messages to get
    * @returns {Promise<Array<Message>>}
    */
    getMessages(options) {
        return this.client.rest.getMessages(this.id, options);
    }

    /**
    * Purge previous messages in the channel with an optional filter (bot accounts only)
    * @arg {Object} options Options for the request.
    * @arg {String} [options.after] Get messages after this message ID
    * @arg {String} [options.before] Get messages before this message ID
    * @arg {Function} [options.filter] Optional filter function that returns a boolean when passed a Message object
    * @arg {Number} options.limit The max number of messages to search through, -1 for no limit
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise<Number>} Resolves with the number of messages deleted
    */
    purge(limit, options) {
        return this.client.rest.purgeChannel(this.id, limit, options);
    }

    /**
    * Remove a reaction from a message
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {String} [userID="@me"] The ID of the user to remove the reaction for
    * @returns {Promise}
    */
    removeMessageReaction(messageID, reaction, userID) {
        return this.client.rest.removeMessageReaction(this.id, messageID, reaction, userID);
    }

    /**
    * Remove all reactions from a message for a single emoji
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    removeMessageReactionEmoji(messageID, reaction) {
        return this.client.rest.removeMessageReactionEmoji(this.id, messageID, reaction);
    }

    /**
    * Remove all reactions from a message
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    removeMessageReactions(messageID) {
        return this.client.rest.removeMessageReactions(this.id, messageID);
    }

    /**
    * Send typing status in the channel
    * @returns {Promise}
    */
    sendTyping() {
        return this.client.rest.sendChannelTyping(this.id);
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
