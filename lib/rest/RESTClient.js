"use strict";

const ApplicationCommand = require("../structures/ApplicationCommand");
const Channel = require("../structures/Channel");
const Endpoints = require("./Endpoints");
const ExtendedUser = require("../structures/ExtendedUser");
const Guild = require("../structures/Guild");
const GuildAuditLogEntry = require("../structures/GuildAuditLogEntry");
const GuildIntegration = require("../structures/GuildIntegration");
const GuildPreview = require("../structures/GuildPreview");
const GuildTemplate = require("../structures/GuildTemplate");
const GuildScheduledEvent = require("../structures/GuildScheduledEvent");
const Invite = require("../structures/Invite");
const Member = require("../structures/Member");
const Message = require("../structures/Message");
const Permission = require("../structures/Permission");
const PrivateChannel = require("../structures/PrivateChannel");
const RequestHandler = require("./RequestHandler");
const Role = require("../structures/Role");
const StageInstance = require("../structures/StageInstance");
const ThreadMember = require("../structures/ThreadMember");
const User = require("../structures/User");
const AutoModerationRule = require("../structures/AutoModerationRule");
const {formatAllowedMentions, processAttachments} = require("../util/util");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch(err) {
    EventEmitter = require("events");
}

/**
 * Represents a class to handle requests.
 */
class RESTClient extends EventEmitter {
    /**
     * Optional client.
     * @type {Client}
     */
    #client;

    /**
     * The request handler.
     * @type {RequestHandler}
     */
    #handler;

    /**
     * Represents a class to handle requests.
     * @arg {Object} options Options for the RESTClient.
     * @arg {Object} [options.agent] The dispatcher to use for undici.
     * @arg {String} [options.baseURL] The base URL to use for API requests.
     * @arg {Client} [options.client] An optional client.
     * @arg {Number} [options.ratelimiterOffset=0] A number of milliseconds to offset the ratelimit timing calculations by.
     * @arg {Number} [options.requestTimeout=15000] A number of milliseconds before requests are considered timed out.
     * @arg {Number} [options.retryLimit=3] The amount of times it will retry to send the request.
     * @arg {String} [options.token] The auth token to use. Bot tokens should be prefixed with `Bot` (e.g. `Bot MTExIHlvdSAgdHJpZWQgMTEx.O5rKAA.dQw4w9WgXcQ_wpV-gGA4PSk_bm8`).
     */
    constructor(options = {}) {
        super();
        if(options.client !== undefined) {
            this.#client = options.client;

            if(options.token === undefined) {
                options.token = this.#client._token;
            }
        }

        this.#handler = new RequestHandler(this, options);
    }

    /**
     * Add a member to a guild
     * @arg {String} guildID The ID of the guild
     * @arg {String} userID The ID of the user
     * @arg {String} accessToken The access token of the user
     * @arg {Object} [options] Options for adding the member
     * @arg {String} [options.nick] The nickname of the member
     * @arg {Array<String>} [options.roles] Array of role IDs to add to the member
     * @arg {Boolean} [options.mute] Whether the member should be muted
     * @arg {Boolean} [options.deaf] Whether the member should be deafened
     * @return {Promise}
     */
    async addGuildMember(guildID, userID, accessToken, options = {}) {
        return this.put(Endpoints.GUILD_MEMBER(guildID, userID), {
            auth: true,
            body: {
                access_token: accessToken,
                deaf: options.deaf,
                mute: options.mute,
                nick: options.nick,
                roles: options.roles
            }
        });
    }

    /**
    * Add a role to a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async addGuildMemberRole(guildID, memberID, roleID, reason) {
        return this.put(Endpoints.GUILD_MEMBER_ROLE(guildID, memberID, roleID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Add a reaction to a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */

