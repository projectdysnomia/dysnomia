"use strict";

const Collection = require("../util/Collection");
const GuildChannel = require("./GuildChannel");
const Message = require("./Message");
const ThreadMember = require("./ThreadMember");

/**
* Represents a thread channel. You also probably want to look at NewsThreadChannel, PublicThreadChannel, and PrivateThreadChannel. See GuildChannel for extra properties.
* @extends GuildChannel
* @prop {String} lastMessageID The ID of the last message in this channel
* @prop {Object?} member Thread member for the current user, if they have joined the thread
* @prop {Number} member.flags The user's thread settings
* @prop {String} member.id The ID of the thread
* @prop {Number} member.joinTimestamp The time the user last joined the thread
* @prop {String} member.userID The ID of the user
* @prop {Number} memberCount An approximate number of users in the thread (stops at 50)
* @prop {Collection<ThreadMember>} members Collection of members in this channel
* @prop {Number} messageCount An approximate number of messages in the thread
* @prop {Collection<Message>} messages Collection of Messages in this channel
* @prop {String} ownerID The ID of the user that created the thread
* @prop {Number} rateLimitPerUser The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
* @prop {Object} threadMetadata Metadata for the thread
* @prop {Number} threadMetadata.archiveTimestamp Timestamp when the thread's archive status was last changed, used for calculating recent activity
* @prop {Boolean} threadMetadata.archived Whether the thread is archived
* @prop {Number} threadMetadata.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
* @prop {Boolean} threadMetadata.locked Whether the thread is locked
* @prop {Number} totalMessageSent The total amount of messages sent into the thread
*/
class ThreadChannel extends GuildChannel {
    constructor(data, client, messageLimit) {
        super(data, client);
        this.messages = new Collection(Message, messageLimit == null ? client.options.messageLimit : messageLimit);
        this.members = new Collection(ThreadMember);
        this.lastMessageID = data.last_message_id || null;
        this.ownerID = data.owner_id;
        this.update(data);
    }

    update(data) {
        super.update(data);
        if(data.member_count !== undefined) {
            this.memberCount = data.member_count;
        }
        if(data.message_count !== undefined) {
            this.messageCount = data.message_count;
        }
        if(data.rate_limit_per_user !== undefined) {
            this.rateLimitPerUser = data.rate_limit_per_user;
        }
        if(data.thread_metadata !== undefined) {
            this.threadMetadata = {
                archiveTimestamp: Date.parse(data.thread_metadata.archive_timestamp),
                archived: data.thread_metadata.archived,
                autoArchiveDuration: data.thread_metadata.auto_archive_duration,
                createTimestamp: !data.thread_metadata.create_timestamp ? null : Date.parse(data.thread_metadata.create_timestamp),
                locked: data.thread_metadata.locked
            };
        }
        if(data.member !== undefined) {
            this.member = new ThreadMember(data.member, this.client);
        }
        if(data.total_message_sent !== undefined) {
            this.totalMessageSent = data.total_message_sent;
        }
    }

    /**
    * Add a reaction to a message
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    addMessageReaction(messageID, reaction) {
        return this.client.addMessageReaction.call(this.client, this.id, messageID, reaction);
    }

    /**
    * Create a message in the channel
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
    * @arg {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {Buffer} content.attachments[].file A buffer containing file data
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Object} [content.embed] An embed object. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object} [content.messageReference] The message reference, used when replying to messages
    * @arg {String} [content.messageReference.channelID] The channel ID of the referenced message
    * @arg {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
    * @arg {String} [content.messageReference.guildID] The guild ID of the referenced message
    * @arg {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
    * @arg {Array<String>} [content.stickerIDs] An array of IDs corresponding to stickers to send
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise<Message>}
    */
    createMessage(content, file) {
        return this.client.createMessage.call(this.client, this.id, content, file);
    }

    /**
    * Delete a message
    * @arg {String} messageID The ID of the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessage(messageID, reason) {
        return this.client.deleteMessage.call(this.client, this.id, messageID, reason);
    }

    /**
    * Bulk delete messages (bot accounts only)
    * @arg {Array<String>} messageIDs Array of message IDs to delete
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessages(messageIDs, reason) {
        return this.client.deleteMessages.call(this.client, this.id, messageIDs, reason);
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
    * @arg {String} [content.content] A content string
    * @arg {Object} [content.embed] An embed object. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [content.file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} content.file[].file A buffer containing file data
    * @arg {String} content.file[].name What to name the file
    * @arg {Number} [content.flags] A number representing the flags to apply to the message. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for flags reference
    * @returns {Promise<Message>}
    */
    editMessage(messageID, content) {
        return this.client.editMessage.call(this.client, this.id, messageID, content);
    }

