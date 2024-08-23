"use strict";

const Base = require("./Base");
const Endpoints = require("../rest/Endpoints");
const {SystemJoinMessages, MessageTypes, MessageFlags, ChannelTypes} = require("../Constants");
const User = require("./User");
const Attachment = require("./Attachment");
const Collection = require("../util/Collection");

/**
 * Represents a message
 * @extends Base
 */
class Message extends Base {
    /**
     * Timestamp of message creation
     * @member {Number} Message#createdAt
     */
    /**
     * The ID of the message
     * @member {String} Message#id
     */
    #channelMentions;
    #client;
    /**
     * A collection of attachments
     * @type {Collection<Attachment>}
     */
    attachments = new Collection(Attachment);
    constructor(data, client) {
        super(data.id);
        this.#client = client;
        /**
         * The type of the message
         * @type {Number}
         */
        this.type = data.type || 0;
        /**
         * Timestamp of message creation
         * @type {Number}
         */
        this.timestamp = Date.parse(data.timestamp);
        /**
         * The channel the message is in. Can be partial with only the id if the channel is not cached.
         * @type {PrivateChannel | TextChannel | NewsChannel}
         */
        this.channel = this.#client.getChannel(data.channel_id) || {
            id: data.channel_id
        };
        /**
         * Message content
         * @type {String}
         */
        this.content = "";
        /**
         * An object containing the reactions on the message. Each key is a reaction emoji and each value is an object with properties `me` (Boolean), `meBurst` (Boolean), `count` (Number), `countDetails` (an object with `burst` and `normal` keys corresponding to the amount of reactions of the respective type), and `burstColors` (Array<String>) for that specific reaction emoji.
         * @type {Object<string, object>}
         */
        this.reactions = {};
        /**
         * The ID of the guild this message is in (undefined if in DMs)
         * @type {String?}
         */
        this.guildID = data.guild_id;
        /**
         * ID of the webhook that sent the message
         * @type {String?}
         */
        this.webhookID = data.webhook_id;

        if(data.message_reference) {
            /**
             * An object containing the reference to the original message if it is a crossposted message or reply
             * @type {Message.MessageReference}
             */
            this.messageReference = {
                type: data.message_reference.type,
                messageID: data.message_reference.message_id,
                channelID: data.message_reference.channel_id,
                guildID: data.message_reference.guild_id
            };
        } else {
            this.messageReference = null;
        }

        /**
         * Message flags. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
         * @type {Number}
         */
        this.flags = data.flags || 0;