    async addMessageReaction(channelID, messageID, reaction) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }

        return this.put(Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, reaction, "@me"), {
            auth: true
        });
    }

    /**
    * Ban a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {Number} [options.deleteMessageSeconds=0] Number of seconds to delete messages for, between 0 and 604800 inclusive
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */

    async banGuildMember(guildID, userID, options) {
        return this.put(Endpoints.GUILD_BAN(guildID, userID), {
            auth: true,
            body: {
                delete_message_seconds: options.deleteMessageSeconds || 0
            },
            reason: options.reason
        });
    }

    /**
    * Edits command permissions for a multiple commands in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} guildID The guild ID
    * @arg {Array<Object>} permissions An array of [partial guild command permissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure)
    * @arg {String} [applicationID] The ID of the application to use. Defaults to client's application ID if provided.
    * @returns {Promise<Array<Object>>} Returns an array of [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) objects.
    */
    async bulkEditCommandPermissions(guildID, permissions, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in bulkEditCommandPermissions()");
        }

        return this.put(Endpoints.GUILD_COMMAND_PERMISSIONS(applicationID, guildID), {
            auth: true,
            body: permissions
        });
    }

    /**
    * Bulk create/edit global application commands
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @arg {String} [applicationID] The ID of the application to use. Defaults to client's application ID if provided.
    * @returns {Promise<ApplicationCommand[]>}
    */
    async bulkEditCommands(commands, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in bulkEditCommands()");
        }

        return this.put(Endpoints.COMMANDS(applicationID), {
            auth: true,
            body: commands.map((command) => ({
                default_member_permissions: command.defaultMemberPermissions?.allow
                    ?? command.defaultMemberPermissions?.toString(),
                description: command.description,
                description_localizations: command.descriptionLocalizations,
                dm_permission: command.dmPermission,
                name: command.type === 1
                    ? command.name?.toLowerCase()
                    : command.name,
                name_localizations: command.nameLocalizations,
                nsfw: command.nsfw,
                options: command.options,
                type: command.type
            }))
        }).then((data) => data.map((c) => new ApplicationCommand(c, this.#client)));
    }
    /**
    * Bulk create/edit guild application commands
    * @arg {String} guildID Guild id to create the commands in
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @returns {ApplicationCommand[]} Resolves with an array of commands objects
    */
    async bulkEditGuildCommands(guildID, commands, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in bulkEditGuildCommands()");
        }

        return this.put(Endpoints.GUILD_COMMANDS(applicationID, guildID), {
            auth: true,
            body: commands.map((command) => ({
                default_member_permissions: command.defaultMemberPermissions?.allow
                    ?? command.defaultMemberPermissions?.toString(),
                description: command.description,
                description_localizations: command.descriptionLocalizations,
                dm_permission: command.dmPermission,
                id: command.id,
                name: command.type === 1
                    ? command.name?.toLowerCase()
                    : command.name,
                name_localizations: command.nameLocalizations,
                nsfw: command.nsfw,
                options: command.options,
                type: command.type
            }))
        }).then((data) => data.map((c) => new ApplicationCommand(c, this.#client)));
    }

    /**
     * Create an auto moderation rule
     * @arg {String} guildID the ID of the guild to create the rule in
     * @arg {Object} options The rule to create
     * @arg {Object[]} options.actions The [actions](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object) done when the rule is violated
     * @arg {Boolean} [options.enabled=false] If the rule is enabled, false by default
     * @arg {Number} options.eventType The [event type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types) for the rule
     * @arg {String[]} [options.exemptChannels] Any channels where this rule does not apply
     * @arg {String[]} [options.exemptRoles] Any roles to which this rule does not apply
     * @arg {String} options.name The name of the rule
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @arg {Object} [options.triggerMetadata] The [trigger metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) for the rule
     * @arg {Number} options.triggerType The [trigger type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types) of the rule
     * @returns {Promise<AutoModerationRule>}
     */
    async createAutoModerationRule(guildID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.AUTO_MODERATION_RULES(guildID), {
            auth: true,
            body: {
                actions: options.actions,
                enabled: options.enabled,
                event_type: options.eventType,
                exempt_channels: options.exemptChannels,
                exempt_roles: options.exemptRoles,
                name: options.name,
                trigger_metadata: options.triggerMetadata,
                trigger_type: options.triggerType
            },
            reason: options.reason
        }).then((rule) => new AutoModerationRule(rule, this.#client));
    }

    /**
    * Create a channel in a guild
    * @arg {String} guildID The ID of the guild to create the channel in
    * @arg {String} name The name of the channel
    * @arg {String} [type=0] The type of the channel, either 0 (text), 2 (voice), 4 (category), 5 (news), 13 (stage), or 15 (forum)
    * @arg {Object | String} [options] The properties the channel should have.
    * @arg {Array<Object>} [options.availableTags] Available tags for a forum channel
    * @arg {Number} [options.bitrate] The bitrate of the channel (voice channels only)
    * @arg {Number} [options.defaultAutoArchiveDuration] The default duration of newly created threads in minutes to automatically archive the thread after inactivity (60, 1440, 4320, 10080)
    * @arg {Object} [options.defaultReactionEmoji] The emoji to show as the reaction button (forum channels only)
    * @arg {Object} [options.defaultSortOrder] The default thread sorting order
    * @arg {Boolean} [options.nsfw] The nsfw status of the channel
    * @arg {String?} [options.parentID] The ID of the parent category channel for this channel
    * @arg {Array<Object>} [options.permissionOverwrites] An array containing permission overwrite objects
    * @arg {Number} [options.position] The sorting position of the channel
    * @arg {Number} [options.rateLimitPerUser] The time in seconds a user has to wait before sending another message (does not affect bots or users with manageMessages/manageChannel permissions) (text channels only)
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @arg {String} [options.rtcRegion] The RTC region ID of the channel (automatic if `null`) (voice channels only)
    * @arg {String} [options.topic] The topic of the channel (text channels only)
    * @arg {Number} [options.userLimit] The channel user limit (voice channels only)
    * @arg {Number} [options.videoQualityMode] The camera video quality mode of the voice channel (voice channels only). `1` is auto, `2` is 720p
    * @returns {Promise<CategoryChannel | ForumChannel | TextChannel | TextVoiceChannel>}
    */
    async createChannel(guildID, name, type, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.GUILD_CHANNELS(guildID), {
            auth: true,
            body: {
                available_tags: options.availableTags?.map((tag) => ({
                    emoji_id: tag.emojiID,
                    emoji_name: tag.emojiName,
                    id: tag.id,
                    moderated: tag.moderated,
                    name: tag.name
                })),
                bitrate: options.bitrate,
                default_auto_archive_duration: options.defaultAutoArchiveDuration,
                default_reaction_emoji: options.defaultReactionEmoji && {
                    emoji_id: options.defaultReactionEmoji.emojiID,
                    emoji_name: options.defaultReactionEmoji.emojiName
                },
                default_sort_order: options.defaultSortOrder,
                name: name,
                nsfw: options.nsfw,
                parent_id: options.parentID,
                permission_overwrites: options.permissionOverwrites,
                position: options.position,
                rate_limit_per_user: options.rateLimitPerUser,
                rtc_region: options.rtcRegion,
                topic: options.topic,
                type: type,
                user_limit: options.userLimit,
                video_quality_mode: options.videoQualityMode
            },
            reason: options.reason
        }).then((channel) => Channel.from(channel, this.#client));
    }

    /**
    * Create an invite for a channel
    * @arg {String} channelID The ID of the channel
    * @arg {Object} [options] Invite generation options
    * @arg {Number} [options.maxAge] How long the invite should last in seconds
    * @arg {Number} [options.maxUses] How many uses the invite should last for
    * @arg {String} [options.targetApplicationID] The target application id
    * @arg {Number} [options.targetType] The type of the target application
    * @arg {String} [options.targetUserID] The ID of the user whose stream should be displayed for the invite (`options.targetType` must be `1`)
    * @arg {Boolean} [options.temporary] Whether the invite grants temporary membership or not
    * @arg {Boolean} [options.unique] Whether the invite is unique or not
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Invite>}
    */
    async createChannelInvite(channelID, options = {}, reason) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.CHANNEL_INVITES(channelID), {
            auth: true,
            body: {
                max_age: options.maxAge,
                max_uses: options.maxUses,
                target_application_id: options.targetApplicationID,
                target_type: options.targetType,
                target_user_id: options.targetUserID,
                temporary: options.temporary,
                unique: options.unique
            },
            reason: reason
        }).then((invite) => new Invite(invite, this.#client));
    }

    /**
    * Create a channel webhook
    * @arg {String} channelID The ID of the channel to create the webhook in
    * @arg {Object} options Webhook options
    * @arg {String} options.name The default name
    * @arg {String?} [options.avatar] The default avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} Resolves with a webhook object
    */
    async createChannelWebhook(channelID, options, reason) {
        return this.post(Endpoints.CHANNEL_WEBHOOKS(channelID), {
            auth: true,
            body: options,
            reason: reason
        });
    }

    /**
    * Create a global application command
    * @arg {Object} command A command object
    * @arg {String} command.name The command name
    * @arg {Number} command.type The [type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types) of command
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Boolean} [command.nsfw] Whether this command is age-restricted or not
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {BigInt | Number | String | Permission} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @arg {Boolean} [command.dmPermission=true] If this command can be used in direct messages
    * @returns {Promise<ApplicationCommand>}
    */
    async createCommand(command, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in createCommand()");
        }

        return this.post(Endpoints.COMMANDS(applicationID), {
            auth: true,
            body: {
                default_member_permissions: command.defaultMemberPermissions?.allow
                    ?? command.defaultMemberPermissions?.toString(),
                description: command.description,
                description_localizations: command.descriptionLocalizations,
                dm_permission: command.dmPermission,
                name: command.type === 1
                    ? command.name?.toLowerCase()
                    : command.name,
                name_localizations: command.nameLocalizations,
                nsfw: command.nsfw,
                options: command.options,
                type: command.type
            }
        }).then((data) => new ApplicationCommand(data, this.#client));
    }

    /**
    * Create a guild
    * @arg {String} name The name of the guild
    * @arg {Object} options The properties of the guild
    * @arg {String} [options.afkChannelID] The ID of the AFK voice channel
    * @arg {Number} [options.afkTimeout] The AFK timeout in seconds
    * @arg {Array<Object>} [options.channels] The new channels of the guild. IDs are placeholders which allow use of category channels.
    * @arg {Number} [options.defaultNotifications] The default notification settings for the guild. 0 is "All Messages", 1 is "Only @mentions".
    * @arg {Number} [options.explicitContentFilter] The level of the explicit content filter for messages/images in the guild. 0 disables message scanning, 1 enables scanning the messages of members without roles, 2 enables scanning for all messages.
    * @arg {String} [options.icon] The guild icon as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @arg {Array<Object>} [options.roles] The new roles of the guild, the first one is the @everyone role. IDs are placeholders which allow channel overwrites.
    * @arg {Number} [options.systemChannelFlags] The system channel flags
    * @arg {String} [options.systemChannelID] The ID of the system channel
    * @arg {Number} [options.verificationLevel] The guild verification level
    * @returns {Promise<Guild>}
    */
    async createGuild(name, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.GUILDS, {
            auth: true,
            body: {
                afk_channel_id: options.afkChannelID,
                afk_timeout: options.afkTimeout,
                channels: options.channels,
                default_message_notifications: options.defaultNotifications,
                explicit_content_filter: options.explicitContentFilter,
                icon: options.icon,
                name: name,
                roles: options.roles,
                system_channel_flags: options.systemChannelFlags,
                system_channel_id: options.systemChannelID,
                verification_level: options.verificationLevel
            }
        }).then((guild) => new Guild(guild, this.#client));
    }

    /**
    * Create a guild application command
    * @arg {String} guildID The ID of the guild to create the command in
    * @arg {Object} command A command object
    * @arg {String} command.name The command name
    * @arg {Number} command.type The [type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types) of command
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Boolean} [command.nsfw] Whether this command is age-restricted or not
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {BigInt | Number | String | Permission} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @returns {Promise<ApplicationCommand>}
    */
    async createGuildCommand(guildID, command, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in createCommand()");
        }

        return this.post(Endpoints.GUILD_COMMANDS(applicationID, guildID), {
            auth: true,
            body: {
                default_member_permissions: command.defaultMemberPermissions?.allow
                    ?? command.defaultMemberPermissions?.toString(),
                description: command.description,
                description_localizations: command.descriptionLocalizations,
                dm_permission: command.dmPermission,
                name: command.type === 1
                    ? command.name?.toLowerCase()
                    : command.name,
                name_localizations: command.nameLocalizations,
                nsfw: command.nsfw,
                options: command.options,
                type: command.type
            }
        }).then((data) => new ApplicationCommand(data, this.#client));
    }

    /**
    * Create a guild emoji object
    * @arg {String} guildID The ID of the guild to create the emoji in
    * @arg {Object} options Emoji options
    * @arg {String} options.image The base 64 encoded string
    * @arg {String} options.name The name of emoji
    * @arg {Array} [options.roles] An array containing authorized role IDs
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} A guild emoji object
    */
    async createGuildEmoji(guildID, options, reason) {
        return this.post(Endpoints.GUILD_EMOJIS(guildID), {
            auth: true,
            body: options,
            reason: reason
        });
    }

    /**
    * Create a guild based on a template. This can only be used with bots in less than 10 guilds
    * @arg {String} code The template code
    * @arg {String} name The name of the guild
    * @arg {String} [icon] The 128x128 icon as a base64 data URI
    * @returns {Promise<Guild>}
    */
    async createGuildFromTemplate(code, name, icon) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.GUILD_TEMPLATE(code), {
            auth: true,
            body: {
                name,
                icon
            }
        }).then((guild) => new Guild(guild, this.#client));
    }

    /**
    * Create a guild scheduled event
    * @arg {String} guildID The guild ID where the event will be created
    * @arg {Object} event The event to be created
    * @arg {String} [event.channelID] The channel ID of the event. This is optional if `entityType` is `3` (external)
    * @arg {String} [event.description] The description of the event
    * @arg {Object} [event.entityMetadata] The entity metadata for the scheduled event. This is required if `entityType` is `3` (external)
    * @arg {String} [event.entityMetadata.location] Location of the event
    * @arg {Number} event.entityType The [entity type](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types) of the scheduled event
    * @arg {String} [event.image] Base 64 encoded image for the scheduled event
    * @arg {String} event.name The name of the event
    * @arg {String} event.privacyLevel The privacy level of the event
    * @arg {Date} [event.scheduledEndTime] The time when the event is scheduled to end. This is required if `entityType` is `3` (external)
    * @arg {Date} event.scheduledStartTime The time the event will start
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<GuildScheduledEvent>}
    */
    async createGuildScheduledEvent(guildID, event, reason) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.GUILD_SCHEDULED_EVENTS(guildID), {
            auth: true,
            body: {
                channel_id: event.channelID,
                description: event.description,
                entity_metadata: event.entityMetadata,
                entity_type: event.entityType,
                image: event.image,
                name: event.name,
                privacy_level: event.privacyLevel,
                scheduled_end_time: event.scheduledEndTime,
                scheduled_start_time: event.scheduledStartTime
            },
            reason: reason
        }).then((data) => new GuildScheduledEvent(data, this.#client));
    }

    /**
    * Create a guild sticker
    * @arg {String} guildID The guild to create a sticker in
    * @arg {Object} options Sticker options
    * @arg {String} options.description The description of the sticker
    * @arg {Object} options.file A file object
    * @arg {Buffer} options.file.file A buffer containing file data
    * @arg {String} options.file.name What to name the file
    * @arg {String} options.name The name of the sticker
    * @arg {String} options.tags The Discord name of a unicode emoji representing the sticker's expression
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} A sticker object
    */
    async createGuildSticker(guildID, options, reason) {
        return this.post(Endpoints.GUILD_STICKERS(guildID), {
            auth: true,
            body: {
                description: options.description,
                name: options.name,
                tags: options.tags
            },
            files: [options.file],
            formData: true,
            reason: reason
        });
    }

    /**
    * Create a template for a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} name The name of the template
    * @arg {String} [description] The description for the template
    * @returns {Promise<GuildTemplate>}
    */
    async createGuildTemplate(guildID, name, description) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.GUILD_TEMPLATES(guildID), {
            auth: true,
            body: {
                name,
                description
            }
        }).then((template) => new GuildTemplate(template, this.#client));
    }

    /**
    * Respond to the interaction with a message
    * Note: Use webhooks if you have already responded with an interaction response.
    * @arg {String} interactionID The interaction ID.
    * @arg {String} interactionToken The interaction Token.
    * @arg {Object} options The options object.
    * @arg {Object} [options.data] The data to send with the response. **WARNING: This call expects raw API data and does not transform it in any way.**
    * @arg {Number} options.type The response type to send. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type) for valid types
    * @arg {Object | Array<Object>} [file] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise}
    */
    async createInteractionResponse(interactionID, interactionToken, options, file) {
        return this.post(Endpoints.INTERACTION_RESPOND(interactionID, interactionToken), {
            auth: true,
            body: options,
            files: file
        });
    }

    /**
    * Create a message in a channel
    * Note: If you want to DM someone, the user ID is **not** the DM channel ID. use Client.getDMChannel() to get the DM channel for a user
    * @arg {String} channelID The ID of the channel
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
    * @arg {Number} [content.flags] Message flags. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {Object} [content.messageReference] The message reference, used when replying to messages
    * @arg {String} [content.messageReference.channelID] The channel ID of the referenced message
    * @arg {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
    * @arg {String} [content.messageReference.guildID] The guild ID of the referenced message
    * @arg {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
    * @arg {Array<String>} [content.stickerIDs] An array of IDs corresponding to stickers to send
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise<Message>}
    */
    async createMessage(channelID, content) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
            content.allowed_mentions = formatAllowedMentions(content.allowedMentions ?? this.#client.options.allowedMentions);
            content.sticker_ids = content.stickerIDs;
            if(content.messageReference) {
                content.message_reference = content.messageReference;
                if(content.messageReference.messageID !== undefined) {
                    content.message_reference.message_id = content.messageReference.messageID;
                    content.messageReference.messageID = undefined;
                }
                if(content.messageReference.channelID !== undefined) {
                    content.message_reference.channel_id = content.messageReference.channelID;
                    content.messageReference.channelID = undefined;
                }
                if(content.messageReference.guildID !== undefined) {
                    content.message_reference.guild_id = content.messageReference.guildID;
                    content.messageReference.guildID = undefined;
                }
                if(content.messageReference.failIfNotExists !== undefined) {
                    content.message_reference.fail_if_not_exists = content.messageReference.failIfNotExists;
                    content.messageReference.failIfNotExists = undefined;
                }
            }
        }

        const {files, attachments} = processAttachments(content.attachments);
        content.attachments = attachments;

        return this.post(Endpoints.CHANNEL_MESSAGES(channelID), {
            auth: true,
            body: content,
            files: files
        }).then((message) => new Message(message, this.#client));
    }

    /**
    * Create a guild role
    * @arg {String} guildID The ID of the guild to create the role in
    * @arg {Object | Role} [options] An object or Role containing the properties to set
    * @arg {Number} [options.color] The hex color of the role, in number form (ex: 0x3d15b3 or 4040115)
    * @arg {Boolean} [options.hoist] Whether to hoist the role in the user list or not
    * @arg {String} [options.icon] The role icon as a base64 data URI
    * @arg {Boolean} [options.mentionable] Whether the role is mentionable or not
    * @arg {String} [options.name] The name of the role
    * @arg {BigInt | Number | String | Permission} [options.permissions] The role permissions
    * @arg {String} [options.unicodeEmoji] The role's unicode emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Role>}
    */
    async createRole(guildID, options, reason) {
        if(options.permissions !== undefined) {
            options.permissions = options.permissions instanceof Permission ? String(options.permissions.allow) : String(options.permissions);
        }
        return this.post(Endpoints.GUILD_ROLES(guildID), {
            auth: true,
            body: {
                name: options.name,
                permissions: options.permissions,
                color: options.color,
                hoist: options.hoist,
                icon: options.icon,
                mentionable: options.mentionable,
                unicode_emoji: options.unicodeEmoji
            },
            reason: reason
        }).then((role) => {
            const guild = this.#client?.guilds.get(guildID);
            if(guild) {
                return guild.roles.add(role, guild);
            } else {
                return new Role(role);
            }
        });
    }

    /**
    * Create a stage instance
    * @arg {String} channelID The ID of the stage channel to create the instance in
    * @arg {Object} options The stage instance options
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
    * @arg {Boolean} [options.sendStartNotification] Whether to notify @everyone that a stage instance has started or not
    * @arg {String} options.topic The stage instance topic
    * @returns {Promise<StageInstance>}
    */
    async createStageInstance(channelID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.STAGE_INSTANCES, {
            auth: true,
            body: {
                channel_id: channelID,
                privacy_level: options.privacyLevel,
                send_start_notification: options.sendStartNotification,
                topic: options.topic
            }
        }).then((instance) => new StageInstance(instance, this.#client));
    }

    /**
    * Create a thread in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {Object} options The thread options
    * @arg {Number} [options.autoArchiveDuration] Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
    * @arg {Array<String>} [options.appliedTags] The tags to apply to the thread (available only for threads created in a `GUILD_FORUM` channel)
    * @arg {Boolean} [options.invitable] Whether non-moderators can add other non-moderators to the thread (private threads only)
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
    * @arg {String} options.name The thread channel name
    * @arg {Number} [options.type] The channel type of the thread to create. It is recommended to explicitly set this property as this will be a required property in API v10
    * @arg {Number} [options.rateLimitPerUser] The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
    * @returns {Promise<ThreadChannel>}
    */
    async createThread(channelID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const {files, attachments} = options.message ? processAttachments(options.message.attachments) : {};
        if(options.message) {
            options.message.attachments = attachments;
            if(options.message.content !== undefined && typeof options.message.content !== "string") {
                options.message.content = "" + options.message.content;
            }
            options.message.allowed_mentions = formatAllowedMentions(options.message.allowedMentions ?? this.#client.options.allowedMentions);
            options.message.sticker_ids = options.message.stickerIDs;
        }

        return this.post(Endpoints.THREAD_WITHOUT_MESSAGE(channelID), {
            auth: true,
            body: {
                auto_archive_duration: options.autoArchiveDuration,
                applied_tags: options.appliedTags,
                invitable: options.invitable,
                message: options.message,
                name: options.name,
                type: options.type,
                rate_limit_per_user: options.rateLimitPerUser
            },
            files: files
        }).then((channel) => Channel.from(channel, this.#client));
    }

    /**
    * Create a thread with an existing message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message to create the thread from
    * @arg {Object} options The thread options
    * @arg {Number} [options.autoArchiveDuration] Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
    * @arg {String} options.name The thread channel name
    * @arg {Number} [options.rateLimitPerUser] The ratelimit of the channel, in seconds. 0 means no ratelimit is enabled
    * @returns {Promise<NewsThreadChannel | PublicThreadChannel>}
    */
    async createThreadWithMessage(channelID, messageID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.THREAD_WITH_MESSAGE(channelID, messageID), {
            auth: true,
            body: {
                name: options.name,
                auto_archive_duration: options.autoArchiveDuration,
                rate_limit_per_user: options.rateLimitPerUser
            }
        }).then((channel) => Channel.from(channel, this.#client));
    }

    /**
     * Crosspost (publish) a message to subscribed channels
     * @arg {String} channelID The ID of the NewsChannel
     * @arg {String} messageID The ID of the message
     * @returns {Promise<Message>}
     */
    async crosspostMessage(channelID, messageID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.CHANNEL_CROSSPOST(channelID, messageID), {
            auth: true
        }).then((message) => new Message(message, this.#client));
    }

    /**
     * Makes a DELETE request to the API.
     * @arg path The endpoint to make the request to.
     * @arg options Data regarding the request.
     * @returns Resolves with the returned JSON data.
     */
    async delete(path, options) {
        return this.#handler.request("DELETE", path, options);
    }

    /**
     * Delete an auto moderation rule
     * @arg {String} guildID The guildID to delete the rule from
     * @arg {String} ruleID The ID of the rule to delete
     * @arg {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    async deleteAutoModerationRule(guildID, ruleID, reason) {
        return this.delete(Endpoints.AUTO_MODERATION_RULE(guildID, ruleID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a guild channel, or leave a private channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteChannel(channelID, reason) {
        return this.delete(Endpoints.CHANNEL(channelID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a channel permission overwrite
    * @arg {String} channelID The ID of the channel
    * @arg {String} overwriteID The ID of the overwritten user or role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteChannelPermission(channelID, overwriteID, reason) {
        return this.delete(Endpoints.CHANNEL_PERMISSION(channelID, overwriteID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a global application command
    * @arg {String} commandID The command id
    * @returns {Promise}
    */
    async deleteCommand(commandID, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in deleteCommand()");
        }

        return this.delete(Endpoints.COMMAND(applicationID, commandID), {
            auth: true
        });
    }

    /**
    * Delete a guild (bot user must be owner)
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    */
    async deleteGuild(guildID) {
        return this.delete(Endpoints.GUILD(guildID), {
            auth: true
        });
    }

    /**
    * Delete a guild application command
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @returns {Promise}
    */
    async deleteGuildCommand(guildID, commandID, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in deleteGuildCommand()");
        }

        return this.delete(Endpoints.GUILD_COMMAND(applicationID, guildID, commandID), {
            auth: true
        });
    }

    /**
    * Delete a guild emoji object
    * @arg {String} guildID The ID of the guild to delete the emoji in
    * @arg {String} emojiID The ID of the emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteGuildEmoji(guildID, emojiID, reason) {
        return this.delete(Endpoints.GUILD_EMOJI(guildID, emojiID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a guild integration
    * @arg {String} guildID The ID of the guild
    * @arg {String} integrationID The ID of the integration
    * @returns {Promise}
    */
    async deleteGuildIntegration(guildID, integrationID) {
        return this.delete(Endpoints.GUILD_INTEGRATION(guildID, integrationID), {
            auth: true
        });
    }

    /**
    * Delete a guild scheduled event
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the event
    * @returns {Promise}
    */
    async deleteGuildScheduledEvent(guildID, eventID) {
        return this.delete(Endpoints.GUILD_SCHEDULED_EVENT(guildID, eventID), {
            auth: true
        });
    }

    /**
    * Delete a guild sticker
    * @arg {String} guildID The ID of the guild
    * @arg {String} stickerID The ID of the sticker
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteGuildSticker(guildID, stickerID, reason) {
        return this.delete(Endpoints.GUILD_STICKER(guildID, stickerID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a guild template
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    async deleteGuildTemplate(guildID, code) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.delete(Endpoints.GUILD_TEMPLATE_GUILD(guildID, code), {
            auth: true
        }).then((template) => new GuildTemplate(template, this.#client));
    }

    /**
    * Delete an invite
    * @arg {String} inviteID The ID of the invite
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteInvite(inviteID, reason) {
        return this.delete(Endpoints.INVITE(inviteID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteMessage(channelID, messageID, reason) {
        return this.delete(Endpoints.CHANNEL_MESSAGE(channelID, messageID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Bulk delete messages
    * @arg {String} channelID The ID of the channel
    * @arg {Array<String>} messageIDs Array of message IDs to delete
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteMessages(channelID, messageIDs, reason) {
        const oldestAllowedSnowflake = (Date.now() - 1421280000000) << 22;
        const invalidMessage = messageIDs.find((messageID) => messageID < oldestAllowedSnowflake);
        if(invalidMessage) {
            throw new Error(`Message ${invalidMessage} is more than 2 weeks old.`);
        }

        while(messageIDs.length) {
            if(messageIDs.length === 1) {
                return this.deleteMessage(channelID, messageIDs[0], reason);
            }

            const chunk = messageIDs.splice(0, 100);
            await this.post(Endpoints.CHANNEL_BULK_DELETE(channelID), {
                auth: true,
                body: {
                    messages: chunk,
                    reason: reason
                }
            });
        }
    }

    /**
    * Delete a guild role
    * @arg {String} guildID The ID of the guild to create the role in
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteRole(guildID, roleID, reason) {
        return this.delete(Endpoints.GUILD_ROLE(guildID, roleID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Delete a stage instance
    * @arg {String} channelID The stage channel associated with the instance
    * @returns {Promise}
    */
    async deleteStageInstance(channelID) {
        return this.delete(Endpoints.STAGE_INSTANCE(channelID), {
            auth: true
        });
    }

    /**
    * Delete a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async deleteWebhook(webhookID, token, reason) {
        return this.delete(token ? Endpoints.WEBHOOK_TOKEN(webhookID, token) : Endpoints.WEBHOOK(webhookID), {
            auth: !token,
            reason: reason
        });
    }

    /**
    * Delete a webhook message
    * @arg {String} webhookID
    * @arg {String} token
    * @arg {String} messageID
    * @returns {Promise}
    */
    async deleteWebhookMessage(webhookID, token, messageID) {
        return this.delete(Endpoints.WEBHOOK_MESSAGE(webhookID, token, messageID), {
            auth: true
        });
    }

    /**
     * Edit an existing auto moderation rule
     * @arg {String} guildID the ID of the guild to edit the rule in
     * @arg {String} ruleID The ID of the rule to edit
     * @arg {Object} options The new rule options
     * @arg {Object[]} [options.actions] The [actions](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object) done when the rule is violated
     * @arg {Boolean} [options.enabled=false] If the rule is enabled, false by default
     * @arg {Number} [options.eventType] The [event type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types) for the rule
     * @arg {String[]} [options.exemptChannels] Any channels where this rule does not apply
     * @arg {String[]} [options.exemptRoles] Any roles to which this rule does not apply
     * @arg {String} [options.name] The name of the rule
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @arg {Object} [options.triggerMetadata] The [trigger metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) for the rule
     * @returns {Promise<AutoModerationRule>}
     */
    async editAutoModerationRule(guildID, ruleID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.AUTO_MODERATION_RULE(guildID, ruleID), {
            auth: true,
            body: {
                actions: options.actions,
                enabled: options.enabled,
                event_type: options.eventType,
                exempt_channels: options.exemptChannels,
                exempt_roles: options.exemptRoles,
                name: options.name,
                trigger_metadata: options.triggerMetadata
            },
            reason: options.reason
        }).then((rule) => new AutoModerationRule(rule, this.#client));
    }

    /**
    * Edit a channel's properties
    * @arg {String} channelID The ID of the channel
    * @arg {Object} options The properties to edit
    * @arg {Boolean} [options.archived] The archive status of the channel (thread channels only)
    * @arg {Array<String>} [options.appliedTags] An array of applied tag IDs for the thread (available in `GUILD_FORUM` threads only)
    * @arg {Number} [options.autoArchiveDuration] The duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080 (thread channels only)
    * @arg {Array<Object>} [options.availableTags] Available tags for a forum channel
    * @arg {Number} [options.bitrate] The bitrate of the channel (guild voice channels only)
    * @arg {Number?} [options.defaultAutoArchiveDuration] The default duration of newly created threads in minutes to automatically archive the thread after inactivity (60, 1440, 4320, 10080) (guild text/news channels only)
    * @arg {Number} [options.defaultForumLayout] The default forum layout view used to display forum posts
    * @arg {Object} [options.defaultReactionEmoji] The emoji to show as the reaction button (forum channels only)
    * @arg {Number} [options.defaultSortOrder] The default thread sorting order
    * @arg {Number} [options.defaultThreadRateLimitPerUser] The initial ratelimit of the channel to use on newly created threads, in seconds. 0 means no ratelimit is enabled
    * @arg {Number} [options.flags] The channel flags
    * @arg {Boolean} [options.invitable] Whether non-moderators can add other non-moderators to the channel (private thread channels only)
    * @arg {Boolean} [options.locked] The lock status of the channel (thread channels only)
    * @arg {String} [options.name] The name of the channel
    * @arg {Boolean} [options.nsfw] The nsfw status of the channel (guild channels only)
    * @arg {String?} [options.parentID] The ID of the parent channel category for this channel (guild text/voice channels only)
    * @arg {Array<Object>} [options.permissionOverwrites] An array containing permission overwrite objects
    * @arg {Number} [options.position] The sorting position of the channel (guild channels only)
    * @arg {Number} [options.rateLimitPerUser] The time in seconds a user has to wait before sending another message (does not affect bots or users with manageMessages/manageChannel permissions) (guild text and thread channels only)
    * @arg {String?} [options.rtcRegion] The RTC region ID of the channel (automatic if `null`) (guild voice channels only)
    * @arg {String} [options.topic] The topic of the channel (guild text channels only)
    * @arg {Number} [options.userLimit] The channel user limit (guild voice channels only)
    * @arg {Number} [options.videoQualityMode] The camera video quality mode of the channel (guild voice channels only). `1` is auto, `2` is 720p
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<CategoryChannel | ForumChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>}
    */
    async editChannel(channelID, options, reason) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.CHANNEL(channelID), {
            auth: true,
            body: {
                archived: options.archived,
                auto_archive_duration: options.autoArchiveDuration,
                available_tags: options.availableTags?.map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                    moderated: tag.moderated,
                    emoji_id: tag.emojiID,
                    emoji_name: tag.emojiName
                })),
                applied_tags: options.appliedTags,
                bitrate: options.bitrate,
                default_auto_archive_duration: options.defaultAutoArchiveDuration,
                default_forum_layout: options.defaultForumLayout,
                default_reaction_emoji: options.defaultReactionEmoji && {
                    emoji_id: options.defaultReactionEmoji.emojiID,
                    emoji_name: options.defaultReactionEmoji.emojiName
                },
                default_sort_order: options.defaultSortOrder,
                default_thread_rate_limit_per_user: options.defaultThreadRateLimitPerUser,
                flags: options.flags,
                icon: options.icon,
                invitable: options.invitable,
                locked: options.locked,
                name: options.name,
                nsfw: options.nsfw,
                owner_id: options.ownerID,
                parent_id: options.parentID,
                position: options.position,
                rate_limit_per_user: options.rateLimitPerUser,
                rtc_region: options.rtcRegion,
                topic: options.topic,
                user_limit: options.userLimit,
                video_quality_mode: options.videoQualityMode,
                permission_overwrites: options.permissionOverwrites
            },
            reason: reason
        }).then((channel) => Channel.from(channel, this.#client));
    }

    /**
    * Create a channel permission overwrite
    * @arg {String} channelID The ID of channel
    * @arg {String} overwriteID The ID of the overwritten user or role (everyone role ID = guild ID)
    * @arg {BigInt} allow The permissions number for allowed permissions
    * @arg {BigInt} deny The permissions number for denied permissions
    * @arg {Number} type The object type of the overwrite, either 1 for "member" or 0 for "role"
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async editChannelPermission(channelID, overwriteID, allow, deny, type, reason) {
        if(typeof type === "string") { // backward compatibility
            type = type === "member" ? 1 : 0;
        }

        return this.put(Endpoints.CHANNEL_PERMISSION(channelID, overwriteID), {
            auth: true,
            body: {
                allow,
                deny,
                type,
                reason
            }
        });
    }

    /**
    * Edit a guild channel's position. Note that channel position numbers are grouped by type (category, text, voice), then sorted in ascending order (lowest number is on top).
    * @arg {String} channelID The ID of the channel
    * @arg {Number} position The new position of the channel
    * @arg {Object} [options] Additional options when editing position
    * @arg {Boolean} [options.lockPermissions] Whether to sync the channel's permissions with the new parent, if changing parents
    * @arg {String} [options.parentID] The new parent ID (category channel) for the channel that is moved
    * @returns {Promise}
    */
    async editChannelPosition(channelID, position, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const channels = this.#client.guilds.get(this.#client.channelGuildMap[channelID]).channels;
        const channel = channels.get(channelID);
        if(!channel) {
            throw new Error(`Channel ${channelID} not found`);
        }

        if(channel.position === position) {
            return;
        }

        const min = Math.min(position, channel.position);
        const max = Math.max(position, channel.position);

        const filteredChannels = channels.filter((chan) => {
            return chan.type === channel.type
                && min <= chan.position
                && chan.position <= max
                && chan.id !== channelID;
        }).sort((a, b) => a.position - b.position);

        if(position > channel.position) {
            filteredChannels.push(channel);
        } else {
            filteredChannels.unshift(channel);
        }

        return this.patch(Endpoints.GUILD_CHANNELS(this.#client.channelGuildMap[channelID]), {
            auth: true,
            body: filteredChannels.map((channel, index) => ({
                id: channel.id,
                lock_permissions: options.lockPermissions,
                parent_id: options.parentID,
                position: index + min
            }))
        });
    }

    /**
    * Edit multiple guild channels' positions. Note that channel position numbers are grouped by type (category, text, voice), then sorted in ascending order (lowest number is on top).
    * @arg {String} guildID The ID of the guild
    * @arg {Array<Object>} channelPositions An array of [ChannelPosition](https://discord.com/developers/docs/resources/guild#modify-guild-channel-positions)
    * @arg {String} channelPositions[].id The ID of the channel
    * @arg {Number} channelPositions[].position The new position of the channel
    * @arg {Boolean} [channelPositions[].lockPermissions] Whether to sync the channel's permissions with the new parent, if changing parents
    * @arg {String} [channelPositions[].parentID] The new parent ID (category channel) for the channel that is moved. For each request, only one channel can change parents
    * @returns {Promise}
    */
    async editChannelPositions(guildID, channelPositions) {
        return this.patch(Endpoints.GUILD_CHANNELS(guildID), {
            auth: true,
            body: channelPositions.map((channelPosition) => ({
                id: channelPosition.id,
                lock_permissions: channelPosition.lockPermissions,
                parent_id: channelPosition.parentID,
                position: channelPosition.position
            }))
        });
    }

    /**
    * Edit a global application command
    * @arg {String} commandID The command id
    * @arg {Object} command A command object
    * @arg {String} [command.name] The command name
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {bigint | number | string | Permission} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @arg {String} [command.defaultMemberPermissions] The [permissions](https://discord.com/developers/docs/topics/permissions) required by default for this command to be usable
    * @arg {Boolean} [command.dmPermission] If this command can be used in direct messages
    * @returns {Promise<ApplicationCommand>}
    */
    async editCommand(commandID, command, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in editCommand()");
        }

        return this.patch(Endpoints.COMMAND(applicationID, commandID), {
            auth: true,
            body: {
                default_member_permissions: command.defaultMemberPermissions?.allow
                    ?? command.defaultMemberPermissions?.toString(),
                description: command.description,
                description_localizations: command.descriptionLocalizations,
                dm_permission: command.dmPermission,
                name: command.type === 1
                    ? command.name?.toLowerCase()
                    : command.name,
                name_localizations: command.nameLocalizations,
                nsfw: command.nsfw,
                options: command.options,
                type: command.type
            }
        }).then((data) => new ApplicationCommand(data, this.#client));
    }

    /**
    * Edits command permissions for a specific command in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @arg {Array<Object>} permissions An array of [permissions objects](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-structure)
    * @returns {Promise<Object>} Resolves with a [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) object.
    */
    async editCommandPermissions(guildID, commandID, permissions, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in editCommandPermissions()");
        }

        return this.put(Endpoints.COMMAND_PERMISSIONS(applicationID, guildID, commandID), {
            auth: true,
            body: permissions
        });
    }

    /**
    * Edit a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Object} options The properties to edit
    * @arg {String} [options.afkChannelID] The ID of the AFK voice channel
    * @arg {Number} [options.afkTimeout] The AFK timeout in seconds
    * @arg {String} [options.banner] The guild banner image as a base64 data URI (VIP only). Note: base64 strings alone are not base64 data URI strings
    * @arg {Number} [options.defaultNotifications] The default notification settings for the guild. 0 is "All Messages", 1 is "Only @mentions".
    * @arg {String} [options.description] The description for the guild (VIP only)
    * @arg {String} [options.discoverySplash] The guild discovery splash image as a base64 data URI (VIP only). Note: base64 strings alone are not base64 data URI strings
    * @arg {Number} [options.explicitContentFilter] The level of the explicit content filter for messages/images in the guild. 0 disables message scanning, 1 enables scanning the messages of members without roles, 2 enables scanning for all messages.
    * @arg {Array<String>} [options.features] The enabled features for the guild. Note that only certain features can be toggled with the API
    * @arg {String} [options.icon] The guild icon as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @arg {String} [options.name] The name of the guild
    * @arg {String} [options.ownerID] The ID of the user to transfer server ownership to (bot user must be owner)
    * @arg {String} [options.preferredLocale] Preferred "COMMUNITY" guild language used in server discovery and notices from Discord, and sent in interactions
    * @arg {Boolean} [options.premiumProgressBarEnabled] If the boost progress bar is enabled
    * @arg {String} [options.publicUpdatesChannelID] The id of the channel where admins and moderators of "COMMUNITY" guilds receive notices from Discord
    * @arg {String} [options.rulesChannelID] The id of the channel where "COMMUNITY" guilds display rules and/or guidelines
    * @arg {String} [options.splash] The guild splash image as a base64 data URI (VIP only). Note: base64 strings alone are not base64 data URI strings
    * @arg {Number} [options.systemChannelFlags] The flags for the system channel
    * @arg {String} [options.systemChannelID] The ID of the system channel
    * @arg {Number} [options.verificationLevel] The guild verification level
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Guild>}
    */
    async editGuild(guildID, options, reason) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.GUILD(guildID), {
            auth: true,
            body: {
                afk_channel_id: options.afkChannelID,
                afk_timeout: options.afkTimeout,
                banner: options.banner,
                default_message_notifications: options.defaultNotifications,
                description: options.description,
                discovery_splash: options.discoverySplash,
                explicit_content_filter: options.explicitContentFilter,
                features: options.features,
                icon: options.icon,
                name: options.name,
                owner_id: options.ownerID,
                preferred_locale: options.preferredLocale,
                premium_progress_bar_enabled: options.premiumProgressBarEnabled,
                public_updates_channel_id: options.publicUpdatesChannelID,
                rules_channel_id: options.rulesChannelID,
                system_channel_id: options.systemChannelID,
                system_channel_flags: options.systemChannelFlags,
                splash: options.splash,
                verification_level: options.verificationLevel
            },
            reason: reason
        }).then((guild) => new Guild(guild, this.#client));
    }

    /**
    * Edit a guild application command
    * @arg {String} guildID The guild ID
    * @arg {Object} command A command object
    * @arg {String} [command.name] The command name
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {bigint | number | string | Permission} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @returns {Promise<ApplicationCommand>}
    */
    async editGuildCommand(guildID, commandID, command, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in editGuildCommand()");
        }

        return this.patch(Endpoints.GUILD_COMMAND(applicationID, guildID, commandID), {
            auth: true,
            body: {
                default_member_permissions: command.defaultMemberPermissions?.allow
                    ?? command.defaultMemberPermissions?.toString(),
                description: command.description,
                description_localizations: command.descriptionLocalizations,
                dm_permission: command.dmPermission,
                name: command.type === 1
                    ? command.name?.toLowerCase()
                    : command.name,
                name_localizations: command.nameLocalizations,
                nsfw: command.nsfw,
                options: command.options,
                type: command.type
            }
        }).then((data) => new ApplicationCommand(data, this.#client));
    }

    /**
    * Edit a guild emoji object
    * @arg {String} guildID The ID of the guild to edit the emoji in
    * @arg {String} emojiID The ID of the emoji you want to modify
    * @arg {Object} options Emoji options
    * @arg {String} [options.name] The name of emoji
    * @arg {Array} [options.roles] An array containing authorized role IDs
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} A guild emoji object
    */
    async editGuildEmoji(guildID, emojiID, options, reason) {
        return this.patch(Endpoints.GUILD_EMOJI(guildID, emojiID), {
            auth: true,
            body: options,
            reason: reason
        });
    }

    /**
    * Edit a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member (you can use "@me" if you are only editing the bot user's nickname)
    * @arg {Object} options The properties to edit
    * @arg {String?} [options.channelID] The ID of the voice channel to move the member to (must be in voice). Set to `null` to disconnect the member
    * @arg {Date?} [options.communicationDisabledUntil] When the user's timeout should expire. Set to `null` to instantly remove timeout
    * @arg {Boolean} [options.deaf] Server deafen the member
    * @arg {Number} [options.flags] The guild member flag bit set
    * @arg {Boolean} [options.mute] Server mute the member
    * @arg {String} [options.nick] Set the member's server nickname, "" to remove
    * @arg {Array<String>} [options.roles] The array of role IDs the member should have
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Member>}
    */
    async editGuildMember(guildID, memberID, options, reason) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.GUILD_MEMBER(guildID, memberID), {
            auth: true,
            body: {
                channel_id: options.channelID,
                communication_disabled_until: options.communicationDisabledUntil,
                deaf: options.deaf,
                flags: options.flags,
                mute: options.mute,
                nick: options.nick,
                roles: options.roles?.filter((roleID, index) => options.roles.indexOf(roleID) === index)
            },
            reason: reason
        }).then((member) => new Member(member, this.#client.guilds.get(guildID), this.#client));
    }

    /**
     * Edits the guild's MFA level. Requires the guild to be owned by the bot user
     * @arg {String} guildID The guild ID to edit the MFA level in
     * @arg {Object} options The options for the request
     * @arg {Number} options.level The new MFA level
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Number>} Returns the new MFA level
     */
    async editGuildMFALevel(guildID, options) {
        return this.post(Endpoints.GUILD_MFA_LEVEL(guildID), {
            auth: true,
            body: options
        }).then((data) => data.level);
    }

    /**
    * Edit a guild scheduled event
    * @arg {String} guildID The guild ID where the event will be edited
    * @arg {String} eventID The guild scheduled event ID to be edited
    * @arg {Object} event The new guild scheduled event object
    * @arg {String} [event.channelID] The channel ID of the event. If updating `entityType` to `3` (external), this **must** be set to `null`
    * @arg {String} [event.description] The description of the event
    * @arg {Object} [event.entityMetadata] The entity metadata for the scheduled event. This is required if updating `entityType` to `3` (external)
    * @arg {String} [event.entityMetadata.location] Location of the event. This is required if updating `entityType` to `3` (external)
    * @arg {Number} [event.entityType] The [entity type](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-types) of the scheduled event
    * @arg {String} [event.image] Base 64 encoded image for the event
    * @arg {String} [event.name] The name of the event
    * @arg {String} [event.privacyLevel] The privacy level of the event
    * @arg {Date} [event.scheduledEndTime] The time when the scheduled event is scheduled to end. This is required if updating `entityType` to `3` (external)
    * @arg {Date} [event.scheduledStartTime] The time the event will start
    * @arg {Number} [event.status] The [status](https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-status) of the scheduled event
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<GuildScheduledEvent>}
    */
    async editGuildScheduledEvent(guildID, eventID, event, reason) {
        return this.patch(Endpoints.GUILD_SCHEDULED_EVENT(guildID, eventID), {
            auth: true,
            body: {
                channel_id: event.channelID,
                description: event.description,
                entity_metadata: event.entityMetadata,
                entity_type: event.entityType,
                image: event.image,
                name: event.name,
                privacy_level: event.privacyLevel,
                scheduled_end_time: event.scheduledEndTime,
                scheduled_start_time: event.scheduledStartTime,
                status: event.status
            },
            reason: reason
        });
    }

    /**
    * Edit a guild sticker
    * @arg {String} stickerID The ID of the sticker
    * @arg {Object} options The properties to edit
    * @arg {String} [options.description] The description of the sticker
    * @arg {String} [options.name] The name of the sticker
    * @arg {String} [options.tags] The Discord name of a unicode emoji representing the sticker's expression
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} A sticker object
    */
    async editGuildSticker(guildID, stickerID, options, reason) {
        return this.patch(Endpoints.GUILD_STICKER(guildID, stickerID), {
            auth: true,
            body: options,
            reason: reason
        });
    }

    /**
    * Edit a guild template
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @arg {Object} options The properties to edit
    * @arg {String} [options.name] The name of the template
    * @arg {String?} [options.description] The description for the template. Set to `null` to remove the description
    * @returns {Promise<GuildTemplate>}
    */
    async editGuildTemplate(guildID, code, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.GUILD_TEMPLATE_GUILD(guildID, code), {
            auth: true,
            body: options
        }).then((template) => new GuildTemplate(template, this.#client));
    }

    /**
    * Update a user's voice state - See [caveats](https://discord.com/developers/docs/resources/guild#modify-user-voice-state-caveats)
    * @arg {String} guildID The ID of the guild
    * @arg {Object} options The properties to edit
    * @arg {String} options.channelID The ID of the channel the user is currently in
    * @arg {Date?} [options.requestToSpeakTimestamp] Sets the user's request to speak - this can only be used when the `userID` param is "@me"
    * @arg {Boolean} [options.suppress] Toggles the user's suppress state
    * @arg {String} [userID="@me"] The user ID of the user to update
    * @returns {Promise}
    */
    async editGuildVoiceState(guildID, options, userID = "@me") {
        return this.patch(Endpoints.GUILD_VOICE_STATE(guildID, userID), {
            auth: true,
            body: {
                channel_id: options.channelID,
                request_to_speak_timestamp: options.requestToSpeakTimestamp,
                suppress: options.suppress
            }
        });
    }

    /**
    * Edit a guild welcome screen
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] The properties to edit
    * @arg {String?} [options.description] The description in the welcome screen
    * @arg {Boolean} [options.enabled] Whether the welcome screen is enabled
    * @arg {Array<Object>} [options.welcomeChannels] The list of channels in the welcome screen as an array
    * @arg {String} options.welcomeChannels[].channelID The channel ID of the welcome channel
    * @arg {String} options.welcomeChannels[].description The description of the welcome channel
    * @arg {String?} options.welcomeChannels[].emojiID The emoji ID of the welcome channel
    * @arg {String?} options.welcomeChannels[].emojiName The emoji name of the welcome channel
    * @returns {Promise<Object>}
    */
    async editGuildWelcomeScreen(guildID, options) {
        return this.patch(Endpoints.GUILD_WELCOME_SCREEN(guildID), {
            auth: true,
            body: {
                description: options.description,
                enabled: options.enabled,
                welcome_channels: options.welcomeChannels.map((c) => ({
                    channel_id: c.channelID,
                    description: c.description,
                    emoji_id: c.emojiID,
                    emoji_name: c.emojiName
                }))
            }
        });
    }

    /**
    * Modify a guild's widget
    * @arg {String} guildID The ID of the guild
    * @arg {Object} options The widget object to modify (https://discord.com/developers/docs/resources/guild#modify-guild-widget)
    * @returns {Promise<Object>} A guild widget object
    */
    async editGuildWidget(guildID, options) {
        return this.patch(Endpoints.GUILD_WIDGET(guildID), {
            auth: true,
            body: options
        });
    }

    /**
    * Edit a message
    * @arg {String} channelID The ID of the channel
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
    * @arg {Number} [content.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @returns {Promise<Message>}
    */
    async editMessage(channelID, messageID, content) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
            if(content.content !== undefined || content.embeds || content.allowedMentions) {
                content.allowed_mentions = formatAllowedMentions(content.allowedMentions ?? this.#client.options.allowedMentions);
            }
        }

        const {files, attachments} = content.attachments ? processAttachments(content.attachments) : [];
        content.attachments = attachments;

        return this.patch(Endpoints.CHANNEL_MESSAGE(channelID, messageID), {
            auth: true,
            body: content,
            files: files
        }).then((message) => new Message(message, this.#client));
    }

    /**
    * Edit a guild role
    * @arg {String} guildID The ID of the guild the role is in
    * @arg {String} roleID The ID of the role
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.color] The hex color of the role, in number form (ex: 0x3da5b3 or 4040115)
    * @arg {Boolean} [options.hoist] Whether to hoist the role in the user list or not
    * @arg {String} [options.icon] The role icon as a base64 data URI
    * @arg {Boolean} [options.mentionable] Whether the role is mentionable or not
    * @arg {String} [options.name] The name of the role
    * @arg {BigInt | Number | String | Permission} [options.permissions] The role permissions
    * @arg {String} [options.unicodeEmoji] The role's unicode emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Role>}
    */
    async editRole(guildID, roleID, options, reason) {
        return this.patch(Endpoints.GUILD_ROLE(guildID, roleID), {
            auth: true,
            body: {
                color: options.color,
                hoist: options.hoist,
                icon: options.icon,
                mentionable: options.mentionable,
                name: options.name,
                permissions: options.permissions?.allow
                    ?? options.permissions?.toString(),
                unicode_emoji: options.unicodeEmoji
            },
            reason: reason
        }).then((role) => new Role(role, this.#client?.guilds.get(guildID)));
    }

    /**
     * Updates the role connection metadata
     * @arg {Array<Object>} metadata An array of [role connection metadata objects](https://discord.com/developers/docs/resources/application-role-connection-metadata#application-role-connection-metadata-object)
     * @returns {Promise<Object[]>}
     */
    async editRoleConnectionMetadata(metadata, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in editRoleConnectionMetadata()");
        }

        for(const meta of metadata) {
            meta.name_localizations = meta.nameLocalizations;
            meta.description_localizations = meta.descriptionLocalizations;
        }

        return this.put(Endpoints.ROLE_CONNECTION_METADATA(applicationID), {
            auth: true,
            body: metadata
        }).then((metadata) => metadata.map((meta) => ({
            ...meta,
            nameLocalizations: meta.name_localizations,
            descriptionLocalizations: meta.description_localizations
        })));
    }

    /**
    * Edit a guild role's position. Note that role position numbers are highest on top and lowest at the bottom.
    * @arg {String} guildID The ID of the guild the role is in
    * @arg {String} roleID The ID of the role
    * @arg {Number} position The new position of the role
    * @returns {Promise}
    */
    async editRolePosition(guildID, roleID, position) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(guildID === roleID) {
            throw new Error("Cannot move default role");
        }

        const roles = this.#client.guilds.get(guildID).roles;
        const role = roles.get(roleID);

        if(!role) {
            throw new Error(`Role ${roleID} not found`);
        }

        if(role.position === position) {
            return;
        }

        const min = Math.min(position, role.position);
        const max = Math.max(position, role.position);

        const filteredRoles = roles.filter((role) => {
            return min <= role.position
                && role.position <= max
                && role.id !== roleID;
        }).sort((a, b) => a.position - b.position);

        if(position > role.position) {
            filteredRoles.push(role);
        } else {
            filteredRoles.unshift(role);
        }

        return this.patch(Endpoints.GUILD_ROLES(guildID), {
            auth: true,
            body: filteredRoles.map((role, index) => ({
                id: role.id,
                position: index + min
            }))
        });
    }

    /**
    * Edit properties of the bot user
    * @arg {Object} options The properties to edit
    * @arg {String} [options.username] The new username
    * @arg {String?} [options.avatar] The new avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @returns {Promise<ExtendedUser>}
    */
    async editSelf(options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.USER("@me"), {
            auth: true,
            body: options
        }).then((data) => new ExtendedUser(data, this.#client));
    }

    /**
    * Update a stage instance
    * @arg {String} channelID The ID of the stage channel associated with the instance
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
    * @arg {String} [options.topic] The stage instance topic
    * @returns {Promise<StageInstance>}
    */
    async editStageInstance(channelID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.patch(Endpoints.STAGE_INSTANCE(channelID), {
            auth: true,
            body: options
        }).then((instance) => new StageInstance(instance, this.#client));
    }

    /**
    * Edit a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {Object} options Webhook options
    * @arg {String} [options.name] The new default name
    * @arg {String?} [options.avatar] The new default avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @arg {String} [options.channelID] The new channel ID where webhooks should be sent to
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} Resolves with a webhook object
    */
    async editWebhook(webhookID, options, token, reason) {
        return this.patch(token ? Endpoints.WEBHOOK_TOKEN(webhookID, token) : Endpoints.WEBHOOK(webhookID), {
            auth: !token,
            body: {
                avatar: options.avatar,
                channel_id: options.channelID,
                name: options.name
            },
            reason: reason
        });
    }

    /**
    * Edit a webhook message
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} token The token of the webhook
    * @arg {String} messageID The ID of the message
    * @arg {Object} options Webhook message edit options
    * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
    * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [options.attachments] The files to attach to the message
    * @arg {String} options.attachments[].id The ID of an attachment (set only when you want to update an attachment)
    * @arg {Buffer} options.attachments[].file A buffer containing file data (set only when uploading new files)
    * @arg {String} options.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.content] A content string
    * @arg {Array<Object>} [options.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {String} [options.threadID] The ID of the thread channel in the webhook's channel to edit the message in
    * @returns {Promise<Message>}
    */
    async editWebhookMessage(webhookID, token, messageID, options) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const query = {};
        if(options.threadID) {
            query.thread_id = options.threadID;
        }

        if(options.allowedMentions) {
            options.allowed_mentions = formatAllowedMentions(options.allowedMentions ?? this.#client.options.allowedMentions);
        }

        const {files, attachments} = options.attachments ? processAttachments(options.attachments) : [];
        options.attachments = attachments;

        return this.patch(Endpoints.WEBHOOK_MESSAGE(webhookID, token, messageID), {
            body: options,
            files: files,
            query: query
        }).then((response) => new Message(response, this.#client));
    }

    /**
    * Execute a slack-style webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} token The token of the webhook
    * @arg {Object} options Slack webhook options
    * @arg {Boolean} [options.auth=false] Whether or not to authenticate with the bot token.
    * @arg {String} [options.threadID] The ID of the thread channel in the webhook's channel to send the message to
    * @arg {Boolean} [options.wait=false] Whether to wait for the server to confirm the message create or not
    * @returns {Promise}
    */
    async executeSlackWebhook(webhookID, token, options) {
        const auth = !!options.auth;
        const threadID = options.threadID;
        const wait = !!options.wait;

        delete options.auth;
        delete options.threadID;
        delete options.wait;

        return this.post(Endpoints.WEBHOOK_TOKEN_SLACK(webhookID, token), {
            auth: auth,
            body: options,
            query: {
                thread_id: threadID,
                wait: wait
            }
        });
    }

    /**
    * Execute a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} token The token of the webhook
    * @arg {Object} options Webhook execution options
    * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {Buffer} content.attachments[].file A buffer containing file data
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Boolean} [options.auth=false] Whether or not to authenticate with the bot token.
    * @arg {String} [options.avatarURL] A URL for a custom avatar, defaults to webhook default avatar if not specified
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.content] A content string
    * @arg {Array<Object>} [options.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [options.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {String} [options.threadID] The ID of the thread channel in the webhook's channel to send the message to
    * @arg {String} [options.threadName] The name of the thread created in a forum channel
    * @arg {Boolean} [options.tts=false] Whether the message should be a TTS message or not
    * @arg {String} [options.username] A custom username, defaults to webhook default username if not specified
    * @arg {Boolean} [options.wait=false] Whether to wait for the server to confirm the message create or not
    * @returns {Promise<Message?>}
    */
    async executeWebhook(webhookID, token, options) {
        if(options.wait && this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const {files, attachments} = options.attachments ? processAttachments(options.attachments) : [];

        return this.post(Endpoints.WEBHOOK_TOKEN(webhookID, token), {
            auth: !!options.auth,
            body: {
                allowed_mentions: formatAllowedMentions(options.allowedMentions ?? this.#client.options.allowedMentions),
                attachments: attachments,
                avatar_url: options.avatarURL,
                components: options.components,
                content: options.content,
                embeds: options.embeds,
                flags: options.flags,
                thread_name: options.threadName,
                tts: options.tts,
                username: options.username
            },
            files: files,
            query: {
                thread_id: options.threadID,
                wait: !!options.wait
            }
        }).then((response) => options.wait ? new Message(response, this.#client) : undefined);
    }

    /**
     * Follow a NewsChannel in another channel. This creates a webhook in the target channel
     * @arg {String} channelID The ID of the NewsChannel
     * @arg {String} webhookChannelID The ID of the target channel
     * @returns {Object} An object containing the NewsChannel's ID and the new webhook's ID
     */
    async followChannel(channelID, webhookChannelID) {
        return this.post(Endpoints.CHANNEL_FOLLOW(channelID), {
            auth: true,
            body: {
                webhook_channel_id: webhookChannelID
            }
        });
    }

    /**
     * Makes a GET request to the API.
     * @arg path The endpoint to make the request to.
     * @arg options Data regarding the request.
     * @returns Resolves with the returned JSON data.
     */
    async get(path, options) {
        return this.#handler.request("GET", path, options);
    }

    /**
    * Get all active threads in a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} An object containing an array of `threads` and an array of `members`
    */
    async getActiveGuildThreads(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.THREADS_GUILD_ACTIVE(guildID), {
            auth: true
        }).then((response) => ({
            members: response.members.map((member) => new ThreadMember(member, this.#client)),
            threads: response.threads.map((thread) => Channel.from(thread, this.#client))
        }));
    }

    /**
    * Get all archived threads in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} type The type of thread channel, either "public" or "private"
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    */
    async getArchivedThreads(channelID, type, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.THREADS_ARCHIVED(channelID, type), {
            auth: true,
            query: options
        }).then((response) => ({
            hasMore: response.has_more,
            members: response.members.map((member) => new ThreadMember(member, this.#client)),
            threads: response.threads.map((thread) => Channel.from(thread, this.#client))
        }));
    }

    /**
     * Get an existing auto moderation rule
     * @arg {String} guildID The ID of the guild to get the rule from
     * @arg {String} ruleID The ID of the rule to get
     * @returns {Promise<AutoModerationRule>}
     */
    async getAutoModerationRule(guildID, ruleID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.AUTO_MODERATION_RULE(guildID, ruleID), {
            auth: true
        }).then((rule) => new AutoModerationRule(rule, this.#client));
    }

    /**
     * Get a guild's auto moderation rules
     * @arg {String} guildID The ID of the guild to get the rules of
     * @returns {Promise<Object[]>}
     */
    async getAutoModerationRules(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.AUTO_MODERATION_RULES(guildID), {
            auth: true
        }).then((rules) => rules.map((rule) => new AutoModerationRule(rule, this.#client)));
    }

    /**
    * Get general and bot-specific info on connecting to the Discord gateway (e.g. connection ratelimit)
    * @returns {Promise<Object>} Resolves with an object containing gateway connection info
    */
    async getBotGateway() {
        return this.get(Endpoints.GATEWAY_BOT, {
            auth: true
        });
    }

    /**
    * Get a channel's data
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<CategoryChannel | PrivateChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>}
    */
    async getChannel(channelID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.CHANNEL(channelID), {
            auth: true
        }).then((channel) => Channel.from(channel, this.#client));
    }

    /**
    * Get all invites in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<Array<Invite>>}
    */
    async getChannelInvites(channelID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.CHANNEL_INVITES(channelID), {
            auth: true
        }).then((invites) => invites.map((invite) => new Invite(invite, this.#client)));
    }

    /**
    * Get all the webhooks in a channel
    * @arg {String} channelID The ID of the channel to get webhooks for
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    */
    async getChannelWebhooks(channelID) {
        return this.get(Endpoints.CHANNEL_WEBHOOKS(channelID), {
            auth: true
        });
    }

    /**
    * Get a global application command
    * @arg {String} commandID The command id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand>}
    */
    async getCommand(commandID, withLocalizations, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in getCommand()");
        }

        return this.get(Endpoints.COMMAND(applicationID, commandID), {
            auth: true,
            query: {
                with_localizations: !!withLocalizations
            }
        }).then((data) => new ApplicationCommand(data, this.#client));
    }

    /**
    * Get the a guild's application command permissions
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @returns {Promise<Object>} Resolves with a guild application command permissions object.
    */
    async getCommandPermissions(guildID, commandID, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in getCommandPermissions()");
        }

        return this.get(Endpoints.COMMAND_PERMISSIONS(applicationID, guildID, commandID), {
            auth: true
        });
    }

    /**
    * Get the global application commands
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand[]>}
    */
    async getCommands(withLocalizations) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.COMMANDS(this.application.id), {
            auth: true,
            query: {
                with_localizations: !!withLocalizations
            }
        }).then((data) => data.map((c) => new ApplicationCommand(c, this.#client)));
    }

    /**
    * Get a DM channel with a user, or create one if it does not exist
    * @arg {String} userID The ID of the user
    * @returns {Promise<PrivateChannel>}
    */
    async getDMChannel(userID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.post(Endpoints.USER_CHANNELS("@me"), {
            auth: true,
            body: {
                recipient_id: userID
            }
        }).then((privateChannel) => new PrivateChannel(privateChannel, this.#client));
    }

    /**
    * Get info on connecting to the Discord gateway
    * @returns {Promise<Object>} Resolves with an object containing gateway connection info
    */
    async getGateway() {
        return this.get(Endpoints.GATEWAY);
    }

    /**
    * Get a guild's data
    * @arg {String} guildID The ID of the guild
    * @arg {Boolean} [withCounts=false] Whether the guild object will have approximateMemberCount and approximatePresenceCount
    * @returns {Promise<Guild>}
    */
    async getGuild(guildID, withCounts = false) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD(guildID), {
            auth: true,
            query: {
                with_counts: withCounts
            }
        }).then((guild) => new Guild(guild, this.#client));
    }

    /**
    * Get the audit log for a guild
    * @arg {String} guildID The ID of the guild to get audit logs for
    * @arg {Object} [options] Options for the request
    * @arg {Number} [options.actionType] Filter entries by action type
    * @arg {String} [options.after] Get entries after this entry ID
    * @arg {String} [options.before] Get entries before this entry ID
    * @arg {Number} [options.limit=50] The maximum number of entries to return
    * @arg {String} [options.userID] Filter entries by the user that performed the action
    * @returns {Promise<{autoModerationRules: Array<AutoModerationRule>, commands: Array<ApplicationCommand>, entries: Array<GuildAuditLogEntry>, events: Array<GuildScheduledEvent>, integrations: Array<PartialIntegration>, threads: Array<NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>, users: Array<User>, webhooks: Array<Webhook>}>}
    */
    async getGuildAuditLog(guildID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        options.limit ??= 50;

        if(options.actionType !== undefined) {
            options.action_type = options.actionType;
            delete options.actionType;
        }

        if(options.userID !== undefined) {
            options.user_id = options.userID;
            delete options.userID;
        }

        return this.get(Endpoints.GUILD_AUDIT_LOGS(guildID), {
            auth: true,
            query: options
        }).then((data) => {
            const guild = this.#client.guilds.get(guildID);
            const users = data.users.map((user) => this.#client.users.add(user, this.#client));
            const threads = data.threads.map((thread) => guild.threads.update(thread, this.#client));
            const events = data.guild_scheduled_events.map((event) => guild.events.update(event, this.#client));
            const commands = data.application_commands.map((cmd) => new ApplicationCommand(cmd, this.#client));
            const autoModerationRules = data.auto_moderation_rules.map((rule) => new AutoModerationRule(rule, this.#client));

            return {
                autoModerationRules: autoModerationRules,
                commands: commands,
                entries: data.audit_log_entries.map((entry) => new GuildAuditLogEntry(entry, guild)),
                events: events,
                integrations: data.integrations.map((integration) => new GuildIntegration(integration, guild)),
                threads: threads,
                users: users,
                webhooks: data.webhooks
            };
        });
    }

    /**
    * Get a ban from the ban list of a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the banned user
    * @returns {Promise<Object>} Resolves with {reason: String, user: User}
    */
    async getGuildBan(guildID, userID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_BAN(guildID, userID), {
            auth: true
        }).then((ban) => {
            ban.user = new User(ban.user, this.#client);
            return ban;
        });
    }

    /**
    * Get the ban list of a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Only get users after given user ID
    * @arg {String} [options.before] Only get users before given user ID
    * @arg {Number} [options.limit=1000] The maximum number of users to return
    * @returns {Promise<Array<Object>>} Resolves with an array of { reason: String, user: User }
    */
    async getGuildBans(guildID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const bans = await this.get(Endpoints.GUILD_BANS(guildID), {
            auth: true,
            query: {
                after: options.after,
                before: options.before,
                limit: options.limit && Math.min(options.limit, 1000)
            }
        });

        for(const ban of bans) {
            ban.user = this.#client.users.update(ban.user, this.#client);
        }

        if(options.limit && options.limit > 1000 && bans.length >= 1000) {
            const page = await this.getGuildBans(guildID, {
                after: options.before ? undefined : bans[bans.length - 1].user.id,
                before: options.before ? bans[0].user.id : undefined,
                limit: options.limit - bans.length
            });

            if(options.before) {
                bans.unshift(...page);
            } else {
                bans.push(...page);
            }
        }

        return bans;
    }

    /**
    * Get a guild's channels
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<CategoryChannel | TextChannel | TextVoiceChannel | NewsChannel | StageChannel>>}
    */
    async getGuildChannels(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_CHANNELS(guildID), {
            auth: true
        }).then((channels) => channels.map((channel) => Channel.from(channel, this.#client)));
    }


    /**
    * Get a guild application command
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand>} Resolves with an command object.
    */
    async getGuildCommand(guildID, commandID, withLocalizations, applicationID = this.#client?.application.id) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        if(applicationID === undefined) {
            throw new Error("Missing applicationID in getGuildCommand()");
        }

        return this.get(Endpoints.GUILD_COMMAND(applicationID, guildID, commandID), {
            auth: true,
            query: {
                with_localizations: !!withLocalizations
            }
        }).then((data) => new ApplicationCommand(data, this.#client));
    }

    /**
    * Get the all of a guild's application command permissions
    * @arg {String} guildID The guild ID
    * @returns {Promise<Array<Object>>} Resolves with an array of guild application command permissions objects.
    */
    async getGuildCommandPermissions(guildID, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in getGuildCommandPermissions()");
        }

        return this.get(Endpoints.GUILD_COMMAND_PERMISSIONS(applicationID, guildID), {
            auth: true
        });
    }

    /**
    * Get a guild's application commands
    * @arg {String} guildID The guild id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand[]>} Resolves with an array of command objects.
    */
    async getGuildCommands(guildID, withLocalizations, applicationID = this.#client?.application.id) {
        if(applicationID === undefined) {
            throw new Error("Missing applicationID in getGuildCommands()");
        }

        return this.get(Endpoints.GUILD_COMMANDS(applicationID, guildID), {
            auth: true,
            query: {
                with_localizations: !!withLocalizations
            }
        }).then((data) => data.map((c) => new ApplicationCommand(c, this.#client)));
    }


    /**
    * Get a guild emoji
    * @arg {String} guildID The ID of the guild
    * @arg {String} emojiID The ID of the emoji
    * @returns {Promise<Object>} An emoji object
    */
    async getGuildEmoji(guildID, emojiID) {
        return this.get(Endpoints.GUILD_EMOJI(guildID, emojiID), {
            auth: true
        });
    }

    /**
    * Get a guild's emojis
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Object>>} An array of guild emoji objects
    */
    async getGuildEmojis(guildID) {
        return this.get(Endpoints.GUILD_EMOJIS(guildID), {
            auth: true
        });
    }

    /**
    * Get a list of integrations for a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<GuildIntegration>>}
    */
    async getGuildIntegrations(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const guild = this.#client.guilds.get(guildID);
        return this.get(Endpoints.GUILD_INTEGRATIONS(guildID), {
            auth: true
        }).then((integrations) => integrations.map((integration) => new GuildIntegration(integration, guild)));
    }

    /**
    * Get all invites in a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Invite>>}
    */
    async getGuildInvites(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_INVITES(guildID), {
            auth: true
        }).then((invites) => invites.map((invite) => new Invite(invite, this.#client)));
    }

    /**
    * Get a guild's members
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @returns {Promise<Member>}
    */
    async getGuildMember(guildID, memberID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_MEMBER(guildID, memberID), {
            auth: true
        }).then((member) => new Member(member, this.guilds.get(guildID), this.#client));
    }

    /**
    * Get a guild's members
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] The highest user ID of the previous page
    * @arg {Number} [options.limit=1] The max number of members to get (1 to 1000)
    * @returns {Promise<Array<Member>>}
    */
    async getGuildMembers(guildID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_MEMBERS(guildID), {
            auth: true,
            query: options
        }).then((members) => members.map((member) => new Member(member, this.#client.guilds.get(guildID), this.#client)));
    }

    /**
    * Get a guild preview for a guild. Only available for community guilds.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<GuildPreview>}
    */
    async getGuildPreview(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_PREVIEW(guildID), {
            auth: true
        }).then((data) => new GuildPreview(data, this.#client));
    }

    /**
    * Get a guild's roles
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Role>>}
    */
    async getGuildRoles(guildID) {
        return this.get(Endpoints.GUILD_ROLES(guildID), {
            auth: true
        }).then((roles) => roles.map((role) => new Role(role, null)));
    }

    /**
    * Get a list of the user's guilds
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] The highest guild ID of the previous page
    * @arg {String} [options.before] The lowest guild ID of the next page
    * @arg {Number} [options.limit=100] The max number of guilds to get (1 to 1000)
    * @returns {Promise<Array<Guild>>}
    */
    async getGuilds(options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.USER_GUILDS("@me"), {
            auth: true,
            query: options
        }).then((guilds) => guilds.map((guild) => new Guild(guild, this.#client)));
    }

    /**
    * Get a guild scheduled event
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the guild scheduled event
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to the event
    * @returns {Promise<GuildScheduledEvent>}
    */
    async getGuildScheduledEvent(guildID, eventID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_SCHEDULED_EVENT(guildID, eventID), {
            auth: true,
            query: {
                with_user_count: options.withUserCount
            }
        }).then((data) => new GuildScheduledEvent(data, this.#client));
    }

    /**
    * Get a guild's scheduled events
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to each event
    * @returns {Promise<Array<GuildScheduledEvent>>}
    */
    async getGuildScheduledEvents(guildID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_SCHEDULED_EVENTS(guildID), {
            auth: true,
            query: {
                with_user_count: options.withUserCount
            }
        }).then((data) => data.map((event) => new GuildScheduledEvent(event, this.#client)));
    }

    /**
    * Get a list of users subscribed to a guild scheduled event
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the event
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Get users after this user ID. If `options.before` is provided, this will be ignored. Fetching users in between `before` and `after` is not supported
    * @arg {String} [options.before] Get users before this user ID
    * @arg {Number} [options.limit=100] The number of users to get (max 100). Pagination will only work if one of `options.after` or `options.after` is also provided
    * @arg {Boolean} [options.withMember] Include guild member data
    * @returns {Promise<Array<{guildScheduledEventID: String, member: Member | undefined, user: User}>>}
    */
    async getGuildScheduledEventUsers(guildID, eventID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        const guild = this.#client.guilds.get(guildID);

        return this.get(Endpoints.GUILD_SCHEDULED_EVENT_USERS(guildID, eventID), {
            auth: true,
            query: {
                after: options.after,
                before: options.before,
                limit: options.limit,
                with_member: options.withMember
            }
        }).then((data) => data.map((eventUser) => {
            if(eventUser.member) {
                eventUser.member.id = eventUser.user.id;
            }

            return {
                guildScheduledEventID: eventUser.guild_scheduled_event_id,
                member: eventUser.member && guild ? guild.members.update(eventUser.member) : new Member(eventUser.member),
                user: this.#client.users.update(eventUser.user)
            };
        }));
    }

    /**
    * Get a guild sticker
    * @arg {String} guildID The ID of the guild
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
    */
    async getGuildSticker(guildID, stickerID) {
        return this.get(Endpoints.GUILD_STICKER(guildID, stickerID), {
            auth: true
        });
    }

    /**
    * Get a guild's stickers
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Object>>} An array of guild sticker objects
    */
    async getGuildStickers(guildID) {
        return this.get(Endpoints.GUILD_STICKERS(guildID), {
            auth: true
        });
    }

    /**
    * Get a guild template
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    async getGuildTemplate(code) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_TEMPLATE(code), {
            auth: true
        }).then((template) => new GuildTemplate(template, this.#client));
    }

    /**
    * Get a guild's templates
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<GuildTemplate>>}
    */
    async getGuildTemplates(guildID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_TEMPLATES(guildID), {
            auth: true
        }).then((templates) => templates.map((t) => new GuildTemplate(t, this.#client)));
    }

    /**
    * Returns the vanity url of the guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    */
    async getGuildVanity(guildID) {
        return this.get(Endpoints.GUILD_VANITY_URL(guildID), {
            auth: true
        });
    }

    /**
    * Get all the webhooks in a guild
    * @arg {String} guildID The ID of the guild to get webhooks for
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    */
    async getGuildWebhooks(guildID) {
        return this.get(Endpoints.GUILD_WEBHOOKS(guildID), {
            auth: true
        });
    }

    /**
    * Get the welcome screen of a Community guild, shown to new members
    * @arg {String} guildID The ID of the guild to get the welcome screen for
    * @returns {Promise<Object>}
    */
    async getGuildWelcomeScreen(guildID) {
        return this.get(Endpoints.GUILD_WELCOME_SCREEN(guildID), {
            auth: true
        });
    }

    /**
    * Get a guild's widget object
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} A guild widget object
    */
    async getGuildWidget(guildID) {
        return this.get(Endpoints.GUILD_WIDGET(guildID), {
            auth: true
        });
    }

    /**
    * Get a guild's widget settings object. Requires MANAGE_GUILD permission
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} A guild widget setting object
    */
    async getGuildWidgetSettings(guildID) {
        return this.get(Endpoints.GUILD_WIDGET_SETTINGS(guildID), {
            auth: true
        });
    }

    /**
    * Get info on an invite
    * @arg {String} inviteID The ID of the invite
    * @arg {Object | Boolean} [options] Options for fetching the invite.
    * @arg {Boolean} [options.withCounts] Whether to fetch additional invite info or not (approximate member counts, approximate presences, channel counts, etc.)
    * @arg {Boolean} [options.withExpiration] Whether to fetch the expiration time or not
    * @arg {String} [options.guildScheduledEventID] The guild scheduled event ID to include along with the invite
    * @returns {Promise<Invite>}
    */
    async getInvite(inviteID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.INVITE(inviteID), {
            auth: true,
            query: {
                guild_scheduled_event_id: options.guildScheduledEventID,
                with_counts: options.withCounts,
                with_expiration: options.withExpiration
            }
        }).then((invite) => new Invite(invite, this.#client));
    }

    /**
    * Get joined private archived threads in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    */
    async getJoinedPrivateArchivedThreads(channelID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.THREADS_ARCHIVED_JOINED(channelID), {
            auth: true,
            query: options
        }).then((response) => ({
            hasMore: response.has_more,
            members: response.members.map((member) => new ThreadMember(member, this.#client)),
            threads: response.threads.map((thread) => Channel.from(thread, this.#client))
        }));
    }

    /**
    * Get a previous message in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise<Message>}
    */
    async getMessage(channelID, messageID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.CHANNEL_MESSAGE(channelID, messageID), {
            auth: true
        }).then((message) => new Message(message, this.#client));
    }

    /**
    * Get a list of users who reacted with a specific reaction
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {Object} [options] Options for the request
    * @arg {Number} [options.limit=100] The maximum number of users to get
    * @arg {String} [options.after] Get users after this user ID
    * @returns {Promise<Array<User>>}
    */
    async getMessageReaction(channelID, messageID, reaction, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        options.limit ??= 100;
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }

        return this.get(Endpoints.CHANNEL_MESSAGE_REACTION(channelID, messageID, reaction), {
            auth: true,
            query: options
        }).then((users) => users.map((user) => new User(user, this.#client)));
    }

    /**
    * Get previous messages in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] Get messages after this message ID
    * @arg {String} [options.around] Get messages around this message ID (does not work with limit > 100)
    * @arg {String} [options.before] Get messages before this message ID
    * @arg {Number} [options.limit=50] The max number of messages to get
    * @returns {Promise<Array<Message>>}
    */
    async getMessages(channelID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        options.limit ??= 50;

        const messages = await this.get(Endpoints.CHANNEL_MESSAGES(channelID), {
            auth: true,
            query: {
                after: options.after,
                around: options.limit <= 100
                    ? options.around
                    : undefined,
                before: options.before,
                limit: options.limit && Math.min(options.limit, 100)
            }
        }).then((data) => data.map((message) => new Message(message, this.#client)));

        if(options.limit && options.limit > 100 && messages.length >= 100) {
            const page = await this.getMessages(channelID, {
                after: options.after ? messages[0].id : undefined,
                before: options.before || !options.after ? messages[messages.length - 1].id : undefined,
                limit: options.limit - messages.length
            });

            if(options.after) {
                messages.unshift(...page);
            } else {
                messages.push(...page);
            }
        }

        return messages;
    }

    /**
     * Get the list of sticker packs available to Nitro subscribers
     * @returns {Promise<Object>} An object whichs contains a value which contains an array of sticker packs
     */
    async getNitroStickerPacks() {
        return this.get(Endpoints.STICKER_PACKS, {
            auth: true
        });
    }

    /**
    * Get data on the bot's OAuth2 application
    * @returns {Promise<Object>} The bot's application data. Refer to [Discord's Documentation](https://discord.com/developers/docs/topics/oauth2#get-current-application-information) for object structure
    */
    async getOAuthApplication() {
        return this.get(Endpoints.OAUTH2_APPLICATION, {
            auth: true
        });
    }

    /**
    * Get all the pins in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<Array<Message>>}
    */
    async getPins(channelID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.CHANNEL_PINS(channelID), {
            auth: true
        }).then((messages) => messages.map((message) => new Message(message, this.#client)));
    }

    /**
    * Get the prune count for a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Number} [options] The options to use to get number of prune members
    * @arg {Number} [options.days=7] The number of days of inactivity to prune for
    * @arg {Array<String>} [options.includeRoles] An array of role IDs that members must have to be considered for pruning
    * @returns {Promise<Number>} Resolves with the number of members that would be pruned
    */
    async getPruneCount(guildID, options = {}) {
        return this.get(Endpoints.GUILD_PRUNE(guildID), {
            auth: true,
            query: {
                days: options.days,
                include_roles: options.includeRoles
            }
        }).then((data) => data.pruned);
    }

    /**
     * Gets the role connection metadata
     * @returns {Promise<Object[]>}
     */
    async getRoleConnectionMetadata() {
        return this.get(Endpoints.ROLE_CONNECTION_METADATA(this.application.id), {
            auth: true
        }).then((metadata) => metadata.map((meta) => ({
            ...meta,
            nameLocalizations: meta.name_localizations,
            descriptionLocalizations: meta.description_localizations
        })));
    }

    /**
    * Get properties of the bot user
    * @returns {Promise<ExtendedUser>}
    */
    async getSelf() {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.USER("@me"), {
            auth: true
        }).then((data) => new ExtendedUser(data, this.#client));
    }

    /**
    * Get the stage instance associated with a stage channel
    * @arg {String} channelID The stage channel ID
    * @returns {Promise<StageInstance>}
    */
    async getStageInstance(channelID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.STAGE_INSTANCE(channelID), {
            auth: true
        }).then((instance) => new StageInstance(instance, this.#client));
    }

    /**
    * Get a sticker
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
     */
    async getSticker(stickerID) {
        return this.get(Endpoints.STICKER(stickerID), {
            auth: true
        });
    }

    /**
     * Gets a thread member object for a specified user
     * @arg {String} channelID The ID of the thread channel
     * @arg {String} memberID The ID of the member
     * @arg {Object} [options] Options for the request
     * @arg {Boolean} [options.withMember] Whether to include a Member object for each thread member
     * @returns {Promise<ThreadMember>}
     */
    async getThreadMember(channelID, memberID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.THREAD_MEMBER(channelID, memberID), {
            auth: true,
            query: {
                with_member: options.withMember
            }
        }).then((m) => new ThreadMember(m, this.#client));
    }

    /**
    * Get a list of members that are part of a thread channel
    * @arg {String} channelID The ID of the thread channel
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Fetch thread members after this user ID
    * @arg {Number} [options.limit] The maximum amount of thread members to fetch
    * @arg {Boolean} [options.withMember] Whether to include a Member object for each thread member
    * @returns {Promise<Array<ThreadMember>>}
    */
    async getThreadMembers(channelID, options = {}) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.THREAD_MEMBERS(channelID), {
            auth: true,
            query: {
                with_member: options.withMember
            }
        }).then((members) => members.map((member) => new ThreadMember(member, this.#client)));
    }

    /**
    * Get a user's data
    * @arg {String} userID The ID of the user
    * @returns {Promise<User>}
    */
    async getUser(userID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.USER(userID), {
            auth: true
        }).then((user) => new User(user, this.#client));
    }

    /**
    * Get a list of general/guild-specific voice regions
    * @arg {String} [guildID] The ID of the guild
    * @returns {Promise<Array<Object>>} Resolves with an array of voice region objects
    */
    async getVoiceRegions(guildID) {
        return this.get(guildID ? Endpoints.GUILD_VOICE_REGIONS(guildID) : Endpoints.VOICE_REGIONS, {
            auth: true
        });
    }

    /**
    * Get a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @returns {Promise<Object>} Resolves with a webhook object
    */
    async getWebhook(webhookID, token) {
        return this.get(token ? Endpoints.WEBHOOK_TOKEN(webhookID, token) : Endpoints.WEBHOOK(webhookID), {
            auth: !token
        });
    }

    /**
    * Get a webhook message
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} token The token of the webhook
    * @arg {String} messageID The message ID of a message sent by this webhook
    * @returns {Promise<Message>} Resolves with a webhook message
    */
    async getWebhookMessage(webhookID, token, messageID) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.WEBHOOK_MESSAGE(webhookID, token, messageID)).then((message) => new Message(message, this.#client));
    }

    /**
    * Join a thread
    * @arg {String} channelID The ID of the thread channel
    * @arg {String} [userID="@me"] The user ID of the user joining
    * @returns {Promise}
    */
    async joinThread(channelID, userID = "@me") {
        return this.put(Endpoints.THREAD_MEMBER(channelID, userID), {
            auth: true
        });
    }

    /**
    * Kick a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async kickGuildMember(guildID, userID, reason) {
        return this.delete(Endpoints.GUILD_MEMBER(guildID, userID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Leave a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    */
    async leaveGuild(guildID) {
        return this.delete(Endpoints.USER_GUILD("@me", guildID), {
            auth: true
        });
    }

    /**
    * Leave a thread
    * @arg {String} channelID The ID of the thread channel
    * @arg {String} [userID="@me"] The user ID of the user leaving
    * @returns {Promise}
    */
    async leaveThread(channelID, userID = "@me") {
        return this.delete(Endpoints.THREAD_MEMBER(channelID, userID), {
            auth: true
        });
    }

    /**
     * Makes a PATCH request to the API.
     * @arg path The endpoint to make the request to.
     * @arg options Data regarding the request.
     * @returns Resolves with the returned JSON data.
     */
    async patch(path, options) {
        return this.#handler.request("PATCH", path, options);
    }

    /**
    * Pin a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    async pinMessage(channelID, messageID) {
        return this.put(Endpoints.CHANNEL_PIN(channelID, messageID), {
            auth: true
        });
    }


    /**
     * Makes a POST request to the API.
     * @arg path The endpoint to make the request to.
     * @arg options Data regarding the request.
     * @returns Resolves with the returned JSON data.
     */
    async post(path, options) {
        return this.#handler.request("POST", path, options);
    }

    /**
    * Begin pruning a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Number} [options] The options to pass to prune members
    * @arg {Boolean} [options.computePruneCount=true] Whether or not the number of pruned members should be returned. Discord discourages setting this to true for larger guilds
    * @arg {Number} [options.days=7] The number of days of inactivity to prune for
    * @arg {Array<String>} [options.includeRoles] An array of role IDs that members must have to be considered for pruning
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise<Number?>} If computePruneCount was true, resolves with the number of pruned members
    */
    async pruneMembers(guildID, options = {}) {
        return this.post(Endpoints.GUILD_PRUNE(guildID), {
            auth: true,
            body: {
                compute_prune_count: options.computePruneCount,
                days: options.days,
                include_roles: options.includeRoles
            },
            reason: options.reason
        }).then((data) => data.pruned);
    }

    /**
    * Purge previous messages in a channel with an optional filter (bot accounts only)
    * @arg {String} channelID The ID of the channel
    * @arg {Object} options Options for the request.
    * @arg {String} [options.after] Get messages after this message ID
    * @arg {String} [options.before] Get messages before this message ID
    * @arg {Function} [options.filter] Optional filter function that returns a boolean when passed a Message object
    * @arg {Number} options.limit The max number of messages to search through, -1 for no limit
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise<Number>} Resolves with the number of messages deleted
    */
    async purgeChannel(channelID, options) {
        if(typeof options.filter === "string") {
            const filter = options.filter;
            options.filter = (msg) => msg.content.includes(filter);
        }

        let limit = options.limit;
        if(typeof limit !== "number") {
            throw new TypeError(`Invalid limit: ${limit}`);
        }

        if(limit !== -1 && limit <= 0) {
            return 0;
        }

        const toDelete = [];
        let deleted = 0;
        let done = false;

        const checkToDelete = async () => {
            const messageIDs = (done && toDelete) || (toDelete.length >= 100 && toDelete.splice(0, 100));
            if(messageIDs) {
                deleted += messageIDs.length;
                await this.deleteMessages(channelID, messageIDs, options.reason);
                if(done) {
                    return deleted;
                }
                await sleep(1000);
                return checkToDelete();
            } else if(done) {
                return deleted;
            } else {
                await sleep(250);
                return checkToDelete();
            }
        };

        const del = async (before, after) => {
            const messages = await this.getMessages(channelID, {
                limit: 100,
                before: before,
                after: after
            });

            if(limit !== -1 && limit <= 0) {
                done = true;
                return;
            }

            for(const message of messages) {
                if(limit !== -1 && limit <= 0) {
                    break;
                }
                if(message.timestamp < Date.now() - 1209600000) { // 14d * 24h * 60m * 60s * 1000ms
                    done = true;
                    return;
                }
                if(!options.filter || options.filter(message)) {
                    toDelete.push(message.id);
                }
                if(limit !== -1) {
                    limit--;
                }
            }

            if((limit !== -1 && limit <= 0) || messages.length < 100) {
                done = true;
                return;
            }

            await del((before || !after) && messages[messages.length - 1].id, after && messages[0].id);
        };

        await del(options.before, options.after);
        return checkToDelete();
    }

    /**
     * Makes a PUT request to the API.
     * @arg path The endpoint to make the request to.
     * @arg options Data regarding the request.
     * @returns Resolves with the returned JSON data.
     */
    async put(path, options) {
        return this.#handler.request("PUT", path, options);
    }

    /**
    * Remove a role from a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async removeGuildMemberRole(guildID, memberID, roleID, reason) {
        return this.delete(Endpoints.GUILD_MEMBER_ROLE(guildID, memberID, roleID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Remove a reaction from a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {String} [userID="@me"] The ID of the user to remove the reaction for
    * @returns {Promise}
    */
    async removeMessageReaction(channelID, messageID, reaction, userID) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }

        return this.delete(Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, reaction, userID || "@me"), {
            auth: true
        });
    }

    /**
    * Remove all reactions from a message for a single emoji.
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    async removeMessageReactionEmoji(channelID, messageID, reaction) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }

        return this.delete(Endpoints.CHANNEL_MESSAGE_REACTION(channelID, messageID, reaction), {
            auth: true
        });
    }

    /**
    * Remove all reactions from a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    async removeMessageReactions(channelID, messageID) {
        return this.delete(Endpoints.CHANNEL_MESSAGE_REACTIONS(channelID, messageID), {
            auth: true
        });
    }

    /**
    * Search for guild members by partial nickname/username
    * @arg {String} guildID The ID of the guild
    * @arg {String} query The query string to match username(s) and nickname(s) against
    * @arg {Number} [limit=1] The maximum number of members you want returned, capped at 100
    * @returns {Promise<Array<Member>>}
    */
    async searchGuildMembers(guildID, query, limit) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.get(Endpoints.GUILD_MEMBERS_SEARCH(guildID), {
            auth: true,
            query: {
                query,
                limit
            }
        }).then((members) => {
            const guild = this.guilds.get(guildID);
            return members.map((member) => new Member(member, guild, this.#client));
        });
    }

    /**
    * Send typing status in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise}
    */
    async sendChannelTyping(channelID) {
        return this.post(Endpoints.CHANNEL_TYPING(channelID), {
            auth: true
        });
    }

    /**
    * Force a guild template to sync
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    async syncGuildTemplate(guildID, code) {
        if(this.#client === undefined) {
            throw new Error("Missing required option \"client\". Please provide a valid \"client\" option in the constructor.");
        }

        return this.put(Endpoints.GUILD_TEMPLATE_GUILD(guildID, code), {
            auth: true
        }).then((template) => new GuildTemplate(template, this.#client));
    }

    /**
    * Unban a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    async unbanGuildMember(guildID, userID, reason) {
        return this.delete(Endpoints.GUILD_BAN(guildID, userID), {
            auth: true,
            reason: reason
        });
    }

    /**
    * Unpin a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    async unpinMessage(channelID, messageID) {
        return this.delete(Endpoints.CHANNEL_PIN(channelID, messageID), {
            auth: true
        });
    }
}

module.exports = RESTClient;