    /**
     * Gets a thread member object for a specified user
     * @arg {String} memberID The ID of the member
     * @arg {Object} [options] Options for the request
     * @arg {Boolean} [options.withMember] Whether to include a Member object for each thread member
     * @returns {Promise<ThreadMember>}
     */
    getMember(memberID, options) {
        return this.client.getThreadMember.call(this.client, this.id, memberID, options);
    }

    /**
    * Get a list of members that are part of this thread channel
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Fetch thread members after this user ID
    * @arg {Number} [options.limit] The maximum amount of thread members to fetch
    * @arg {Boolean} [options.withMember] Whether to include a Member object for each thread member
    * @returns {Promise<Array<ThreadMember>>}
    */
    getMembers(options) {
        return this.client.getThreadMembers.call(this.client, this.id, options);
    }

    /**
    * Get a previous message in the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise<Message>}
    */
    getMessage(messageID) {
        return this.client.getMessage.call(this.client, this.id, messageID);
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
        return this.client.getMessageReaction.call(this.client, this.id, messageID, reaction, options);
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
        return this.client.getMessages.call(this.client, this.id, options);
    }

    /**
    * Get all the pins in the channel
    * @returns {Promise<Array<Message>>}
    */
    getPins() {
        return this.client.getPins.call(this.client, this.id);
    }

    /**
    * Join a thread
    * @arg {String} [userID="@me"] The user ID of the user joining
    * @returns {Promise}
    */
    join(userID) {
        return this.client.joinThread.call(this.client, this.id, userID);
    }

    /**
    * Leave a thread
    * @arg {String} [userID="@me"] The user ID of the user leaving
    * @returns {Promise}
    */
    leave(userID) {
        return this.client.leaveThread.call(this.client, this.id, userID);
    }

    /**
    * Pin a message
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    pinMessage(messageID) {
        return this.client.pinMessage.call(this.client, this.id, messageID);
    }

    /**
    * Purge previous messages in the channel with an optional filter (bot accounts only)
    * @arg {Object} options Options for the request. If this is a number
    * @arg {String} [options.after] Get messages after this message ID
    * @arg {String} [options.before] Get messages before this message ID
    * @arg {Function} [options.filter] Optional filter function that returns a boolean when passed a Message object
    * @arg {Number} options.limit The max number of messages to search through, -1 for no limit
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise<Number>} Resolves with the number of messages deleted
    */
    purge(options) {
        return this.client.purgeChannel.call(this.client, this.id, options);
    }

    /**
    * Remove a reaction from a message
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {String} [userID="@me"] The ID of the user to remove the reaction for
    * @returns {Promise}
    */
    removeMessageReaction(messageID, reaction, userID) {
        return this.client.removeMessageReaction.call(this.client, this.id, messageID, reaction, userID);
    }

    /**
    * Remove all reactions from a message for a single emoji
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    removeMessageReactionEmoji(messageID, reaction) {
        return this.client.removeMessageReactionEmoji.call(this.client, this.id, messageID, reaction);
    }

    /**
    * Remove all reactions from a message
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    removeMessageReactions(messageID) {
        return this.client.removeMessageReactions.call(this.client, this.id, messageID);
    }

    /**
    * Send typing status in the channel
    * @returns {Promise}
    */
    sendTyping() {
        return this.client.sendChannelTyping.call(this.client, this.id);
    }

    /**
    * Unpin a message
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    unpinMessage(messageID) {
        return this.client.unpinMessage.call(this.client, this.id, messageID);
    }

    /**
    * Un-send a message. You're welcome Programmix
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    unsendMessage(messageID) {
        return this.client.deleteMessage.call(this.client, this.id, messageID);
    }

    toJSON(props = []) {
        return super.toJSON([
            "appliedTags",
            "lastMessageID",
            "memberCount",
            "messageCount",
            "messages",
            "ownerID",
            "rateLimitPerUser",
            "threadMetadata",
            "member",
            "totalMessageSent",
            ...props
        ]);
    }
}

module.exports = ThreadChannel;
