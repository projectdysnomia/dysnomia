"use strict";

const Collection = require("../util/Collection");
const GuildChannel = require("./GuildChannel");
const PermissionOverwrite = require("./PermissionOverwrite");

/**
* Represents a guild forum channel. See GuildChannel for more properties and methods.
* @extends GuildChannel
* @prop {Array<Object>} availableTags Available tags for this channel
* @prop {Number} defaultAutoArchiveDuration The default duration of newly created threads in minutes to automatically archive the thread after inactivity (60, 1440, 4320, 10080)
* @prop {Number} defaultThreadRatelimitPerUser The initial ratelimit of the channel to use on newly created threads, in seconds. 0 means no ratelimit is enabled
* @prop {Object} defaultReactionEmoji The emoji to show as the reaction button
* @prop {Number} defaultSortOrder The default thread sorting order
* @prop {String} lastThreadID The ID of the last thread in this channel
* @prop {Boolean} nsfw Whether the channel is an NSFW channel or not
* @prop {Collection<PermissionOverwrite>} permissionOverwrites Collection of PermissionOverwrites in this channel
* @prop {Number} position The position of the channel
* @prop {Number} rateLimitPerUser The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
* @prop {String?} topic The topic of the channel, shown to the user as post guidelines
*/
class ForumChannel extends GuildChannel {
    constructor(data, client) {
        super(data, client);
        this.availableTags = data.available_tags || [];
        this.defaultThreadRatelimitPerUser = data.default_thread_rate_limit_per_user == null ? null : data.default_thread_rate_limit_per_user;
        this.lastThreadID = data.last_message_id || null;
        this.rateLimitPerUser = data.rate_limit_per_user == null ? null : data.rate_limit_per_user;
        this.update(data);
    }

    update(data) {
        super.update(data);
        if(data.available_tags !== undefined) {
            this.availableTags = data.available_tags;
        }
        if(data.default_auto_archive_duration !== undefined) {
            this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
        }
        if(data.default_thread_rate_limit_per_user !== undefined) {
            this.defaultThreadRatelimitPerUser = data.default_thread_rate_limit_per_user;
        }
        if(data.default_reaction_emoji !== undefined) {
            this.defaultReactionEmoji = data.default_reaction_emoji;
        }
        if(data.default_sort_order !== undefined) {
            this.defaultSortOrder = data.default_sort_order;
        }
        if(data.rate_limit_per_user !== undefined) {
            this.rateLimitPerUser = data.rate_limit_per_user;
        }
        if(data.topic !== undefined) {
            this.topic = data.topic;
        }
        if(data.permission_overwrites) {
            this.permissionOverwrites = new Collection(PermissionOverwrite);
            data.permission_overwrites.forEach((overwrite) => {
                this.permissionOverwrites.add(overwrite);
            });
        }
        if(data.position !== undefined) {
            this.position = data.position;
        }
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
        return this.client.createChannelInvite.call(this.client, this.id, options, reason);
    }

    /**
    * Create a thread in a forum
    * @arg {Object} options The thread options
    * @arg {Object} options The thread options
    * @arg {Number} options.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
    * @arg {Array<String>} [options.appliedTags] The tags to apply to the thread
    * @arg {Boolean} [options.invitable] Whether non-moderators can add other non-moderators to the thread (private threads only)
    * @arg {String} options.name The thread channel name
    * @arg {Object} [options.message] The message to attach to the thread (set only if creating a thread in a `GUILD_FORUM` channel)
    * @arg {Object} [options.message.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.message.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [options.message.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [options.message.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [options.message.attachments] The files to attach to the message
    * @arg {Buffer} options.message.attachments[].file A buffer containing file data
    * @arg {String} options.message.attachments[].filename What to name the file
    * @arg {String} [options.message.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [options.message.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.message.content] A content string
    * @arg {Array<Object>} [options.message.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<String>} [options.message.stickerIDs] An array of IDs corresponding to stickers to send
    * @arg {Number} [options.type] The channel type of the thread to create. It is recommended to explicitly set this property as this will be a required property in API v10
    * @arg {Number} [options.ratelimitPerUser] The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
    * @returns {Promise<PublicThreadChannel>}
    */
    createThread(options) {
        return this.client.createForumThread.call(this.client, this.id, options);
    }

    /**
    * Create a channel webhook
    * @arg {Object} options Webhook options
    * @arg {String?} [options.avatar] The default avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @arg {String} options.name The default name
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} Resolves with a webhook object
    */
    createWebhook(options, reason) {
        return this.client.createChannelWebhook.call(this.client, this.id, options, reason);
    }

    /**
    * Get all archived threads in this channel
    * @arg {String} type The type of thread channel, either "public" or "private"
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    */
    getArchivedThreads(type, options) {
        return this.client.getArchivedThreads.call(this.client, this.id, type, options);
    }

    /**
    * Get all invites in the channel
    * @returns {Promise<Array<Invite>>}
    */
    getInvites() {
        return this.client.getChannelInvites.call(this.client, this.id);
    }

    /**
    * Get joined private archived threads in this channel
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    */
    getJoinedPrivateArchivedThreads(options) {
        return this.client.getJoinedPrivateArchivedThreads.call(this.client, this.id, options);
    }

    /**
    * Get all the webhooks in the channel
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    */
    getWebhooks() {
        return this.client.getChannelWebhooks.call(this.client, this.id);
    }

    toJSON(props = []) {
        return super.toJSON([
            "lastMessageID",
            "messages",
            "nsfw",
            "permissionOverwrites",
            "position",
            "rateLimitPerUser",
            "topic",
            ...props
        ]);
    }
}

module.exports = ForumChannel;
