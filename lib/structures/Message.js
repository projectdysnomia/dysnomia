"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");
const {SystemJoinMessages, MessageTypes, MessageFlags} = require("../Constants");
const User = require("./User");
const Attachment = require("./Attachment");
const Collection = require("../util/Collection");

/**
* Represents a message
* @prop {Object?} activity The activity specified in the message
* @prop {Object?} application The application of the activity in the message
* @prop {String?} applicationID The ID of the interaction's application
* @prop {Collection<Attachment>} attachments Array of attachments
* @prop {User} author The message author
* @prop {PrivateChannel | TextChannel | NewsChannel} channel The channel the message is in. Can be partial with only the id if the channel is not cached.
* @prop {Array<String>} channelMentions Array of mentions channels' ids
* @prop {String?} cleanContent Message content with mentions replaced by names. Mentions are currently escaped, but this behavior is [DEPRECATED] and will be removed soon. Use allowed mentions, the official way of avoiding unintended mentions, when creating messages.
* @prop {Array<Object>} components An array of component objects
* @prop {String} content Message content
* @prop {Number} createdAt Timestamp of message creation
* @prop {Array<Object>?} crosspostedChannelMentions An array of mentioned channels (crossposted messages only)
* @prop {Number?} editedTimestamp Timestamp of latest message edit
* @prop {Array<Object>} embeds Array of embeds
* @prop {Number} flags Message flags. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
* @prop {String} [guildID] The ID of the guild this message is in (undefined if in DMs)
* @prop {String} id The ID of the message
* @prop {Object?} interaction An object containing info about the interaction the message is responding to, if applicable
* @prop {String} interaction.id The id of the interaction
* @prop {Number} interaction.type The type of interaction
* @prop {String} interaction.name The name of the command
* @prop {User} interaction.user The user who invoked the interaction
* @prop {Member?} interaction.member The member who invoked the interaction
* @prop {String} jumpLink The url used by Discord clients to jump to this message
* @prop {Member?} member The message author with server-specific data
* @prop {Boolean} mentionEveryone Whether the message mentions everyone/here or not
* @prop {Array<User>} mentions Array of mentioned users
* @prop {Object?} messageReference An object containing the reference to the original message if it is a crossposted message or reply
* @prop {String?} messageReference.messageID The id of the original message this message was crossposted from
* @prop {String} messageReference.channelID The id of the channel this message was crossposted from
* @prop {String?} messageReference.guildID The id of the guild this message was crossposted from
* @prop {Boolean} pinned Whether the message is pinned or not
* @prop {Number?} position The approximate position of a message in a thread
* @prop {Object} reactions An object containing the reactions on the message. Each key is a reaction emoji and each value is an object with properties `me` (Boolean) and `count` (Number) for that specific reaction emoji.
* @prop {Message?} referencedMessage The message that was replied to. If undefined, message data was not received. If null, the message was deleted.
* @prop {Object?} roleSubscriptionData Data about the role subscription that triggered this message
* @prop {Array<String>} roleMentions Array of mentioned roles' ids
* @prop {Array<Object>?} stickerItems The stickers sent with the message
* @prop {ThreadChannel?} thread The thread channel created from this message (messages fetched via REST only)
* @prop {Number} timestamp Timestamp of message creation
* @prop {Boolean} tts Whether to play the message using TTS or not
* @prop {Number} type The type of the message
* @prop {String?} webhookID ID of the webhook that sent the message
*/
class Message extends Base {
    #channelMentions;
    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;
        this.type = data.type || 0;
        this.attachments = new Collection(Attachment);
        this.timestamp = Date.parse(data.timestamp);
        this.channel = this.#client.getChannel(data.channel_id) || {
            id: data.channel_id
        };
        this.content = "";
        this.reactions = {};
        this.guildID = data.guild_id;
        this.webhookID = data.webhook_id;

        if(data.message_reference) {
            this.messageReference = {
                messageID: data.message_reference.message_id,
                channelID: data.message_reference.channel_id,
                guildID: data.message_reference.guild_id
            };
        } else {
            this.messageReference = null;
        }

        this.flags = data.flags || 0;

        if(data.author) {
            if(data.author.discriminator !== "0000") {
                this.author = this.#client.users.update(data.author, client);
            } else {
                this.author = new User(data.author, client);
            }
        } else {
            this.#client.emit("error", new Error("MESSAGE_CREATE but no message author:\n" + JSON.stringify(data, null, 2)));
        }
        if(data.referenced_message) {
            const channel = this.#client.getChannel(data.referenced_message.channel_id);
            if(channel) {
                this.referencedMessage = channel.messages.update(data.referenced_message, this.#client);
            } else {
                this.referencedMessage = new Message(data.referenced_message, this.#client);
            }
        } else {
            this.referencedMessage = data.referenced_message;
        }

        if(data.interaction) {
            this.interaction = data.interaction;
            let interactionMember;
            const interactionUser = this.#client.users.update(data.interaction.user, client);
            if(data.interaction.member) {
                data.interaction.member.id = data.interaction.user.id;
                if(this.channel.guild) {
                    interactionMember = this.channel.guild.members.update(data.interaction.member, this.channel.guild);
                } else {
                    interactionMember = data.interaction.member;
                }
            } else if(this.channel.guild?.members.has(data.interaction.user.id)) {
                interactionMember = this.channel.guild.members.get(data.interaction.user.id);
            } else {
                interactionMember = null;
            }
            this.interaction.user = interactionUser;
            this.interaction.member = interactionMember;
        } else {
            this.interaction = null;
        }

        if(this.channel.guild) {
            if(data.member) {
                data.member.id = this.author.id;
                if(data.author) {
                    data.member.user = data.author;
                }
                this.member = this.channel.guild.members.update(data.member, this.channel.guild);
            } else if(this.channel.guild.members.has(this.author.id)) {
                this.member = this.channel.guild.members.get(this.author.id);
            } else {
                this.member = null;
            }

            this.guildID ??= this.channel.guild.id;

            if(data.thread) {
                this.thread = this.channel.guild.threads.update(data.thread, client);
            }
        } else {
            this.member = null;
        }

        if(data.attachments) {
            for(const attachment of data.attachments) {
                this.attachments.add(attachment, this);
            }
        }

        if(data.role_subscription_data) {
            this.roleSubscriptionData = {
                isRenewal: data.role_subscription_data.is_renewal,
                roleSubscriptionListingID: data.role_subscription_data.role_subscription_listing_id,
                tierName: data.role_subscription_data.tier_name,
                totalMonthsSubscribed: data.role_subscription_data.total_months_subscribed
            };
        }

        switch(this.type) {
            case MessageTypes.DEFAULT: {
                break;
            }
            case MessageTypes.RECIPIENT_ADD: {
                data.content = `${this.author.mention} added <@${data.mentions[0].id}>.`;
                break;
            }
            case MessageTypes.RECIPIENT_REMOVE: {
                if(this.author.id === data.mentions[0].id) {
                    data.content = `@${this.author.username} left the group.`;
                } else {
                    data.content = `${this.author.mention} removed @${data.mentions[0].username}.`;
                }
                break;
            }
            case MessageTypes.CHANNEL_NAME_CHANGE: {
                data.content = `${this.author.mention} changed the channel name: ${data.content}`;
                break;
            }
            case MessageTypes.CHANNEL_PINNED_MESSAGE: {
                data.content = `${this.author.mention} pinned a message to this channel. See all the pins.`;
                break;
            }
            case MessageTypes.USER_JOIN: {
                data.content = SystemJoinMessages[~~(this.createdAt % SystemJoinMessages.length)].replace(/%user%/g, this.author.mention);
                break;
            }
            case MessageTypes.GUILD_BOOST: {
                data.content = `${this.author.mention} just boosted the server!`;
                break;
            }
            case MessageTypes.GUILD_BOOST_TIER_1:
            case MessageTypes.GUILD_BOOST_TIER_2:
            case MessageTypes.GUILD_BOOST_TIER_3: {
                data.content = `${this.author.mention} just boosted the server! ${this.channel.guild ? this.channel.guild.name : data.guild_id} has achieved **Level ${this.type - 8}!**`;
                break;
            }
            case MessageTypes.CHANNEL_FOLLOW_ADD: {
                data.content = `${this.author.mention} has added ${data.content} to this channel`;
                break;
            }
            case MessageTypes.GUILD_DISCOVERY_DISQUALIFIED: {
                data.content = "This server has been removed from Server Discovery because it no longer passes all the requirements. Check `Server Settings` for more details.";
                break;
            }
            case MessageTypes.GUILD_DISCOVERY_REQUALIFIED: {
                data.content = "This server is eligible for Server Discovery again and has been automatically relisted!";
                break;
            }
            case MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: {
                data.content = "This server has failed Discovery activity requirements for 1 week. If this server fails for 4 weeks in a row, it will be automatically removed from Discovery.";
                break;
            }
            case MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING: {
                data.content = "This server has failed Discovery activity requirements for 3 weeks in a row. If this server fails for 1 more week, it will be removed from Discovery.";
                break;
            }
            case MessageTypes.THREAD_CREATED: {
                break;
            }
            case MessageTypes.REPLY: {
                break;
            }
            case MessageTypes.CHAT_INPUT_COMMAND: {
                break;
            }
            case MessageTypes.CONTEXT_MENU_COMMAND: {
                break;
            }
            case MessageTypes.THREAD_STARTER_MESSAGE: {
                break;
            }
            case MessageTypes.GUILD_INVITE_REMINDER: {
                data.content = "Wondering who to invite?\nStart by inviting anyone who can help you build the server!";
                break;
            }
            case MessageTypes.AUTO_MODERATION_ACTION: {
                break;
            }
            case MessageTypes.ROLE_SUBSCRIPTION_PURCHASE: {
                data.content = `${this.author.mention} ${this.roleSubscriptionData.isRenewal ? "renewed" : "joined"} **${this.roleSubscriptionData.tierName}** and has been a subscriber of ${this.channel.guild ? this.channel.guild.name : data.guild_id} for ${this.roleSubscriptionData.totalMonthsSubscribed} months!`;
                break;
            }
            case MessageTypes.INTERACTION_PREMIUM_UPSELL: {
                break;
            }
            case MessageTypes.STAGE_START: {
                data.content = `${this.author.mention} started **${data.content}**`;
                break;
            }
            case MessageTypes.STAGE_END: {
                data.content = `${this.author.mention} ended **${data.content}**`;
                break;
            }
            case MessageTypes.STAGE_SPEAKER: {
                data.content = `${this.author.mention} is now a speaker.`;
                break;
            }
            case MessageTypes.STAGE_TOPIC: {
                data.content = `${this.author.mention} changed the Stage topic: **${data.content}**`;
                break;
            }
            case MessageTypes.GUILD_APPLICATION_PREMIUM_SUBSCRIPTION: {
                break;
            }
            default: {
                this.#client.emit("warn", `Unhandled MESSAGE_CREATE type: ${JSON.stringify(data, null, 2)}`);
                break;
            }
        }

        this.update(data, client);
    }

    update(data, client) {
        if(data.content !== undefined) {
            this.content = data.content || "";
            this.mentionEveryone = !!data.mention_everyone;

            this.mentions = data.mentions.map((mention) => {
                const user = this.#client.users.add(mention, client);
                if(mention.member && this.channel.guild) {
                    mention.member.id = mention.id;
                    this.channel.guild.members.update(mention.member, this.channel.guild);
                }
                return user;
            });

            this.roleMentions = data.mention_roles;
        }

        if(data.pinned !== undefined) {
            this.pinned = !!data.pinned;
        }
        if(data.edited_timestamp != undefined) {
            this.editedTimestamp = Date.parse(data.edited_timestamp);
        }
        if(data.tts !== undefined) {
            this.tts = data.tts;
        }
        if(data.attachments) {
            for(const id of this.attachments.keys()) {
                if(!data.attachments.some((attachment) => attachment.id === id)) {
                    this.attachments.delete(id);
                }
            }
            for(const attachment of data.attachments) {
                this.attachments.update(attachment, this);
            }
        }
        if(data.embeds !== undefined) {
            this.embeds = data.embeds;
        }
        if(data.flags !== undefined) {
            this.flags = data.flags;
        }
        if(data.activity !== undefined) {
            this.activity = data.activity;
        }
        if(data.application !== undefined) {
            this.application = data.application;
        }
        if(data.application_id !== undefined) {
            this.applicationID = data.application_id;
        }

        if(data.reactions) {
            data.reactions.forEach((reaction) => {
                this.reactions[reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name] = {
                    count: reaction.count,
                    me: reaction.me
                };
            });
        }

        if(data.sticker_items !== undefined) {
            this.stickerItems = data.sticker_items.map((sticker) => {
                if(sticker.user) {
                    sticker.user = this.#client.users.update(sticker.user, client);
                }

                return sticker;
            });
        }

        if(data.components !== undefined) {
            this.components = data.components;
        }

        if(data.mention_channels !== undefined) {
            this.crosspostedChannelMentions = data.mention_channels.map((channel) => ({
                guildID: channel.guild_id,
                id: channel.id,
                name: channel.name,
                type: channel.type
            }));
        }

        if(data.position !== undefined) {
            this.position = data.position;
        }
    }

    get channelMentions() {
        return this.#channelMentions ?? (this.#channelMentions = (this.content?.match(/<#[0-9]+>/g) || []).map((mention) => mention.substring(2, mention.length - 1)));
    }

    get cleanContent() {
        let cleanContent = this.content?.replace(/<a?(:\w+:)[0-9]+>/g, "$1") || "";

        let authorName = this.author.username;
        const member = this.channel.guild?.members.get(this.author.id);
        if(member?.nick) {
            authorName = member.nick;
        }
        cleanContent = cleanContent.replace(new RegExp(`<@!?${this.author.id}>`, "g"), "@\u200b" + authorName);

        this.mentions?.forEach((mention) => {
            const member = this.channel.guild?.members.get(mention.id);
            if(member?.nick) {
                cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), "@\u200b" + member.nick);
            }
            cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), "@\u200b" + mention.username);
        });

        if(this.channel.guild && this.roleMentions) {
            for(const roleID of this.roleMentions) {
                const role = this.channel.guild.roles.get(roleID);
                const roleName = role?.name ?? "deleted-role";
                cleanContent = cleanContent.replace(new RegExp(`<@&${roleID}>`, "g"), "@\u200b" + roleName);
            }
        }

        this.channelMentions.forEach((id) => {
            const channel = this.#client.getChannel(id);
            if(channel?.name && channel?.mention) {
                cleanContent = cleanContent.replace(channel.mention, "#" + channel.name);
            }
        });

        return cleanContent.replace(/@everyone/g, "@\u200beveryone").replace(/@here/g, "@\u200bhere");
    }

    get jumpLink() {
        return `${Endpoints.CLIENT_URL}${Endpoints.MESSAGE_LINK(this.guildID || "@me", this.channel.id, this.id)}`; // Messages outside of guilds (DMs) will never have a guildID property assigned
    }

    /**
    * Add a reaction to a message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    addReaction(reaction) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot have reactions");
        }
        return this.#client.addMessageReaction.call(this.#client, this.channel.id, this.id, reaction);
    }

    /**
    * Create a thread with this message
    * @arg {Object} options The thread options
    * @arg {Number} options.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
    * @arg {String} options.name The thread channel name
    * @returns {Promise<NewsThreadChannel | PublicThreadChannel>}
    */
    createThreadWithMessage(options) {
        return this.#client.createThreadWithMessage.call(this.#client, this.channel.id, this.id, options);
    }

    /**
     * Crosspost (publish) a message to subscribed channels (NewsChannel only)
     * @returns {Promise<Message>}
     */
    crosspost() {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be crossposted");
        }
        return this.#client.crosspostMessage.call(this.#client, this.channel.id, this.id);
    }

    /**
    * Delete the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    delete(reason) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be deleted");
        }
        return this.#client.deleteMessage.call(this.#client, this.channel.id, this.id, reason);
    }

    /**
    * Delete the message as a webhook
    * @arg {String} token The token of the webhook
    * @returns {Promise}
    */
    deleteWebhook(token) {
        if(!this.webhookID) {
            throw new Error("Message is not a webhook");
        }
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be deleted");
        }
        return this.#client.deleteWebhookMessage.call(this.#client, this.webhookID, token, this.id);
    }

    /**
    * Edit the message
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
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @returns {Promise<Message>}
    */
    edit(content) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be edited via this method");
        }
        return this.#client.editMessage.call(this.#client, this.channel.id, this.id, content);
    }

    /**
    * Edit the message as a webhook
    * @arg {String} token The token of the webhook
    * @arg {Object} options Webhook message edit options
    * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here
    * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
    * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
    * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {String} content.attachments[].id The ID of an attachment (set only when you want to update an attachment)
    * @arg {Buffer} content.attachments[].file A buffer containing file data (set only when uploading new files)
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [options.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.content] A content string
    * @arg {Array<Object>} [options.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @returns {Promise<Message>}
    */
    editWebhook(token, options) {
        if(!this.webhookID) {
            throw new Error("Message is not a webhook");
        }
        return this.#client.editWebhookMessage.call(this.#client, this.webhookID, token, this.id, options);
    }

    /**
    * Get a list of users who reacted with a specific reaction
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {Object} [options] Options for the request.
    * @arg {Number} [options.limit=100] The maximum number of users to get
    * @arg {String} [options.after] Get users after this user ID
    * @returns {Promise<Array<User>>}
    */
    getReaction(reaction, options) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot have reactions");
        }
        return this.#client.getMessageReaction.call(this.#client, this.channel.id, this.id, reaction, options);
    }

    /**
    * Pin the message
    * @returns {Promise}
    */
    pin() {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be pinned");
        }
        return this.#client.pinMessage.call(this.#client, this.channel.id, this.id);
    }

    /**
    * Remove a reaction from a message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {String} [userID="@me"] The ID of the user to remove the reaction for
    * @returns {Promise}
    */
    removeReaction(reaction, userID) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot have reactions");
        }
        return this.#client.removeMessageReaction.call(this.#client, this.channel.id, this.id, reaction, userID);
    }

    /**
    * Remove all reactions from a message for a single emoji
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    removeReactionEmoji(reaction) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot have reactions");
        }
        return this.#client.removeMessageReactionEmoji.call(this.#client, this.channel.id, this.id, reaction);
    }

    /**
    * Remove all reactions from a message
    * @returns {Promise}
    */
    removeReactions() {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot have reactions");
        }
        return this.#client.removeMessageReactions.call(this.#client, this.channel.id, this.id);
    }

    /**
    * Unpin the message
    * @returns {Promise}
    */
    unpin() {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be pinned");
        }
        return this.#client.unpinMessage.call(this.#client, this.channel.id, this.id);
    }

    toJSON(props = []) {
        return super.toJSON([
            "activity",
            "application",
            "attachments",
            "author",
            "content",
            "editedTimestamp",
            "embeds",
            "flags",
            "guildID",
            "hit",
            "member",
            "mentionEveryone",
            "mentions",
            "messageReference",
            "pinned",
            "reactions",
            "referencedMesssage",
            "roleMentions",
            "stickerItems",
            "timestamp",
            "tts",
            "type",
            "webhookID",
            ...props
        ]);
    }
}

module.exports = Message;