        if(data.author) {
            if(data.author.discriminator !== "0000") {
                /**
                 * The message author
                 * @type {User?}
                 */
                this.author = this.#client.users.update(data.author, client);
            } else {
                this.author = new User(data.author, client);
            }
        }
        if(data.referenced_message) {
            const channel = this.#client.getChannel(data.referenced_message.channel_id);
            if(channel) {
                /**
                 * The message that was replied to. If undefined, message data was not received. If null, the message was deleted.
                 * @type {Message?}
                 */
                this.referencedMessage = channel.messages.update(data.referenced_message, this.#client);
            } else {
                this.referencedMessage = new Message(data.referenced_message, this.#client);
            }
        } else {
            this.referencedMessage = data.referenced_message;
        }
        if(data.message_snapshots && data.message_reference) {
            /**
             * An array of message snapshots associated with {@link Message#messageReference}.
             * @type {Array<Message.MessageSnapshot>?}
             */
            this.messageSnapshots = data.message_snapshots.map((snapshot) => {
                snapshot.message.id ??= data.message_reference.message_id;
                snapshot.message.channel_id ??= data.message_reference.channel_id;
                snapshot.message.guild_id ??= data.message_reference.guild_id;
                return {
                    message: new Message(snapshot.message, client)
                };
            });
        }

        if(data.interaction) {
            /**
             * An object containing info about the interaction the message is responding to, if applicable
             * @deprecated Use {@link Message#interactionMetadata} instead
             * @type {Message.InteractionData}
             */
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

        if(data.interaction_metadata) {
            /**
             * An object containing metadata about the interaction the message is responding to, if applicable
             * Typings TBD
             * @type {Object}
             */
            this.interactionMetadata = {
                id: data.interaction_metadata.id,
                type: data.interaction_metadata.type,
                userID: data.interaction_metadata.user_id,
                authorizingIntegrationOwners: data.interaction_metadata.authorizing_integration_owners,
                originalResponseMessageID: data.interaction_metadata.original_response_message_id,
                interactedMessageID: data.interaction_metadata.interacted_message_id,
                // TODO: Do I transform the object into camel case as well?
                triggeringInteractionMetadata: data.interaction_metadata.triggering_interaction_metadata
            };
        }

        if(this.channel.guild) {
            if(data.member) {
                data.member.id = this.author.id;
                if(data.author) {
                    data.member.user = data.author;
                }
                /**
                 * The message author with server-specific data
                 * @type {Member?}
                 */
                this.member = this.channel.guild.members.update(data.member, this.channel.guild);
            } else if(this.channel.guild.members.has(this.author.id)) {
                this.member = this.channel.guild.members.get(this.author.id);
            } else {
                this.member = null;
            }

            this.guildID ??= this.channel.guild.id;

            if(data.thread) {
                /**
                 * The thread channel created from this message (messages fetched via REST only)
                 * @type {ThreadChannel?}
                 */
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
            /**
             * Data about the role subscription that triggered this message
             * @type {Object?}
             */
            this.roleSubscriptionData = {
                isRenewal: data.role_subscription_data.is_renewal,
                roleSubscriptionListingID: data.role_subscription_data.role_subscription_listing_id,
                tierName: data.role_subscription_data.tier_name,
                totalMonthsSubscribed: data.role_subscription_data.total_months_subscribed
            };
        }

        /**
         * A unique user-provided value used to check whether a message was sent.
         * Available only when the message is created over REST, or received via
         * the messageCreate event.
         *
         * @type {(String | Number)?}
         */
        this.nonce = data.nonce;

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
                data.content = `${this.author.mention} upgraded **${data.application?.name ?? data.application?.id ?? "a deleted application"}** to premium for this server! 🎉`;
                break;
            }
            case MessageTypes.GUILD_INCIDENT_ALERT_MODE_ENABLED: {
                data.content = `${this.author.mention} enabled security actions until **${data.content}**.`;
                break;
            }
            case MessageTypes.GUILD_INCIDENT_ALERT_MODE_DISABLED: {
                data.content = `${this.author.mention} disabled security actions.`;
                break;
            }
            case MessageTypes.GUILD_INCIDENT_REPORT_RAID: {
                data.content = `${this.author.mention} reported a raid in **${this.channel.guild?.name ?? data.guild_id}**.`;
                break;
            }
            case MessageTypes.GUILD_INCIDENT_REPORT_FALSE_ALARM: {
                data.content = `${this.author.mention} resolved an Activity Alert.`;
                break;
            }
            case MessageTypes.PURCHASE_NOTIFICATION: {
                // WARN: `purchase_notification` is documented only in the OpenAPI spec
                data.content = `${this.author.mention} has purchased **${data.purchase_notification?.guild_product_purchase?.product_name ?? "an unknown product"}**!`;
                break;
            }
            case MessageTypes.POLL_RESULT: {
                data.content = `${this.author.mention}'s poll **${data.embeds.find((e) => e.type === "poll_result")?.fields.find((f) => f.name === "poll_question_text")?.value ?? "unknown question"}** has closed.`;
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
            /**
             * Whether the message mentions everyone/here or not
             * @type {Boolean}
             */
            this.mentionEveryone = !!data.mention_everyone;

            /**
             * Array of mentioned users
             * @type {Array<User>}
             */
            this.mentions = data.mentions.map((mention) => {
                const user = this.#client.users.add(mention, client);
                if(mention.member && this.channel.guild) {
                    mention.member.id = mention.id;
                    this.channel.guild.members.update(mention.member, this.channel.guild);
                }
                return user;
            });

            /**
             * Array of mentioned roles' ids
             * @type {Array<String>}
             */
            this.roleMentions = data.mention_roles;
        }

        if(data.pinned !== undefined) {
            /**
             * Whether the message is pinned or not
             * @type {Boolean}
             */
            this.pinned = !!data.pinned;
        }
        if(data.edited_timestamp != null) {
            /**
             * Timestamp of latest message edit
             * @type {Number?}
             */
            this.editedTimestamp = Date.parse(data.edited_timestamp);
        }
        if(data.tts !== undefined) {
            /**
             * Whether to play the message using TTS or not
             * @type {Boolean}
             */
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
            /**
             * Array of embeds
             * @type {Array<Object>}
             */
            this.embeds = data.embeds;
        }
        if(data.flags !== undefined) {
            this.flags = data.flags;
        }
        if(data.activity !== undefined) {
            /**
             * The activity specified in the message
             * @type {Object?}
             */
            this.activity = data.activity;
        }
        if(data.application !== undefined) {
            /**
             * The application of the activity in the message
             * @type {Object?}
             */
            this.application = data.application;
        }
        if(data.application_id !== undefined) {
            /**
             * The ID of the interaction's application
             * @type {String?}
             */
            this.applicationID = data.application_id;
        }

        if(data.reactions) {
            data.reactions.forEach((reaction) => {
                this.reactions[reaction.emoji.id ? `${reaction.emoji.name}:${reaction.emoji.id}` : reaction.emoji.name] = {
                    burstColors: reaction.burst_colors,
                    count: reaction.count,
                    countDetails: reaction.count_details,
                    me: reaction.me,
                    meBurst: reaction.me_burst
                };
            });
        }

        if(data.sticker_items !== undefined) {
            /**
             * The stickers sent with the message
             * @type {Array<Object>?}
             */
            this.stickerItems = data.sticker_items.map((sticker) => {
                if(sticker.user) {
                    sticker.user = this.#client.users.update(sticker.user, client);
                }

                return sticker;
            });
        }

        if(data.components !== undefined) {
            /**
             * An array of component objects
             * @type {Array<Object>}
             */
            this.components = data.components;
        }

        if(data.mention_channels !== undefined) {
            /**
             * An array of mentioned channels (crossposted messages only)
             * @type {Array<Object>?}
             */
            this.crosspostedChannelMentions = data.mention_channels.map((channel) => ({
                guildID: channel.guild_id,
                id: channel.id,
                name: channel.name,
                type: channel.type
            }));
        }

        if(data.position !== undefined) {
            /**
             * The approximate position of a message in a thread
             * @type {Number?}
             */
            this.position = data.position;
        }

        if(data.poll !== undefined) {
            /**
             * The poll data for the message. See [Discord's documentation](https://discord.com/developers/docs/resources/poll#poll-object-poll-object-structure)
             * for more information about the structure.
             * @type {Object?}
             */
            this.poll = data.poll;
        }
    }

    /**
     * Array of mentions channels' ids
     * @type {Array<String>}
     */
    get channelMentions() {
        return this.#channelMentions ?? (this.#channelMentions = (this.content?.match(/<#[0-9]+>/g) || []).map((mention) => mention.substring(2, mention.length - 1)));
    }

    /**
     * Message content with mentions replaced by names. Mentions are currently escaped, but this behavior is [DEPRECATED] and will be removed soon. Use allowed mentions, the official way of avoiding unintended mentions, when creating messages.
     * @type {String?}
     */
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

    /**
     * The url used by Discord clients to jump to this message
     * @type {String}
     */
    get jumpLink() {
        return `${Endpoints.CLIENT_URL}${Endpoints.MESSAGE_LINK(this.guildID || "@me", this.channel.id, this.id)}`; // Messages outside of guilds (DMs) will never have a guildID property assigned
    }

    /**
     * Add a reaction to a message
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
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
     * @param {Object} options The thread options
     * @param {Number} options.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
     * @param {String} options.name The thread channel name
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
     * @param {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    delete(reason) {
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be deleted");
        }
        return this.#client.deleteMessage.call(this.#client, this.channel.id, this.id, reason);
    }

    /**
     * Delete the message as a webhook. May fail if the message is created in an uncached thread.
     * @param {String} token The token of the webhook
     * @returns {Promise}
     */
    deleteWebhook(token) {
        if(!this.webhookID) {
            throw new Error("Message is not a webhook");
        }
        if(this.flags & MessageFlags.EPHEMERAL) {
            throw new Error("Ephemeral messages cannot be deleted");
        }
        return this.#client.deleteWebhookMessage.call(this.#client, this.webhookID, token, this.id,
            [ChannelTypes.ANNOUNCEMENT_THREAD, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD].includes(this.channel.type)
                ? this.channel.id
                : undefined);
    }

    /**
     * Edit the message
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
     * @param {Number} [content.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
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
     * @param {String} token The token of the webhook
     * @param {Object} options Webhook message edit options
     * @param {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
     * @param {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
     * @param {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {String} content.attachments[].id The ID of an attachment (set only when you want to update an attachment)
     * @param {Buffer} content.attachments[].file A buffer containing file data (set only when uploading new files)
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [options.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} [options.content] A content string
     * @param {Array<Object>} [options.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @returns {Promise<Message>}
     */
    editWebhook(token, options) {
        if(!this.webhookID) {
            throw new Error("Message is not a webhook");
        }
        return this.#client.editWebhookMessage.call(this.#client, this.webhookID, token, this.id, options);
    }

    /**
     * Immediately ends a poll associated with this message
     * @returns {Promise<Message>}
     */
    endPoll() {
        return this.#client.endPoll.call(this.#client, this.channel.id, this.id);
    }

    /**
     * Gets a list of users that voted for an answer in a poll
     * @param {Number} answerID The ID of the answer
     * @param {Object} [options] Options for fetching the answer list
     * @param {String} [options.after] Get users after this user ID
     * @param {Number} [options.limit=100] The maximum number of users to get
     * @returns {Promise<Array<User>>}
     */
    getPollAnswerVoters(answerID, options) {
        return this.#client.getPollAnswerVoters.call(this.#client, this.channel.id, this.id, answerID, options);
    }

    /**
     * Get a list of users who reacted with a specific reaction
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @param {Object} [options] Options for the request.
     * @param {Number} [options.limit=100] The maximum number of users to get
     * @param {String} [options.after] Get users after this user ID
     * @param {Number} [options.type=0] The type of reaction to get
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
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
     * @param {String} [userID="@me"] The ID of the user to remove the reaction for
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
     * @param {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
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

/**
 * An object containing the reference to the original message if it is a crossposted message or reply
 * @typedef Message.MessageReference
 * @prop {Number} type The type of the message reference (0 is reply, 1 is forward)
 * @prop {String?} messageID The id of the original message this message was crossposted from
 * @prop {String} channelID The id of the channel this message was crossposted from
 * @prop {String?} guildID The id of the guild this message was crossposted from
 */
/**
 * An object containing info about the interaction the message is responding to, if applicable
 * @typedef Message.InteractionData
 * @prop {String} id The id of the interaction
 * @prop {Number} type The type of interaction
 * @prop {String} name The name of the command
 * @prop {User} user The user who invoked the interaction
 * @prop {Member?} member The member who invoked the interaction
 */
/**
 * An object containing a message snapshot
 * @typedef Message.MessageSnapshot
 * @prop {Message} message The message snapshot. Note that this object contains the minimal subset of message data.
 */
