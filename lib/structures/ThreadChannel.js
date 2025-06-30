"use strict";

const Collection = require("../util/Collection");
const GuildChannel = require("./GuildChannel");
const Message = require("./Message");
const ThreadMember = require("./ThreadMember");

/**
 * Represents a thread channel. You also probably want to look at NewsThreadChannel, PublicThreadChannel, and PrivateThreadChannel.
 * @extends GuildChannel
 */
class ThreadChannel extends GuildChannel {
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
         * Collection of members in this channel
         * @type {Collection<ThreadMember>}
         */
        this.members = new Collection(ThreadMember);
        /**
         * The ID of the last message in this channel
         * @type {String?}
         */
        this.lastMessageID = data.last_message_id || null;
        /**
         * The ID of the user that created the thread
         * @type {String}
         */
        this.ownerID = data.owner_id;
    }

    update(data, client) {
        super.update(data, client);
        if(data.member_count !== undefined) {
            /**
             * An approximate number of users in the thread (stops at 50)
             * @type {Number}
             */
            this.memberCount = data.member_count;
        }
        if(data.message_count !== undefined) {
            /**
             * An approximate number of messages in the thread
             * @type {Number}
             */
            this.messageCount = data.message_count;
        }
        if(data.rate_limit_per_user !== undefined) {
            /**
             * The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
             * @type {Number}
             */
            this.rateLimitPerUser = data.rate_limit_per_user;
        }
        if(data.thread_metadata !== undefined) {
            /**
             * Metadata for the thread
             * @type {ThreadChannel.ThreadMetadata}
             */
            this.threadMetadata = {
                archiveTimestamp: Date.parse(data.thread_metadata.archive_timestamp),
                archived: data.thread_metadata.archived,
                autoArchiveDuration: data.thread_metadata.auto_archive_duration,
                createTimestamp: !data.thread_metadata.create_timestamp ? null : Date.parse(data.thread_metadata.create_timestamp),
                locked: data.thread_metadata.locked
            };
        }
        if(data.member !== undefined) {
            /**
             * Thread member for the current user, if they have joined the thread
             * @type {ThreadMember?}
             */
            this.member = new ThreadMember(data.member, client);
        }
        if(data.total_message_sent !== undefined) {
            /**
             * The total amount of messages sent into the thread
             * @type {Number}
             */
            this.totalMessageSent = data.total_message_sent;
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
     * Create a message in the channel
     * @param {String | Object} content A string or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
     * @param {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {Buffer} content.attachments[].file A buffer containing file data
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} [content.content] A content string
     * @param {Boolean} [content.enforceNonce] If set and nonce is present, check the message for uniqueness in the past few minutes
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
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
     * @param {String} [content.content] A content string
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Number} [content.flags] A number representing the flags to apply to the message. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for flags reference
     * @returns {Promise<Message>}
     */
    editMessage(messageID, content) {
        return this.#client.editMessage.call(this.#client, this.id, messageID, content);
    }

    /**
     * Gets a thread member object for a specified user
     * @param {String} memberID The ID of the member
     * @param {Object} [options] Options for the request
     * @param {Boolean} [options.withMember] Whether to include a Member object for each thread member
     * @returns {Promise<ThreadMember>}
     */
    getMember(memberID, options) {
        return this.#client.getThreadMember.call(this.#client, this.id, memberID, options);
    }

    /**
     * Get a list of members that are part of this thread channel
     * @param {Object} [options] Options for the request
     * @param {String} [options.after] Fetch thread members after this user ID
     * @param {Number} [options.limit] The maximum amount of thread members to fetch
     * @param {Boolean} [options.withMember] Whether to include a Member object for each thread member
     * @returns {Promise<Array<ThreadMember>>}
     */
    getMembers(options) {
        return this.#client.getThreadMembers.call(this.#client, this.id, options);
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
     * Get pins in the channel
     * @param {Object} [options] Options for fetching the pins
     * @param {Date} [options.before] Get pins before this timestamp
     * @param {Number} [options.limit=50] The maximum number of pins to get (1-50)
     * @returns {Promise<Array<Message>>} if options are not passed. This is deprecated and will be turned into the lower form in a newer version.
     * @returns {Promise<{hasMore: Boolean, items: Array<{pinnedAt: Number, message: Message}>}>} if options are passed.
     */
    getPins(options) {
        return this.#client.getPins.call(this.#client, this.id, options);
    }

    /**
     * Join a thread
     * @param {String} [userID="@me"] The user ID of the user joining
     * @returns {Promise}
     */
    join(userID) {
        return this.#client.joinThread.call(this.#client, this.id, userID);
    }

    /**
     * Leave a thread
     * @param {String} [userID="@me"] The user ID of the user leaving
     * @returns {Promise}
     */
    leave(userID) {
        return this.#client.leaveThread.call(this.#client, this.id, userID);
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
     * Purge previous messages in the channel with an optional filter (bot accounts only)
     * @param {Object} options Options for the request. If this is a number
     * @param {String} [options.after] Get messages after this message ID
     * @param {String} [options.before] Get messages before this message ID
     * @param {Function} [options.filter] Optional filter function that returns a boolean when passed a Message object
     * @param {Number} options.limit The max number of messages to search through, -1 for no limit
     * @param {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Number>} Resolves with the number of messages deleted
     */
    purge(options) {
        return this.#client.purgeChannel.call(this.#client, this.id, options);
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

/**
 * Metadata for the thread
 * @typedef {Object} ThreadChannel.ThreadMetadata
 * @prop {Number} archiveTimestamp Timestamp when the thread's archive status was last changed, used for calculating recent activity
 * @prop {Boolean} archived Whether the thread is archived
 * @prop {Number} autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
 * @prop {Number?} createTimestamp The timestamp when the thread was created
 * @prop {Boolean} invitable Whether non-moderators can add other non-moderators to the thread (private thread channels only)
 * @prop {Boolean} locked Whether the thread is locked
 */
