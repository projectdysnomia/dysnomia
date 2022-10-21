"use strict";

const ApplicationCommand = require("./structures/ApplicationCommand");
const Base = require("./structures/Base");
const Channel = require("./structures/Channel");
const Collection = require("./util/Collection");
const Constants = require("./Constants");
const Endpoints = require("./rest/Endpoints");
const ExtendedUser = require("./structures/ExtendedUser");
const Guild = require("./structures/Guild");
const GuildAuditLogEntry = require("./structures/GuildAuditLogEntry");
const GuildIntegration = require("./structures/GuildIntegration");
const GuildPreview = require("./structures/GuildPreview");
const GuildTemplate = require("./structures/GuildTemplate");
const GuildScheduledEvent = require("./structures/GuildScheduledEvent");
const Invite = require("./structures/Invite");
const Member = require("./structures/Member");
const Message = require("./structures/Message");
const Permission = require("./structures/Permission");
const PrivateChannel = require("./structures/PrivateChannel");
const RequestHandler = require("./rest/RequestHandler");
const Role = require("./structures/Role");
const ShardManager = require("./gateway/ShardManager");
const StageInstance = require("./structures/StageInstance");
const ThreadMember = require("./structures/ThreadMember");
const UnavailableGuild = require("./structures/UnavailableGuild");
const User = require("./structures/User");
const VoiceConnectionManager = require("./voice/VoiceConnectionManager");
const emitDeprecation = require("./util/emitDeprecation");

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch(err) {
    EventEmitter = require("events");
}
let Erlpack;
try {
    Erlpack = require("erlpack");
} catch(err) { // eslint-disable no-empty
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
* Represents the main Dysnomia client
* @extends EventEmitter
* @prop {Object?} application Object containing the bot application's ID and its public flags
* @prop {Boolean} bot Whether the user belongs to an OAuth2 application
* @prop {Object} channelGuildMap Object mapping channel IDs to guild IDs
* @prop {String} gatewayURL The URL for the discord gateway
* @prop {Collection<Guild>} guilds Collection of guilds the bot is in
* @prop {Object} guildShardMap Object mapping guild IDs to shard IDs
* @prop {Object} options Dysnomia options
* @prop {Object} privateChannelMap Object mapping user IDs to private channel IDs
* @prop {Collection<PrivateChannel>} privateChannels Collection of private channels the bot is in
* @prop {RequestHandler} requestHandler The request handler the client will use
* @prop {Collection<Shard>} shards Collection of shards Dysnomia is using
* @prop {Number} startTime Timestamp of bot ready event
* @prop {Object} threadGuildMap Object mapping thread channel IDs to guild IDs
* @prop {Collection<UnavailableGuild>} unavailableGuilds Collection of unavailable guilds the bot is in
* @prop {Number} uptime How long in milliseconds the bot has been up for
* @prop {ExtendedUser} user The bot user
* @prop {Collection<User>} users Collection of users the bot sees
* @prop {Collection<VoiceConnection>} voiceConnections Extended collection of active VoiceConnections the bot has
*/
class Client extends EventEmitter {
    /**
    * Create a Client
    * @arg {String} token The auth token to use. Bot tokens should be prefixed with `Bot` (e.g. `Bot MTExIHlvdSAgdHJpZWQgMTEx.O5rKAA.dQw4w9WgXcQ_wpV-gGA4PSk_bm8`).
    * @arg {Object} options Dysnomia client options
    * @arg {Object} [options.allowedMentions] A list of mentions to allow by default in createMessage/editMessage
    * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here
    * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
    * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
    * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
    * @arg {String} [options.defaultImageFormat="jpg"] The default format to provide user avatars, guild icons, and group icons in. Can be "jpg", "png", "gif", or "webp"
    * @arg {Number} [options.defaultImageSize=128] The default size to return user avatars, guild icons, banners, splashes, and group icons. Can be any power of two between 16 and 2048. If the height and width are different, the width will be the value specified, and the height relative to that
    * @arg {Object} [options.gateway] Options for gateway connections
    * @arg {Boolean} [options.gateway.autoreconnect=true] Have Dysnomia autoreconnect when connection is lost
    * @arg {Boolean} [options.gateway.compress=false] Whether to request WebSocket data to be compressed or not
    * @arg {Number} [options.gateway.connectionTimeout=30000] How long in milliseconds to wait for the connection to handshake with the server
    * @arg {Object} [options.gateway.disableEvents] If disableEvents[eventName] is true, the WS event will not be processed. This can cause significant performance increase on large bots. [A full list of the WS event names in Discord's documentation](https://discord.com/developers/docs/topics/gateway-events#receive-events)
    * @arg {Number} [options.gateway.firstShardID=0] The ID of the first shard to run for this client
    * @arg {Boolean} [options.gateway.getAllUsers=false] Get all the users in every guild. Ready time will be severely delayed
    * @arg {Number} [options.gateway.guildCreateTimeout=2000] How long in milliseconds to wait for a GUILD_CREATE before "ready" is fired. Increase this value if you notice missing guilds
    * @arg {Number | Array<String | Number>} [options.gateway.intents] A list of [intent names](https://github.com/projectdysnomia/dysnomia/blob/dev/lib/Constants.js#L311), pre-shifted intent numbers to add, or a raw bitmask value describing the intents to subscribe to. Some intents, like `guildPresences` and `guildMembers`, must be enabled on your application's page to be used. By default, all non-privileged intents are enabled.
    * @arg {Number} [options.gateway.largeThreshold=250] The maximum number of offline users per guild during initial guild data transmission
    * @arg {Number} [options.gateway.lastShardID=options.maxShards - 1] The ID of the last shard to run for this client
    * @arg {Number} [options.gateway.maxReconnectAttempts=Infinity] The maximum amount of times that the client is allowed to try to reconnect to Discord.
    * @arg {Number} [options.gateway.maxResumeAttempts=10] The maximum amount of times a shard can attempt to resume a session before considering that session invalid.
    * @arg {Number | String} [options.gateway.maxConcurrency=1] The number of shards that can start simultaneously. If "auto" Dysnomia will use Discord's recommended shard concurrency.
    * @arg {Number | String} [options.gateway.maxShards=1] The total number of shards you want to run. If "auto" Dysnomia will use Discord's recommended shard count.
    * @arg {Function} [options.gateway.reconnectDelay] A function which returns how long the bot should wait until reconnecting to Discord.
    * @arg {Boolean} [options.gateway.seedVoiceConnections=false] Whether to populate bot.voiceConnections with existing connections the bot account has during startup. Note that this will disconnect connections from other bot sessions
    * @arg {Number | String} [options.maxShards=1] The total number of shards you want to run. If "auto" Dysnomia will use Discord's recommended shard count. This option has been moved under `options.gateway`
    * @arg {Number} [options.messageLimit=100] The maximum size of a channel message cache
    * @arg {Boolean} [options.opusOnly=false] Whether to suppress the Opus encoder not found error or not
    * @arg {Object} [options.rest] Options for the REST request handler
    * @arg {Object} [options.rest.agent] A HTTPS Agent (if https: true, default) or an HTTP agent (if https: false) used to proxy requests
    * @arg {String} [options.rest.baseURL] The base URL to use for API requests. Defaults to `/api/v${REST_VERSION}`
    * @arg {Boolean} [options.rest.disableLatencyCompensation=false] Whether to disable the built-in latency compensator or not
    * @arg {String} [options.rest.domain="discord.com"] The domain to use for API requests
    * @arg {Boolean} [options.rest.https=true] Whether to make requests to the Discord API over HTTPS (true) or HTTP (false)
    * @arg {Number} [options.rest.latencyThreshold=30000] The average request latency at which Dysnomia will start emitting latency errors
    * @arg {Number} [options.rest.ratelimiterOffset=0] A number of milliseconds to offset the ratelimit timing calculations by
    * @arg {Number} [options.rest.requestTimeout=15000] A number of milliseconds before REST requests are considered timed out
    * @arg {Boolean} [options.restMode=false] Whether to enable getting objects over REST. Even with this option enabled, it is recommended that you check the cache first before using REST
    * @arg {Object} [options.ws] An object of WebSocket options to pass to the shard WebSocket constructors
    */
    constructor(token, options) {
        super();

        this.options = Object.assign({
            allowedMentions: {
                users: true,
                roles: true
            },
            defaultImageFormat: "jpg",
            defaultImageSize: 128,
            messageLimit: 100,
            opusOnly: false,
            rest: {},
            restMode: false,
            ws: {},
            gateway: {}
        }, options);
        this.options.allowedMentions = this._formatAllowedMentions(this.options.allowedMentions);
        if(!Constants.ImageFormats.includes(this.options.defaultImageFormat.toLowerCase())) {
            throw new TypeError(`Invalid default image format: ${this.options.defaultImageFormat}`);
        }
        const defaultImageSize = this.options.defaultImageSize;
        if(defaultImageSize < Constants.ImageSizeBoundaries.MINIMUM || defaultImageSize > Constants.ImageSizeBoundaries.MAXIMUM || (defaultImageSize & (defaultImageSize - 1))) {
            throw new TypeError(`Invalid default image size: ${defaultImageSize}`);
        }
        // Set HTTP Agent on Websockets if not already set
        if(this.options.rest.agent && !(this.options.ws && this.options.ws.agent)) {
            this.options.ws = this.options.ws || {};
            this.options.ws.agent = this.options.rest.agent;
        }

        Object.defineProperty(this, "_token", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: token
        });

        this.requestHandler = new RequestHandler(this, this.options.rest);
        delete this.options.rest;

        this.shards = new ShardManager(this, this.options.gateway);
        delete this.options.gateway;

        this.ready = false;
        this.bot = this._token.startsWith("Bot ");
        this.startTime = 0;
        this.lastConnect = 0;
        this.channelGuildMap = {};
        this.threadGuildMap = {};
        this.guilds = new Collection(Guild);
        this.privateChannelMap = {};
        this.privateChannels = new Collection(PrivateChannel);
        this.guildShardMap = {};
        this.unavailableGuilds = new Collection(UnavailableGuild);
        this.users = new Collection(User);
        this.presence = {
            activities: null,
            afk: false,
            since: null,
            status: "offline"
        };
        this.voiceConnections = new VoiceConnectionManager();

        this.connect = this.connect.bind(this);
        this.lastReconnectDelay = 0;
        this.reconnectAttempts = 0;
    }

    get uptime() {
        return this.startTime ? Date.now() - this.startTime : 0;
    }

    /**
    * Add a guild discovery subcategory
    * @arg {String} guildID The ID of the guild
    * @arg {String} categoryID The ID of the discovery category
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>}
    */
    addGuildDiscoverySubcategory(guildID, categoryID, reason) {
        return this.requestHandler.request("POST", Endpoints.GUILD_DISCOVERY_CATEGORY(guildID, categoryID), true, {reason});
    }

    /**
    * Add a role to a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    addGuildMemberRole(guildID, memberID, roleID, reason) {
        return this.requestHandler.request("PUT", Endpoints.GUILD_MEMBER_ROLE(guildID, memberID, roleID), true, {
            reason
        });
    }

    /**
    * Add a reaction to a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    addMessageReaction(channelID, messageID, reaction) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }
        return this.requestHandler.request("PUT", Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, reaction, "@me"), true);
    }

    /**
    * Ban a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {Number} [options.deleteMessageSeconds=0] Number of seconds to delete messages for, between 0 and 604800 inclusive
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    banGuildMember(guildID, userID, options) {
        return this.requestHandler.request("PUT", Endpoints.GUILD_BAN(guildID, userID), true, {
            delete_message_seconds: options.deleteMessageSeconds || 0,
            reason: options.reason
        });
    }

    /**
    * Edits command permissions for a multiple commands in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} guildID The guild ID
    * @arg {Array<Object>} permissions An array of [partial guild command permissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure)
    * @returns {Promise<Array<Object>>} Returns an array of [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) objects.
    */
    bulkEditCommandPermissions(guildID, permissions) {
        return this.requestHandler.request("PUT", Endpoints.GUILD_COMMAND_PERMISSIONS(this.application.id, guildID), true, permissions);
    }

    /**
    * Bulk create/edit global application commands
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @returns {Promise<ApplicationCommand[]>}
    */
    bulkEditCommands(commands) {
        for(const command of commands) {
            if(command.name !== undefined && command.type === 1) {
                command.name = command.name.toLowerCase();
            }
            if(command.defaultMemberPermissions !== undefined) {
                command.defaultMemberPermissions = command.defaultMemberPermissions instanceof Permission ? String(command.defaultMemberPermissions.allow) : String(command.defaultMemberPermissions);
            }
            command.default_member_permissions = command.defaultMemberPermissions;
            command.dm_permission = command.dmPermission;
            command.description_localizations = command.descriptionLocalizations;
            command.name_localizations = command.nameLocalizations;
        }
        return this.requestHandler.request("PUT", Endpoints.COMMANDS(this.application.id), true, commands).then((applicationCommands) => applicationCommands.map((applicationCommand) => new ApplicationCommand(applicationCommand, this)));
    }

    /**
    * Bulk create/edit guild application commands
    * @arg {String} guildID Guild id to create the commands in
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @returns {ApplicationCommand[]} Resolves with an array of commands objects
    */
    bulkEditGuildCommands(guildID, commands) {
        for(const command of commands) {
            if(command.name !== undefined && command.type === 1) {
                command.name = command.name.toLowerCase();
            }
            if(command.defaultMemberPermissions !== undefined) {
                command.defaultMemberPermissions = command.defaultMemberPermissions instanceof Permission ? String(command.defaultMemberPermissions.allow) : String(command.defaultMemberPermissions);
            }
            command.default_member_permissions = command.defaultMemberPermissions;
            command.description_localizations = command.descriptionLocalizations;
            command.name_localizations = command.nameLocalizations;
        }
        return this.requestHandler.request("PUT", Endpoints.GUILD_COMMANDS(this.application.id, guildID), true, commands).then((applicationCommands) => applicationCommands.map((applicationCommand) => new ApplicationCommand(applicationCommand, this)));
    }

    /**
    * Closes a voice connection with a guild ID
    * @arg {String} guildID The ID of the guild
    */
    closeVoiceConnection(guildID) {
        this.shards.get(this.guildShardMap[guildID] || 0).sendWS(Constants.GatewayOPCodes.VOICE_STATE_UPDATE, {
            guild_id: guildID || null,
            channel_id: null,
            self_mute: false,
            self_deaf: false
        });
        this.voiceConnections.leave(guildID);
    }

    /**
    * Tells all shards to connect. This will call `getBotGateway()`, which is ratelimited.
    * @returns {Promise} Resolves when all shards are initialized
    */
    async connect() {
        if(typeof this._token !== "string") {
            throw new Error(`Invalid token "${this._token}"`);
        }
        try {
            const data = await (this.shards.options.maxShards === "auto" || (this.shards.options.shardConcurrency === "auto" && this.bot) ? this.getBotGateway() : this.getGateway());
            if(!data.url || (this.shards.options.maxShards === "auto" && !data.shards)) {
                throw new Error("Invalid response from gateway REST call");
            }
            if(data.url.includes("?")) {
                data.url = data.url.substring(0, data.url.indexOf("?"));
            }
            if(!data.url.endsWith("/")) {
                data.url += "/";
            }
            this.gatewayURL = `${data.url}?v=${Constants.GATEWAY_VERSION}&encoding=${Erlpack ? "etf" : "json"}`;

            if(this.shards.options.compress) {
                this.gatewayURL += "&compress=zlib-stream";
            }

            if(this.shards.options.maxShards === "auto") {
                if(!data.shards) {
                    throw new Error("Failed to autoshard due to lack of data from Discord.");
                }
                this.shards.options.maxShards = data.shards;
                if(this.shards.options.lastShardID === undefined) {
                    this.shards.options.lastShardID = data.shards - 1;
                }
            }

            if(this.shards.options.shardConcurrency === "auto" && data.session_start_limit && typeof data.session_start_limit.max_concurrency === "number") {
                this.shards.options.maxConcurrency = data.session_start_limit.max_concurrency;
            }

            for(let i = this.shards.options.firstShardID; i <= this.shards.options.lastShardID; ++i) {
                this.shards.spawn(i);
            }
        } catch(err) {
            if(!this.shards.options.autoreconnect) {
                throw err;
            }
            const reconnectDelay = this.shards.options.reconnectDelay(this.lastReconnectDelay, this.reconnectAttempts);
            await sleep(reconnectDelay);
            this.lastReconnectDelay = reconnectDelay;
            this.reconnectAttempts = this.reconnectAttempts + 1;
            return this.connect();
        }
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
     * @arg {Object} [options.triggerMetadata] The [trigger metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) for the rule
     * @arg {Number} options.triggerType The [trigger type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types) of the rule
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Object>}
     */
    createAutoModerationRule(guildID, options) {
        return this.requestHandler.request("POST", Endpoints.AUTO_MODERATION_RULES(guildID), true, {
            actions: options.actions,
            enabled: options.enabled,
            event_type: options.eventType,
            exempt_channels: options.exemptChannels,
            exempt_roles: options.exemptRoles,
            name: options.name,
            trigger_metadata: options.triggerMetadata,
            trigger_type: options.triggerType
        });
    }

    /**
    * Create a channel in a guild
    * @arg {String} guildID The ID of the guild to create the channel in
    * @arg {String} name The name of the channel
    * @arg {String} [type=0] The type of the channel, either 0 (text), 2 (voice), 4 (category), 5 (news), or 13 (stage)
    * @arg {Object | String} [options] The properties the channel should have.
    * @arg {Number} [options.bitrate] The bitrate of the channel (voice channels only)
    * @arg {Boolean} [options.nsfw] The nsfw status of the channel
    * @arg {String?} [options.parentID] The ID of the parent category channel for this channel
    * @arg {Array<Object>} [options.permissionOverwrites] An array containing permission overwrite objects
    * @arg {Number} [options.position] The sorting position of the channel
    * @arg {Number} [options.rateLimitPerUser] The time in seconds a user has to wait before sending another message (does not affect bots or users with manageMessages/manageChannel permissions) (text channels only)
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @arg {String} [options.topic] The topic of the channel (text channels only)
    * @arg {Number} [options.userLimit] The channel user limit (voice channels only)
    * @returns {Promise<CategoryChannel | TextChannel | TextVoiceChannel>}
    */
    createChannel(guildID, name, type, options = {}) {
        return this.requestHandler.request("POST", Endpoints.GUILD_CHANNELS(guildID), true, {
            name: name,
            type: type,
            bitrate: options.bitrate,
            nsfw: options.nsfw,
            parent_id: options.parentID,
            permission_overwrites: options.permissionOverwrites,
            position: options.position,
            rate_limit_per_user: options.rateLimitPerUser,
            reason: options.reason,
            topic: options.topic,
            user_limit: options.userLimit
        }).then((channel) => Channel.from(channel, this));
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
    createChannelInvite(channelID, options = {}, reason) {
        return this.requestHandler.request("POST", Endpoints.CHANNEL_INVITES(channelID), true, {
            max_age: options.maxAge,
            max_uses: options.maxUses,
            target_application_id: options.targetApplicationID,
            target_type: options.targetType,
            target_user_id: options.targetUserID,
            temporary: options.temporary,
            unique: options.unique,
            reason: reason
        }).then((invite) => new Invite(invite, this));
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
    createChannelWebhook(channelID, options, reason) {
        options.reason = reason;
        return this.requestHandler.request("POST", Endpoints.CHANNEL_WEBHOOKS(channelID), true, options);
    }

    /**
    * Create a global application command
    * @arg {Object} command A command object
    * @arg {String} command.name The command name
    * @arg {Number} command.type The [type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types) of command
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {BigInt | Number | String | Permission?} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @arg {Boolean} [command.dmPermission=true] If this command can be used in direct messages
    * @returns {Promise<ApplicationCommand>}
    */
    createCommand(command) {
        if(command.name !== undefined && command.type === 1) {
            command.name = command.name.toLowerCase();
        }
        if(command.defaultMemberPermissions !== undefined) {
            command.defaultMemberPermissions = command.defaultMemberPermissions instanceof Permission ? String(command.defaultMemberPermissions.allow) : String(command.defaultMemberPermissions);
        }
        command.default_member_permissions = command.defaultMemberPermissions;
        command.dm_permission = command.dmPermission;
        command.description_localizations = command.descriptionLocalizations;
        command.name_localizations = command.nameLocalizations;
        return this.requestHandler.request("POST", Endpoints.COMMANDS(this.application.id), true, command).then((applicationCommand) => new ApplicationCommand(applicationCommand, this));
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
    * @arg {String} [options.systemChannelID] The ID of the system channel
    * @arg {Number} [options.verificationLevel] The guild verification level
    * @returns {Promise<Guild>}
    */
    createGuild(name, options) {
        if(this.guilds.size > 9) {
            throw new Error("This method can't be used when in 10 or more guilds.");
        }

        return this.requestHandler.request("POST", Endpoints.GUILDS, true, {
            name: name,
            icon: options.icon,
            verification_level: options.verificationLevel,
            default_message_notifications: options.defaultNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_id: options.systemChannelID,
            afk_channel_id: options.afkChannelID,
            afk_timeout: options.afkTimeout,
            roles: options.roles,
            channels: options.channels
        }).then((guild) => new Guild(guild, this));
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
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {BigInt | Number | String | Permission?} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @returns {Promise<ApplicationCommand>}
    */
    createGuildCommand(guildID, command) {
        if(command.name !== undefined && command.type === 1) {
            command.name = command.name.toLowerCase();
        }
        if(command.defaultMemberPermissions !== undefined) {
            command.defaultMemberPermissions = command.defaultMemberPermissions instanceof Permission ? String(command.defaultMemberPermissions.allow) : String(command.defaultMemberPermissions);
        }
        command.default_member_permissions = command.defaultMemberPermissions;
        command.description_localizations = command.descriptionLocalizations;
        command.name_localizations = command.nameLocalizations;
        return this.requestHandler.request("POST", Endpoints.GUILD_COMMANDS(this.application.id, guildID), true, command).then((applicationCommand) => new ApplicationCommand(applicationCommand, this));
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
    createGuildEmoji(guildID, options, reason) {
        options.reason = reason;
        return this.requestHandler.request("POST", Endpoints.GUILD_EMOJIS(guildID), true, options);
    }

    /**
    * Create a guild based on a template. This can only be used with bots in less than 10 guilds
    * @arg {String} code The template code
    * @arg {String} name The name of the guild
    * @arg {String} [icon] The 128x128 icon as a base64 data URI
    * @returns {Promise<Guild>}
    */
    createGuildFromTemplate(code, name, icon) {
        return this.requestHandler.request("POST", Endpoints.GUILD_TEMPLATE(code), true, {
            name,
            icon
        }).then((guild) => new Guild(guild, this));
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
    createGuildScheduledEvent(guildID, event, reason) {
        return this.requestHandler.request("POST", Endpoints.GUILD_SCHEDULED_EVENTS(guildID), true, {
            channel_id: event.channelID,
            description: event.description,
            entity_metadata: event.entityMetadata,
            entity_type: event.entityType,
            image: event.image,
            name: event.name,
            privacy_level: event.privacyLevel,
            scheduled_end_time: event.scheduledEndTime,
            scheduled_start_time: event.scheduledStartTime,
            reason: reason
        }).then((data) => new GuildScheduledEvent(data, this));
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
    createGuildSticker(guildID, options, reason) {
        // TODO(TTtie): This is wrong and should be redone ASAP
        return this.requestHandler.request("POST", Endpoints.GUILD_STICKERS(guildID), true, {
            description: options.description,
            name: options.name,
            tags: options.tags,
            reason: reason
        }, [
            {
                fieldName: "description",
                file: options.description
            },{
                ...options.file,
                fieldName: "file"
            }, {
                fieldName: "tags",
                file: options.tags
            }, {
                fieldName: "name",
                file: options.name
            }]
        );
    }

    /**
    * Create a template for a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} name The name of the template
    * @arg {String} [description] The description for the template
    * @returns {Promise<GuildTemplate>}
    */
    createGuildTemplate(guildID, name, description) {
        return this.requestHandler.request("POST", Endpoints.GUILD_TEMPLATES(guildID), true, {
            name,
            description
        }).then((template) => new GuildTemplate(template, this));
    }

    // TODO(TTtie): Either docs for this need rewriting (removing special handling) or more special cases must be handled here.
    /**
    * Respond to the interaction with a message
    * Note: Use webhooks if you have already responded with an interaction response.
    * @arg {String} interactionID The interaction ID.
    * @arg {String} interactionToken The interaction Token.
    * @arg {Object} options The options object.
    * @arg {Object} [options.data] The data to send with the response.
    * @arg {Object} [options.data.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [options.data.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean} [options.data.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
    * @arg {Boolean | Array<String>} [options.data.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [options.data.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [options.data.attachments] The files to attach to the message
    * @arg {Buffer} options.data.attachments.file A buffer containing file data
    * @arg {String} options.data.attachments.filename What to name the file
    * @arg {String} [options.data.attachments.description] A description for the attachment
    * @arg {Array<Object>} [options.data.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.data.content] A content string
    * @arg {Object} [options.data.embed] An embed object. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<Object>} [options.data.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Boolean} [options.data.flags] A number representing the flags to apply to the response. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {Boolean} [options.data.tts] Set the message TTS flag
    * @arg {Number} options.type The response type to send. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type) for valid types
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise}
    */
    createInteractionResponse(interactionID, interactionToken, options, file) {
        if(options.data) {
            if(options.data.embed) {
                if(!options.data.embeds) {
                    options.data.embeds = [];
                }
                options.data.embeds.push(options.data.embed);
            }

            if(file) {
                emitDeprecation("CREATE_INTERACTION_RESPONSE_FILE");
                this.emit("warn", "[DEPRECATED] A file property has been passed to createInteractionResponse(). This will be removed in future versions.");

                if(!options.data.attachments) {
                    options.data.attachments = [];
                }

                // This might be sub-optimal as this gets transformed back to the same structure
                if(Array.isArray(file)) {
                    Array.prototype.push.apply(options.data.attachments, file.map((file) => ({
                        filename: file.name,
                        file: file.file
                    })));
                } else {
                    options.data.attachments.push({
                        filename: file.name,
                        file: file.file
                    });
                }

            }
        }

        const [files, attachments] = this._processAttachments(options.data && options.data.attachments);
        if(attachments) {
            options.data.attachments = attachments;
        }

        return this.requestHandler.request("POST", Endpoints.INTERACTION_RESPOND(interactionID, interactionToken), true, options, files, "/interactions/:id/:token/callback");
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
    * @arg {Buffer} content.attachments.file A buffer containing file data
    * @arg {String} content.attachments.filename What to name the file
    * @arg {String} [content.attachments.description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Object} [content.embed] An embed object. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object} [content.messageReference] The message reference, used when replying to messages
    * @arg {String} [content.messageReference.channelID] The channel ID of the referenced message
    * @arg {Boolean} [content.messageReference.failIfNotExists=true] Whether to throw an error if the message reference doesn't exist. If false, and the referenced message doesn't exist, the message is created without a referenced message
    * @arg {String} [content.messageReference.guildID] The guild ID of the referenced message
    * @arg {String} content.messageReference.messageID The message ID of the referenced message. This cannot reference a system message
    * @arg {Array<String>} [content.stickerIDs] An array of IDs corresponding to stickers to send
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them). Use `content.attachments` instead
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise<Message>}
    */
    createMessage(channelID, content, file) {
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
            content.allowed_mentions = this._formatAllowedMentions(content.allowedMentions);
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
            if(file) {
                emitDeprecation("CREATE_MESSAGE_FILE");
                this.emit("warn", "[DEPRECATED] A file parameter has been passed to createMessage(). This will be removed in future versions.");

                if(!content.attachments) {
                    content.attachments = [];
                }

                // This might be sub-optimal as this gets transformed back to the same structure
                if(Array.isArray(file)) {
                    Array.prototype.push.apply(content.attachments, file.map((file) => ({
                        filename: file.name,
                        file: file.file
                    })));
                } else {
                    content.attachments.push({
                        filename: file.name,
                        file: file.file
                    });
                }
            }
        }

        const [files, attachments] = this._processAttachments(content.attachments);
        content.attachments = attachments;

        return this.requestHandler.request("POST", Endpoints.CHANNEL_MESSAGES(channelID), true, content, files).then((message) => new Message(message, this));
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
    createRole(guildID, options, reason) {
        if(options.permissions !== undefined) {
            options.permissions = options.permissions instanceof Permission ? String(options.permissions.allow) : String(options.permissions);
        }
        return this.requestHandler.request("POST", Endpoints.GUILD_ROLES(guildID), true, {
            name: options.name,
            permissions: options.permissions,
            color: options.color,
            hoist: options.hoist,
            icon: options.icon,
            mentionable: options.mentionable,
            unicode_emoji: options.unicodeEmoji,
            reason: reason
        }).then((role) => {
            const guild = this.guilds.get(guildID);
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
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public, 2 is guild only
    * @arg {String} options.topic The stage instance topic
    * @returns {Promise<StageInstance>}
    */
    createStageInstance(channelID, options) {
        return this.requestHandler.request("POST", Endpoints.STAGE_INSTANCES, true, {
            channel_id: channelID,
            privacy_level: options.privacyLevel,
            topic: options.topic
        }).then((instance) => new StageInstance(instance, this));
    }

    /**
    * Create a thread with an existing message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message to create the thread from
    * @arg {Object} options The thread options
    * @arg {Number} options.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
    * @arg {String} options.name The thread channel name
    * @returns {Promise<NewsThreadChannel | PublicThreadChannel>}
    */
    createThreadWithMessage(channelID, messageID, options) {
        return this.requestHandler.request("POST", Endpoints.THREAD_WITH_MESSAGE(channelID, messageID), true, {
            name: options.name,
            auto_archive_duration: options.autoArchiveDuration
        }).then((channel) => Channel.from(channel, this));
    }

    /**
    * Create a thread without an existing message
    * @arg {String} channelID The ID of the channel
    * @arg {Object} options The thread options
    * @arg {Number} options.autoArchiveDuration Duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080
    * @arg {Boolean} [options.invitable] Whether non-moderators can add other non-moderators to the thread (private threads only)
    * @arg {String} options.name The thread channel name
    * @arg {Number} [options.type] The channel type of the thread to create. It is recommended to explicitly set this property as this will be a required property in API v10
    * @returns {Promise<PrivateThreadChannel>}
    */
    createThreadWithoutMessage(channelID, options) {
        return this.requestHandler.request("POST", Endpoints.THREAD_WITHOUT_MESSAGE(channelID), true, {
            auto_archive_duration: options.autoArchiveDuration,
            invitable: options.invitable,
            name: options.name,
            type: options.type
        }).then((channel) => Channel.from(channel, this));
    }

    /**
     * Crosspost (publish) a message to subscribed channels
     * @arg {String} channelID The ID of the NewsChannel
     * @arg {String} messageID The ID of the message
     * @returns {Promise<Message>}
     */
    crosspostMessage(channelID, messageID) {
        return this.requestHandler.request("POST", Endpoints.CHANNEL_CROSSPOST(channelID, messageID), true).then((message) => new Message(message, this));
    }

    /**
     * Delete an auto moderation rule
     * @arg {String} guildID The guildID to delete the rule from
     * @arg {String} ruleID The ID of the rule to delete
     * @arg {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    deleteAutoModerationRule(guildID, ruleID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.AUTO_MODERATION_RULE(guildID, ruleID), true, {
            reason
        });
    }

    /**
    * Delete a guild channel, or leave a private channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteChannel(channelID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL(channelID), true, {
            reason
        });
    }

    /**
    * Delete a channel permission overwrite
    * @arg {String} channelID The ID of the channel
    * @arg {String} overwriteID The ID of the overwritten user or role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteChannelPermission(channelID, overwriteID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL_PERMISSION(channelID, overwriteID), true, {
            reason
        });
    }

    /**
    * Delete a global application command
    * @arg {String} commandID The command id
    * @returns {Promise}
    */
    deleteCommand(commandID) {
        return this.requestHandler.request("DELETE", Endpoints.COMMAND(this.application.id, commandID), true);
    }

    /**
    * Delete a guild (bot user must be owner)
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    */
    deleteGuild(guildID) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD(guildID), true);
    }

    /**
    * Delete a guild application command
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @returns {Promise}
    */
    deleteGuildCommand(guildID, commandID) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_COMMAND(this.application.id, guildID, commandID), true);
    }

    /**
    * Delete a guild discovery subcategory
    * @arg {String} guildID The ID of the guild
    * @arg {String} categoryID The ID of the discovery category
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteGuildDiscoverySubcategory(guildID, categoryID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_DISCOVERY_CATEGORY(guildID, categoryID), true, {reason});
    }

    /**
    * Delete a guild emoji object
    * @arg {String} guildID The ID of the guild to delete the emoji in
    * @arg {String} emojiID The ID of the emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteGuildEmoji(guildID, emojiID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_EMOJI(guildID, emojiID), true, {
            reason
        });
    }

    /**
    * Delete a guild integration
    * @arg {String} guildID The ID of the guild
    * @arg {String} integrationID The ID of the integration
    * @returns {Promise}
    */
    deleteGuildIntegration(guildID, integrationID) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_INTEGRATION(guildID, integrationID), true);
    }

    /**
    * Delete a guild scheduled event
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the event
    * @returns {Promise}
    */
    deleteGuildScheduledEvent(guildID, eventID) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_SCHEDULED_EVENT(guildID, eventID), true);
    }

    /**
    * Delete a guild sticker
    * @arg {String} guildID The ID of the guild
    * @arg {String} stickerID The ID of the sticker
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteGuildSticker(guildID, stickerID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_STICKER(guildID, stickerID), true, {
            reason
        });
    }

    /**
    * Delete a guild template
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    deleteGuildTemplate(guildID, code) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_TEMPLATE_GUILD(guildID, code), true).then((template) => new GuildTemplate(template, this));
    }

    /**
    * Delete an invite
    * @arg {String} inviteID The ID of the invite
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteInvite(inviteID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.INVITE(inviteID), true, {
            reason
        });
    }

    /**
    * Delete a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessage(channelID, messageID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL_MESSAGE(channelID, messageID), true, {
            reason
        });
    }

    /**
    * Bulk delete messages (bot accounts only)
    * @arg {String} channelID The ID of the channel
    * @arg {Array<String>} messageIDs Array of message IDs to delete
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteMessages(channelID, messageIDs, reason) {
        if(messageIDs.length === 0) {
            return Promise.resolve();
        }
        if(messageIDs.length === 1) {
            return this.deleteMessage(channelID, messageIDs[0], reason);
        }

        const oldestAllowedSnowflake = (Date.now() - 1421280000000) * 4194304;
        const invalidMessage = messageIDs.find((messageID) => messageID < oldestAllowedSnowflake);
        if(invalidMessage) {
            return Promise.reject(new Error(`Message ${invalidMessage} is more than 2 weeks old.`));
        }

        if(messageIDs.length > 100) {
            return this.requestHandler.request("POST", Endpoints.CHANNEL_BULK_DELETE(channelID), true, {
                messages: messageIDs.splice(0, 100),
                reason: reason
            }).then(() => this.deleteMessages(channelID, messageIDs, reason));
        }
        return this.requestHandler.request("POST", Endpoints.CHANNEL_BULK_DELETE(channelID), true, {
            messages: messageIDs,
            reason: reason
        });
    }

    /**
    * Delete a guild role
    * @arg {String} guildID The ID of the guild to create the role in
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteRole(guildID, roleID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_ROLE(guildID, roleID), true, {
            reason
        });
    }

    /**
    * Delete a stage instance
    * @arg {String} channelID The stage channel associated with the instance
    * @returns {Promise}
    */
    deleteStageInstance(channelID) {
        return this.requestHandler.request("DELETE", Endpoints.STAGE_INSTANCE(channelID), true);
    }

    /**
    * Delete a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteWebhook(webhookID, token, reason) {
        return this.requestHandler.request("DELETE", token ? Endpoints.WEBHOOK_TOKEN(webhookID, token) : Endpoints.WEBHOOK(webhookID), !token, {
            reason
        });
    }

    /**
    * Delete a webhook message
    * @arg {String} webhookID
    * @arg {String} token
    * @arg {String} messageID
    * @returns {Promise}
    */
    deleteWebhookMessage(webhookID, token, messageID) {
        return this.requestHandler.request("DELETE", Endpoints.WEBHOOK_MESSAGE(webhookID, token, messageID), false);
    }

    /**
    * Disconnects all shards
    * @arg {Object?} [options] Shard disconnect options
    * @arg {String | Boolean} [options.reconnect] false means destroy everything, true means you want to reconnect in the future, "auto" will autoreconnect
    */
    disconnect(options) {
        this.ready = false;
        this.shards.forEach((shard) => {
            shard.disconnect(options);
        });
        this.shards.connectQueue = [];
    }

    /**
    * Update the bot's AFK status. Setting this to true will enable push notifications for userbots.
    * @arg {Boolean} afk Whether the bot user is AFK or not
    */
    editAFK(afk) {
        this.presence.afk = !!afk;

        this.shards.forEach((shard) => {
            shard.editAFK(afk);
        });
    }

    /**
     * edit an existing auto moderation rule
     * @arg {String} guildID the ID of the guild to edit the rule in
     * @arg {String} ruleID The ID of the rule to edit
     * @arg {Object} options The rule to create
     * @arg {Object[]} [options.actions] The [actions](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object) done when the rule is violated
     * @arg {Boolean} [options.enabled=false] If the rule is enabled, false by default
     * @arg {Number} [options.eventType] The [event type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types) for the rule
     * @arg {String[]} [options.exemptChannels] Any channels where this rule does not apply
     * @arg {String[]} [options.exemptRoles] Any roles to which this rule does not apply
     * @arg {String} [options.name] The name of the rule
     * @arg {Object} [options.triggerMetadata] The [trigger metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) for the rule
     * @arg {Number} [options.triggerType] The [trigger type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types) of the rule
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Object>}
     */
    editAutoModerationRule(guildID, ruleID, options) {
        return this.requestHandler.request("PATCH", Endpoints.AUTO_MODERATION_RULE(guildID, ruleID), true, {
            actions: options.actions,
            enabled: options.enabled,
            event_type: options.eventType,
            exempt_channels: options.exemptChannels,
            exempt_roles: options.exemptRoles,
            name: options.name,
            trigger_metadata: options.triggerMetadata,
            trigger_type: options.triggerType
        });
    }

    /**
    * Edit a channel's properties
    * @arg {String} channelID The ID of the channel
    * @arg {Object} options The properties to edit
    * @arg {Boolean} [options.archived] The archive status of the channel (thread channels only)
    * @arg {Number} [options.autoArchiveDuration] The duration in minutes to automatically archive the thread after recent activity, either 60, 1440, 4320 or 10080 (thread channels only)
    * @arg {Number} [options.bitrate] The bitrate of the channel (guild voice channels only)
    * @arg {Number?} [options.defaultAutoArchiveDuration] The default duration of newly created threads in minutes to automatically archive the thread after inactivity (60, 1440, 4320, 10080) (guild text/news channels only)
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
    * @returns {Promise<CategoryChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>}
    */
    editChannel(channelID, options, reason) {
        return this.requestHandler.request("PATCH", Endpoints.CHANNEL(channelID), true, {
            archived: options.archived,
            auto_archive_duration: options.autoArchiveDuration,
            bitrate: options.bitrate,
            default_auto_archive_duration: options.defaultAutoArchiveDuration,
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
            permission_overwrites: options.permissionOverwrites,
            reason: reason
        }).then((channel) => Channel.from(channel, this));
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
    editChannelPermission(channelID, overwriteID, allow, deny, type, reason) {
        if(typeof type === "string") { // backward compatibility
            type = type === "member" ? 1 : 0;
        }
        return this.requestHandler.request("PUT", Endpoints.CHANNEL_PERMISSION(channelID, overwriteID), true, {
            allow,
            deny,
            type,
            reason
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
    editChannelPosition(channelID, position, options = {}) {
        let channels = this.guilds.get(this.channelGuildMap[channelID]).channels;
        const channel = channels.get(channelID);
        if(!channel) {
            return Promise.reject(new Error(`Channel ${channelID} not found`));
        }
        if(channel.position === position) {
            return Promise.resolve();
        }
        const min = Math.min(position, channel.position);
        const max = Math.max(position, channel.position);
        channels = channels.filter((chan) => {
            return chan.type === channel.type
                && min <= chan.position
                && chan.position <= max
                && chan.id !== channelID;
        }).sort((a, b) => a.position - b.position);
        if(position > channel.position) {
            channels.push(channel);
        } else {
            channels.unshift(channel);
        }
        return this.requestHandler.request("PATCH", Endpoints.GUILD_CHANNELS(this.channelGuildMap[channelID]), true, channels.map((channel, index) => ({
            id: channel.id,
            position: index + min,
            lock_permissions: options.lockPermissions,
            parent_id: options.parentID
        })));
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
    editChannelPositions(guildID, channelPositions) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_CHANNELS(guildID), true, channelPositions.map((channelPosition) => {
            return {
                id: channelPosition.id,
                position: channelPosition.position,
                lock_permissions: channelPosition.lockPermissions,
                parent_id: channelPosition.parentID
            };
        }));
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
    * @arg {bigint | number | string | Permission?} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @arg {String} [command.defaultMemberPermissions] The [permissions](https://discord.com/developers/docs/topics/permissions) required by default for this command to be usable
    * @arg {Boolean} [command.dmPermission] If this command can be used in direct messages
    * @returns {Promise<ApplicationCommand>}
    */
    editCommand(commandID, command) {
        if(command.name !== undefined && command.type === 1) {
            command.name = command.name.toLowerCase();
        }
        if(command.defaultMemberPermissions !== undefined) {
            command.defaultMemberPermissions = command.defaultMemberPermissions instanceof Permission ? String(command.defaultMemberPermissions.allow) : String(command.defaultMemberPermissions);
        }
        command.default_member_permissions = command.defaultMemberPermissions;
        command.dm_permission = command.dmPermission;
        command.description_localizations = command.descriptionLocalizations;
        command.name_localizations = command.nameLocalizations;
        return this.requestHandler.request("PATCH", Endpoints.COMMAND(this.application.id, commandID), true, command).then((applicationCommand) => new ApplicationCommand(applicationCommand, this));
    }

    /**
    * Edits command permissions for a specific command in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @arg {Array<Object>} permissions An array of [permissions objects](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-structure)
    * @returns {Promise<Object>} Resolves with a [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) object.
    */
    editCommandPermissions(guildID, commandID, permissions) {
        return this.requestHandler.request("PUT", Endpoints.COMMAND_PERMISSIONS(this.application.id, guildID, commandID), true, {permissions});
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
    * @arg {String} [options.preferredLocale] Preferred "COMMUNITY" guild language used in server discovery and notices from Discord
    * @arg {String} [options.publicUpdatesChannelID] The id of the channel where admins and moderators of "COMMUNITY" guilds receive notices from Discord
    * @arg {String} [options.rulesChannelID] The id of the channel where "COMMUNITY" guilds display rules and/or guidelines
    * @arg {String} [options.splash] The guild splash image as a base64 data URI (VIP only). Note: base64 strings alone are not base64 data URI strings
    * @arg {Number} [options.systemChannelFlags] The flags for the system channel
    * @arg {String} [options.systemChannelID] The ID of the system channel
    * @arg {Number} [options.verificationLevel] The guild verification level
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Guild>}
    */
    editGuild(guildID, options, reason) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD(guildID), true, {
            name: options.name,
            icon: options.icon,
            verification_level: options.verificationLevel,
            default_message_notifications: options.defaultNotifications,
            explicit_content_filter: options.explicitContentFilter,
            system_channel_id: options.systemChannelID,
            system_channel_flags: options.systemChannelFlags,
            rules_channel_id: options.rulesChannelID,
            public_updates_channel_id: options.publicUpdatesChannelID,
            preferred_locale: options.preferredLocale,
            afk_channel_id: options.afkChannelID,
            afk_timeout: options.afkTimeout,
            owner_id: options.ownerID,
            splash: options.splash,
            banner: options.banner,
            description: options.description,
            discovery_splash: options.discoverySplash,
            features: options.features,
            reason: reason
        }).then((guild) => new Guild(guild, this));
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
    * @arg {bigint | number | string | Permission?} [command.defaultMemberPermissions] The default member [permissions](https://discord.com/developers/docs/topics/permissions) represented as a bit set
    * @returns {Promise<ApplicationCommand>}
    */
    editGuildCommand(guildID, commandID, command) {
        if(command.name !== undefined && command.type === 1) {
            command.name = command.name.toLowerCase();
        }
        if(command.defaultMemberPermissions !== undefined) {
            command.defaultMemberPermissions = command.defaultMemberPermissions instanceof Permission ? String(command.defaultMemberPermissions.allow) : String(command.defaultMemberPermissions);
        }
        command.default_member_permissions = command.defaultMemberPermissions;
        command.description_localizations = command.descriptionLocalizations;
        command.name_localizations = command.nameLocalizations;
        return this.requestHandler.request("PATCH", Endpoints.GUILD_COMMAND(this.application.id, guildID, commandID), true, command).then((applicationCommand) => new ApplicationCommand(applicationCommand, this));
    }

    /**
    * Edit a guild's discovery data
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] The guild discovery data
    * @arg {String} [options.primaryCategoryID] The primary discovery category ID
    * @arg {Array<String>} [options.keywords] The discovery keywords (max 10)
    * @arg {Boolean} [options.emojiDiscoverabilityEnabled] Whether guild info should be shown when emoji info is loaded
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} The updated guild's discovery object
    */
    editGuildDiscovery(guildID, options = {}) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_DISCOVERY(guildID), true, {
            primary_category_id: options.primaryCategoryID,
            keywords: options.keywords,
            emoji_discoverability_enabled: options.emojiDiscoverabilityEnabled,
            reason: options.reason
        });
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
    editGuildEmoji(guildID, emojiID, options, reason) {
        options.reason = reason;
        return this.requestHandler.request("PATCH", Endpoints.GUILD_EMOJI(guildID, emojiID), true, options);
    }

    /**
    * Edit a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member (you can use "@me" if you are only editing the bot user's nickname)
    * @arg {Object} options The properties to edit
    * @arg {String?} [options.channelID] The ID of the voice channel to move the member to (must be in voice). Set to `null` to disconnect the member
    * @arg {Date?} [options.communicationDisabledUntil] When the user's timeout should expire. Set to `null` to instantly remove timeout
    * @arg {Boolean} [options.deaf] Server deafen the member
    * @arg {Boolean} [options.mute] Server mute the member
    * @arg {String} [options.nick] Set the member's server nickname, "" to remove
    * @arg {Array<String>} [options.roles] The array of role IDs the member should have
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Member>}
    */
    editGuildMember(guildID, memberID, options, reason) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_MEMBER(guildID, memberID), true, {
            roles: options.roles && options.roles.filter((roleID, index) => options.roles.indexOf(roleID) === index),
            nick: options.nick,
            mute: options.mute,
            deaf: options.deaf,
            channel_id: options.channelID,
            communication_disabled_until: options.communicationDisabledUntil,
            reason: reason
        }).then((member) => new Member(member, this.guilds.get(guildID), this));
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
    editGuildScheduledEvent(guildID, eventID, event, reason) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_SCHEDULED_EVENT(guildID, eventID), true, {
            channel_id: event.channelID,
            description: event.description,
            entity_metadata: event.entityMetadata,
            entity_type: event.entityType,
            image: event.image,
            name: event.name,
            privacy_level: event.privacyLevel,
            scheduled_end_time: event.scheduledEndTime,
            scheduled_start_time: event.scheduledStartTime,
            status: event.status,
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
    editGuildSticker(guildID, stickerID, options, reason) {
        options.reason = reason;
        return this.requestHandler.request("PATCH", Endpoints.GUILD_STICKER(guildID, stickerID), true, options);
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
    editGuildTemplate(guildID, code, options) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_TEMPLATE_GUILD(guildID, code), true, options).then((template) => new GuildTemplate(template, this));
    }

    /**
    * Modify a guild's vanity code
    * @arg {String} guildID The ID of the guild
    * @arg {String?} code The new vanity code
    * @returns {Promise<Object>}
    */
    editGuildVanity(guildID, code) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_VANITY_URL(guildID), true, {
            code
        });
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
    editGuildVoiceState(guildID, options, userID = "@me") {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_VOICE_STATE(guildID, userID), true, {
            channel_id: options.channelID,
            request_to_speak_timestamp: options.requestToSpeakTimestamp,
            suppress: options.suppress
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
    editGuildWelcomeScreen(guildID, options) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_WELCOME_SCREEN(guildID), true, {
            description: options.description,
            enabled: options.enabled,
            welcome_channels: options.welcomeChannels.map((c) => {
                return {
                    channel_id: c.channelID,
                    description: c.description,
                    emoji_id: c.emojiID,
                    emoji_name: c.emojiName
                };
            })
        });
    }

    /**
    * Modify a guild's widget
    * @arg {String} guildID The ID of the guild
    * @arg {Object} options The widget object to modify (https://discord.com/developers/docs/resources/guild#modify-guild-widget)
    * @returns {Promise<Object>} A guild widget object
    */
    editGuildWidget(guildID, options) {
        return this.requestHandler.request("PATCH", Endpoints.GUILD_WIDGET(guildID), true, options);
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
    * @arg {String} content.attachments.id The ID of an attachment (set only when you want to update an attachment)
    * @arg {Buffer} content.attachments.file A buffer containing file data (set only when uploading new files)
    * @arg {String} content.attachments.filename What to name the file
    * @arg {String} [content.attachments.description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [content.file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} content.file[].file A buffer containing file data
    * @arg {String} content.file[].name What to name the file
    * @arg {Number} [content.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @returns {Promise<Message>}
    */
    editMessage(channelID, messageID, content) {
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
            if(content.content !== undefined || content.embeds || content.allowedMentions) {
                content.allowed_mentions = this._formatAllowedMentions(content.allowedMentions);
            }
            if(content.file) {
                emitDeprecation("EDIT_MESSAGE_FILE");
                this.emit("warn", "[DEPRECATED] A file property has been passed to editMessage(). This will be removed in future versions.");

                if(!content.attachments) {
                    content.attachments = [];
                }

                // This might be sub-optimal as this gets transformed back to the same structure
                if(Array.isArray(content.file)) {
                    Array.prototype.push.apply(content.attachments, content.file.map((file) => ({
                        filename: file.name,
                        file: file.file
                    })));
                } else {
                    content.attachments.push({
                        filename: content.file.name,
                        file: content.file.file
                    });
                }

                delete content.file;
            }
        }

        const [files, attachments] = content.attachments ? this._processAttachments(content.attachments) : [];
        content.attachments = attachments;

        return this.requestHandler.request("PATCH", Endpoints.CHANNEL_MESSAGE(channelID, messageID), true, content, files).then((message) => new Message(message, this));
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
    editRole(guildID, roleID, options, reason) {
        options.unicode_emoji = options.unicodeEmoji;
        options.reason = reason;
        if(options.permissions !== undefined) {
            options.permissions = options.permissions instanceof Permission ? String(options.permissions.allow) : String(options.permissions);
        }
        return this.requestHandler.request("PATCH", Endpoints.GUILD_ROLE(guildID, roleID), true, options).then((role) => new Role(role, this.guilds.get(guildID)));
    }

    /**
    * Edit a guild role's position. Note that role position numbers are highest on top and lowest at the bottom.
    * @arg {String} guildID The ID of the guild the role is in
    * @arg {String} roleID The ID of the role
    * @arg {Number} position The new position of the role
    * @returns {Promise}
    */
    editRolePosition(guildID, roleID, position) {
        if(guildID === roleID) {
            return Promise.reject(new Error("Cannot move default role"));
        }
        let roles = this.guilds.get(guildID).roles;
        const role = roles.get(roleID);
        if(!role) {
            return Promise.reject(new Error(`Role ${roleID} not found`));
        }
        if(role.position === position) {
            return Promise.resolve();
        }
        const min = Math.min(position, role.position);
        const max = Math.max(position, role.position);
        roles = roles.filter((role) => min <= role.position && role.position <= max && role.id !== roleID).sort((a, b) => a.position - b.position);
        if(position > role.position) {
            roles.push(role);
        } else {
            roles.unshift(role);
        }
        return this.requestHandler.request("PATCH", Endpoints.GUILD_ROLES(guildID), true, roles.map((role, index) => ({
            id: role.id,
            position: index + min
        })));
    }

    /**
    * Edit properties of the bot user
    * @arg {Object} options The properties to edit
    * @arg {String} [options.username] The new username
    * @arg {String?} [options.avatar] The new avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @returns {Promise<ExtendedUser>}
    */
    editSelf(options) {
        return this.requestHandler.request("PATCH", Endpoints.USER("@me"), true, options).then((data) => new ExtendedUser(data, this));
    }

    /**
    * Update a stage instance
    * @arg {String} channelID The ID of the stage channel associated with the instance
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public, 2 is guild only
    * @arg {String} [options.topic] The stage instance topic
    * @returns {Promise<StageInstance>}
    */
    editStageInstance(channelID, options) {
        return this.requestHandler.request("PATCH", Endpoints.STAGE_INSTANCE(channelID), true, options).then((instance) => new StageInstance(instance, this));
    }

    /**
    * Update the bot's status on all guilds
    * @arg {String} [status] Sets the bot's status, either "online", "idle", "dnd", or "invisible"
    * @arg {Array | Object} [activities] Sets the bot's activities. A single activity object is also accepted for backwards compatibility
    * @arg {String} activities[].name The name of the activity
    * @arg {Number} activities[].type The type of the activity. 0 is playing, 1 is streaming (Twitch only), 2 is listening, 3 is watching, 5 is competing in
    * @arg {String} [activities[].url] The URL of the activity
    */
    editStatus(status, activities) {
        if(activities === undefined && typeof status === "object") {
            activities = status;
            status = undefined;
        }
        if(status) {
            this.presence.status = status;
        }
        if(activities === null) {
            activities = [];
        } else if(activities && !Array.isArray(activities)) {
            activities = [activities];
        }
        if(activities !== undefined) {
            this.presence.activities = activities;
        }

        this.shards.forEach((shard) => {
            shard.editStatus(status, activities);
        });
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
    editWebhook(webhookID, options, token, reason) {
        return this.requestHandler.request("PATCH", token ? Endpoints.WEBHOOK_TOKEN(webhookID, token) : Endpoints.WEBHOOK(webhookID), !token, {
            name: options.name,
            avatar: options.avatar,
            channel_id: options.channelID,
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
    * @arg {String} options.attachments.id The ID of an attachment (set only when you want to update an attachment)
    * @arg {Buffer} options.attachments.file A buffer containing file data (set only when uploading new files)
    * @arg {String} options.attachments.filename What to name the file
    * @arg {String} [content.attachments.description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.content] A content string
    * @arg {Object} [options.embed] An embed object. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<Object>} [options.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [options.file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} options.file[].file A buffer containing file data
    * @arg {String} options.file[].name What to name the file
    * @returns {Promise<Message>}
    */
    editWebhookMessage(webhookID, token, messageID, options) {
        if(options.allowedMentions) {
            options.allowed_mentions = this._formatAllowedMentions(options.allowedMentions);
        }
        if(options.embed) {
            if(!options.embeds) {
                options.embeds = [];
            }
            options.embeds.push(options.embed);
        }
        if(options.file) {
            emitDeprecation("EDIT_WEBHOOK_MESSAGE_FILE");
            this.emit("warn", "[DEPRECATED] A file property has been passed to editWebhookMessage(). This will be removed in future versions.");

            if(!options.attachments) {
                options.attachments = [];
            }

            // This might be sub-optimal as this gets transformed back to the same structure
            if(Array.isArray(options.file)) {
                Array.prototype.push.apply(options.attachments, options.file.map((file) => ({
                    filename: file.name,
                    file: file.file
                })));
            } else {
                options.attachments.push({
                    filename: options.file.name,
                    file: options.file.file
                });
            }

            delete options.file;
        }

        const [files, attachments] = options.attachments ? this._processAttachments(options.attachments) : [];
        options.attachments = attachments;

        return this.requestHandler.request("PATCH", Endpoints.WEBHOOK_MESSAGE(webhookID, token, messageID), false, options, files).then((response) => new Message(response, this));
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
    executeSlackWebhook(webhookID, token, options) {
        const wait = !!options.wait;
        options.wait = undefined;
        const auth = !!options.auth;
        options.auth = undefined;
        const threadID = options.threadID;
        options.threadID = undefined;
        let qs = "";
        if(wait) {
            qs += "&wait=true";
        }
        if(threadID) {
            qs += "&thread_id=" + threadID;
        }
        return this.requestHandler.request("POST", Endpoints.WEBHOOK_TOKEN_SLACK(webhookID, token) + (qs ? "?" + qs : ""), auth, options);
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
    * @arg {Buffer} content.attachments.file A buffer containing file data
    * @arg {String} content.attachments.filename What to name the file
    * @arg {String} [content.attachments.description] A description for the attachment
    * @arg {Boolean} [options.auth=false] Whether or not to authenticate with the bot token.
    * @arg {String} [options.avatarURL] A URL for a custom avatar, defaults to webhook default avatar if not specified
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [options.content] A content string
    * @arg {Object} [options.embed] An embed object. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Array<Object>} [options.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Object | Array<Object>} [options.file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} options.file.file A buffer containing file data
    * @arg {String} options.file.name What to name the file
    * @arg {Number} [options.flags] A number representing the flags to apply to the message. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {String} [options.threadID] The ID of the thread channel in the webhook's channel to send the message to
    * @arg {Boolean} [options.tts=false] Whether the message should be a TTS message or not
    * @arg {String} [options.username] A custom username, defaults to webhook default username if not specified
    * @arg {Boolean} [options.wait=false] Whether to wait for the server to confirm the message create or not
    * @returns {Promise<Message?>}
    */
    executeWebhook(webhookID, token, options) {
        let qs = "";
        if(options.wait) {
            qs += "&wait=true";
        }
        if(options.threadID) {
            qs += "&thread_id=" + options.threadID;
        }
        if(options.embed) {
            if(!options.embeds) {
                options.embeds = [];
            }
            options.embeds.push(options.embed);
        }

        if(options.file) {
            emitDeprecation("EXECUTE_WEBHOOK_FILE");
            this.emit("warn", "[DEPRECATED] A file property has been passed to executeWebhook(). This will be removed in future versions.");

            if(!options.attachments) {
                options.attachments = [];
            }

            // This might be sub-optimal as this gets transformed back to the same structure
            if(Array.isArray(options.file)) {
                Array.prototype.push.apply(options.attachments, options.file.map((file) => ({
                    filename: file.name,
                    file: file.file
                })));
            } else {
                options.attachments.push({
                    filename: options.file.name,
                    file: options.file.file
                });
            }
        }

        const [files, attachments] = options.attachments ? this._processAttachments(options.attachments) : [];

        return this.requestHandler.request("POST", Endpoints.WEBHOOK_TOKEN(webhookID, token) + (qs ? "?" + qs : ""), !!options.auth, {
            content: options.content,
            embeds: options.embeds,
            username: options.username,
            avatar_url: options.avatarURL,
            tts: options.tts,
            flags: options.flags,
            allowed_mentions: this._formatAllowedMentions(options.allowedMentions),
            components: options.components,
            attachments: attachments
        }, files).then((response) => options.wait ? new Message(response, this) : undefined);
    }

    /**
     * Follow a NewsChannel in another channel. This creates a webhook in the target channel
     * @arg {String} channelID The ID of the NewsChannel
     * @arg {String} webhookChannelID The ID of the target channel
     * @returns {Object} An object containing the NewsChannel's ID and the new webhook's ID
     */
    followChannel(channelID, webhookChannelID) {
        return this.requestHandler.request("POST", Endpoints.CHANNEL_FOLLOW(channelID), true, {webhook_channel_id: webhookChannelID});
    }

    /**
    * Get all active threads in a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} An object containing an array of `threads` and an array of `members`
    */
    getActiveGuildThreads(guildID) {
        return this.requestHandler.request("GET", Endpoints.THREADS_GUILD_ACTIVE(guildID), true).then((response) => {
            return {
                members: response.members.map((member) => new ThreadMember(member, this)),
                threads: response.threads.map((thread) => Channel.from(thread, this))
            };
        });
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
    getArchivedThreads(channelID, type, options = {}) {
        return this.requestHandler.request("GET", Endpoints.THREADS_ARCHIVED(channelID, type), true, options).then((response) => {
            return {
                hasMore: response.has_more,
                members: response.members.map((member) => new ThreadMember(member, this)),
                threads: response.threads.map((thread) => Channel.from(thread, this))
            };
        });
    }

    /**
     * Get an existing auto moderation rule
     * @arg {String} guildID The ID of the guild to get the rule from
     * @arg {String} ruleID The ID of the rule to get
     * @returns {Promise<Object>}
     */
    getAutoModerationRule(guildID, ruleID) {
        return this.requestHandler.request("GET", Endpoints.AUTO_MODERATION_RULE(guildID, ruleID), true);
    }

    /**
     * Get a guild's auto moderation rules
     * @arg {String} guildID The ID of the guild to get the rules of
     * @returns {Promise<Object[]>}
     */
    getAutoModerationRules(guildID) {
        return this.requestHandler.request("GET", Endpoints.AUTO_MODERATION_RULES(guildID), true);
    }

    /**
    * Get general and bot-specific info on connecting to the Discord gateway (e.g. connection ratelimit)
    * @returns {Promise<Object>} Resolves with an object containing gateway connection info
    */
    getBotGateway() {
        return this.requestHandler.request("GET", Endpoints.GATEWAY_BOT, true);
    }

    /**
    * Get a Channel object from a channel ID
    * @arg {String} channelID The ID of the channel
    * @returns {CategoryChannel | PrivateChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel}
    */
    getChannel(channelID) {
        if(!channelID) {
            throw new Error(`Invalid channel ID: ${channelID}`);
        }

        if(this.channelGuildMap[channelID] && this.guilds.get(this.channelGuildMap[channelID])) {
            return this.guilds.get(this.channelGuildMap[channelID]).channels.get(channelID);
        }
        if(this.threadGuildMap[channelID] && this.guilds.get(this.threadGuildMap[channelID])) {
            return this.guilds.get(this.threadGuildMap[channelID]).threads.get(channelID);
        }
        return this.privateChannels.get(channelID);
    }

    /**
    * Get all invites in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<Array<Invite>>}
    */
    getChannelInvites(channelID) {
        return this.requestHandler.request("GET", Endpoints.CHANNEL_INVITES(channelID), true).then((invites) => invites.map((invite) => new Invite(invite, this)));
    }

    /**
    * Get all the webhooks in a channel
    * @arg {String} channelID The ID of the channel to get webhooks for
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    */
    getChannelWebhooks(channelID) {
        return this.requestHandler.request("GET", Endpoints.CHANNEL_WEBHOOKS(channelID), true);
    }

    /**
    * Get a global application command
    * @arg {String} commandID The command id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand>}
    */
    getCommand(commandID, withLocalizations) {
        let qs = "";
        if(withLocalizations) {
            qs += "&with_localizations=true";
        }
        return this.requestHandler.request("GET", Endpoints.COMMAND(this.application.id, commandID) + (qs ? "?" + qs : ""), true).then((applicationCommand) => new ApplicationCommand(applicationCommand, this));
    }

    /**
    * Get the a guild's application command permissions
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @returns {Promise<Object>} Resolves with a guild application command permissions object.
    */
    getCommandPermissions(guildID, commandID) {
        return this.requestHandler.request("GET", Endpoints.COMMAND_PERMISSIONS(this.application.id, guildID, commandID), true);
    }

    /**
    * Get the global application commands
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand[]>}
    */
    getCommands(withLocalizations) {
        let qs = "";
        if(withLocalizations) {
            qs += "&with_localizations=true";
        }
        return this.requestHandler.request("GET", Endpoints.COMMANDS(this.application.id) + (qs ? "?" + qs : ""), true).then((applicationCommands) => applicationCommands.map((applicationCommand) => new ApplicationCommand(applicationCommand, this)));
    }

    /**
    * Get a list of discovery categories
    * @returns {Promise<Array<Object>>}
    */
    getDiscoveryCategories() {
        return this.requestHandler.request("GET", Endpoints.DISCOVERY_CATEGORIES, true);
    }

    /**
    * Get a DM channel with a user, or create one if it does not exist
    * @arg {String} userID The ID of the user
    * @returns {Promise<PrivateChannel>}
    */
    getDMChannel(userID) {
        if(this.privateChannelMap[userID]) {
            return Promise.resolve(this.privateChannels.get(this.privateChannelMap[userID]));
        }
        return this.requestHandler.request("POST", Endpoints.USER_CHANNELS("@me"), true, {
            recipient_id: userID
        }).then((privateChannel) => new PrivateChannel(privateChannel, this));
    }

    /**
    * Get a guild from the guild's emoji ID
    * @arg {String} emojiID The ID of the emoji
    * @returns {Promise<Guild>}
    */
    getEmojiGuild(emojiID) {
        return this.requestHandler.request("GET", Endpoints.CUSTOM_EMOJI_GUILD(emojiID), true).then((result) => new Guild(result, this));
    }

    /**
    * Get info on connecting to the Discord gateway
    * @returns {Promise<Object>} Resolves with an object containing gateway connection info
    */
    getGateway() {
        return this.requestHandler.request("GET", Endpoints.GATEWAY);
    }

    /**
    * Get the audit log for a guild
    * @arg {String} guildID The ID of the guild to get audit logs for
    * @arg {Object} [options] Options for the request
    * @arg {Number} [options.actionType] Filter entries by action type
    * @arg {String} [options.before] Get entries before this entry ID
    * @arg {Number} [options.limit=50] The maximum number of entries to return
    * @arg {String} [options.userID] Filter entries by the user that performed the action
    * @returns {Promise<{entries: Array<GuildAuditLogEntry>, integrations: Array<PartialIntegration>, threads: Array<NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>, users: Array<User>, webhooks: Array<Webhook>}>}
    */
    getGuildAuditLog(guildID, options = {}) {
        if(options.limit === undefined) { // Legacy behavior
            options.limit = 50;
        }
        if(options.actionType !== undefined) {
            options.action_type = options.actionType;
        }
        if(options.userID !== undefined) {
            options.user_id = options.userID;
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_AUDIT_LOGS(guildID), true, options).then((data) => {
            const guild = this.guilds.get(guildID);
            const users = data.users.map((user) => this.users.add(user, this));
            const threads = data.threads.map((thread) => guild.threads.update(thread, this));
            return {
                entries: data.audit_log_entries.map((entry) => new GuildAuditLogEntry(entry, guild)),
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
    getGuildBan(guildID, userID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_BAN(guildID, userID), true).then((ban) => {
            ban.user = new User(ban.user, this);
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
        const bans = await this.requestHandler.request("GET", Endpoints.GUILD_BANS(guildID), true, {
            after: options.after,
            before: options.before,
            limit: options.limit && Math.min(options.limit, 1000)
        });

        for(const ban of bans) {
            ban.user = this.users.update(ban.user, this);
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
    * Get a guild application command
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand>} Resolves with an command object.
    */
    getGuildCommand(guildID, commandID, withLocalizations) {
        let qs = "";
        if(withLocalizations) {
            qs += "&with_localizations=true";
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_COMMAND(this.application.id, guildID, commandID) + (qs ? "?" + qs : ""), true).then((applicationCommand) => new ApplicationCommand(applicationCommand, this));
    }

    /**
    * Get the all of a guild's application command permissions
    * @arg {String} guildID The guild ID
    * @returns {Promise<Array<Object>>} Resolves with an array of guild application command permissions objects.
    */
    getGuildCommandPermissions(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_COMMAND_PERMISSIONS(this.application.id, guildID), true);
    }

    /**
    * Get a guild's application commands
    * @arg {String} guildID The guild id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand[]>} Resolves with an array of command objects.
    */
    getGuildCommands(guildID, withLocalizations) {
        let qs = "";
        if(withLocalizations) {
            qs += "&with_localizations=true";
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_COMMANDS(this.application.id, guildID) + (qs ? "?" + qs : ""), true).then((applicationCommands) => applicationCommands.map((applicationCommand) => new ApplicationCommand(applicationCommand, this)));
    }

    /**
    * Get a guild's discovery object
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>}
    */
    getGuildDiscovery(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_DISCOVERY(guildID), true);
    }

    /**
    * Get a list of integrations for a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<GuildIntegration>>}
    */
    getGuildIntegrations(guildID) {
        const guild = this.guilds.get(guildID);
        return this.requestHandler.request("GET", Endpoints.GUILD_INTEGRATIONS(guildID), true).then((integrations) => integrations.map((integration) => new GuildIntegration(integration, guild)));
    }

    /**
    * Get all invites in a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Invite>>}
    */
    getGuildInvites(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_INVITES(guildID), true).then((invites) => invites.map((invite) => new Invite(invite, this)));
    }

    /**
    * Get a guild preview for a guild. Only available for community guilds.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>}
    */
    getGuildPreview(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_PREVIEW(guildID), true).then((data) => new GuildPreview(data, this));
    }

    /**
    * Get a guild's scheduled events
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to each event
    * @returns {Promise<Array<GuildScheduledEvent>>}
    */
    getGuildScheduledEvents(guildID, options = {}) {
        options.with_user_count = options.withUserCount;
        return this.requestHandler.request("GET", Endpoints.GUILD_SCHEDULED_EVENTS(guildID), true, options).then((data) => data.map((event) => new GuildScheduledEvent(event, this)));
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
    * @returns {Promise<Array<{guildScheduledEventID: String, member?: Member, user: User}>>}
    */
    getGuildScheduledEventUsers(guildID, eventID, options = {}) {
        const guild = this.guilds.get(guildID);

        options.with_member = options.withMember;
        return this.requestHandler.request("GET", Endpoints.GUILD_SCHEDULED_EVENT_USERS(guildID, eventID), true, options).then((data) => data.map((eventUser) => {
            if(eventUser.member) {
                eventUser.member.id = eventUser.user.id;
            }
            return {
                guildScheduledEventID: eventUser.guild_scheduled_event_id,
                member: eventUser.member && guild ? guild.members.update(eventUser.member) : new Member(eventUser.member),
                user: this.users.update(eventUser.user)
            };
        }));
    }

    /**
    * Get a guild template
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    getGuildTemplate(code) {
        return this.requestHandler.request("GET", Endpoints.GUILD_TEMPLATE(code), true).then((template) => new GuildTemplate(template, this));
    }

    /**
    * Get a guild's templates
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<GuildTemplate>>}
    */
    getGuildTemplates(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_TEMPLATES(guildID), true).then((templates) => templates.map((t) => new GuildTemplate(t, this)));
    }

    /**
    * Returns the vanity url of the guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    */
    getGuildVanity(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_VANITY_URL(guildID), true);
    }

    /**
    * Get all the webhooks in a guild
    * @arg {String} guildID The ID of the guild to get webhooks for
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    */
    getGuildWebhooks(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_WEBHOOKS(guildID), true);
    }

    /**
    * Get the welcome screen of a Community guild, shown to new members
    * @arg {String} guildID The ID of the guild to get the welcome screen for
    * @returns {Promise<Object>}
    */
    getGuildWelcomeScreen(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_WELCOME_SCREEN(guildID), true);
    }

    /**
    * Get a guild's widget object
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} A guild widget object
    */
    getGuildWidget(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_WIDGET(guildID), true);
    }

    /**
    * Get a guild's widget settings object. Requires MANAGE_GUILD permission
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} A guild widget setting object
    */
    getGuildWidgetSettings(guildID) {
        return this.requestHandler.request("GET", Endpoints.GUILD_WIDGET_SETTINGS(guildID), true);
    }

    /**
    * Get info on an invite
    * @arg {String} inviteID The ID of the invite
    * @arg {Boolean} [withCounts] Whether to fetch additional invite info or not (approximate member counts, approximate presences, channel counts, etc.)
    * @arg {Boolean} [withExpiration] Whether to fetch the expiration time or not
    * @returns {Promise<Invite>}
    */
    getInvite(inviteID, withCounts, withExpiration) {
        return this.requestHandler.request("GET", Endpoints.INVITE(inviteID), true, {
            with_counts: withCounts,
            with_expiration: withExpiration
        }).then((invite) => new Invite(invite, this));
    }

    /**
    * Get joined private archived threads in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    */
    getJoinedPrivateArchivedThreads(channelID, options = {}) {
        return this.requestHandler.request("GET", Endpoints.THREADS_ARCHIVED_JOINED(channelID), true, options).then((response) => {
            return {
                hasMore: response.has_more,
                members: response.members.map((member) => new ThreadMember(member, this)),
                threads: response.threads.map((thread) => Channel.from(thread, this))
            };
        });
    }

    /**
    * Get a previous message in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise<Message>}
    */
    getMessage(channelID, messageID) {
        return this.requestHandler.request("GET", Endpoints.CHANNEL_MESSAGE(channelID, messageID), true).then((message) => new Message(message, this));
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
    getMessageReaction(channelID, messageID, reaction, options = {}) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }
        if(options.limit === undefined) { // Legacy behavior
            options.limit = 100;
        }
        return this.requestHandler.request("GET", Endpoints.CHANNEL_MESSAGE_REACTION(channelID, messageID, reaction), true, options).then((users) => users.map((user) => new User(user, this)));
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
        if(options.limit === undefined) { // Legacy behavior
            options.limit = 50;
        }
        let limit = options.limit;
        if(limit && limit > 100) {
            let logs = [];
            const get = async (_before, _after) => {
                const messages = await this.requestHandler.request("GET", Endpoints.CHANNEL_MESSAGES(channelID), true, {
                    limit: 100,
                    before: _before || undefined,
                    after: _after || undefined
                });
                if(limit <= messages.length) {
                    return (_after ? messages.slice(messages.length - limit, messages.length).map((message) => new Message(message, this)).concat(logs) : logs.concat(messages.slice(0, limit).map((message) => new Message(message, this))));
                }
                limit -= messages.length;
                logs = (_after ? messages.map((message) => new Message(message, this)).concat(logs) : logs.concat(messages.map((message) => new Message(message, this))));
                if(messages.length < 100) {
                    return logs;
                }
                this.emit("debug", `Getting ${limit} more messages during getMessages for ${channelID}: ${_before} ${_after}`, -1);
                return get((_before || !_after) && messages[messages.length - 1].id, _after && messages[0].id);
            };
            return get(options.before, options.after);
        }
        const messages = await this.requestHandler.request("GET", Endpoints.CHANNEL_MESSAGES(channelID), true, options);
        return messages.map((message) => {
            try {
                return new Message(message, this);
            } catch(err) {
                this.emit("error", `Error creating message from channel messages\n${err.stack}\n${JSON.stringify(messages)}`);
                return null;
            }
        });
    }

    /**
     * Get the list of sticker packs available to Nitro subscribers
     * @returns {Promise<Object>} An object whichs contains a value which contains an array of sticker packs
     */
    getNitroStickerPacks() {
        return this.requestHandler.request("GET", Endpoints.STICKER_PACKS, true);
    }

    /**
    * Get data on the bot's OAuth2 application
    * @returns {Promise<Object>} The bot's application data. Refer to [Discord's Documentation](https://discord.com/developers/docs/topics/oauth2#get-current-application-information) for object structure
    */
    getOAuthApplication() {
        return this.requestHandler.request("GET", Endpoints.OAUTH2_APPLICATION, true);
    }

    /**
    * Get all the pins in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<Array<Message>>}
    */
    getPins(channelID) {
        return this.requestHandler.request("GET", Endpoints.CHANNEL_PINS(channelID), true).then((messages) => messages.map((message) => new Message(message, this)));
    }

    /**
    * Get the prune count for a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Number} [options] The options to use to get number of prune members
    * @arg {Number} [options.days=7] The number of days of inactivity to prune for
    * @arg {Array<String>} [options.includeRoles] An array of role IDs that members must have to be considered for pruning
    * @returns {Promise<Number>} Resolves with the number of members that would be pruned
    */
    getPruneCount(guildID, options = {}) {
        return this.requestHandler.request("GET", Endpoints.GUILD_PRUNE(guildID), true, {
            days: options.days,
            include_roles: options.includeRoles
        }).then((data) => data.pruned);
    }

    /**
    * Get a channel's data via the REST API. REST mode is required to use this endpoint.
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<CategoryChannel | PrivateChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>}
    */
    getRESTChannel(channelID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.CHANNEL(channelID), true)
            .then((channel) => Channel.from(channel, this));
    }

    /**
    * Get a guild's data via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {Boolean} [withCounts=false] Whether the guild object will have approximateMemberCount and approximatePresenceCount
    * @returns {Promise<Guild>}
    */
    getRESTGuild(guildID, withCounts = false) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD(guildID), true, {
            with_counts: withCounts
        }).then((guild) => new Guild(guild, this));
    }

    /**
    * Get a guild's channels via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<CategoryChannel | TextChannel | TextVoiceChannel | NewsChannel | StageChannel>>}
    */
    getRESTGuildChannels(guildID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_CHANNELS(guildID), true)
            .then((channels) => channels.map((channel) => Channel.from(channel, this)));
    }

    /**
    * Get a guild emoji via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} emojiID The ID of the emoji
    * @returns {Promise<Object>} An emoji object
    */
    getRESTGuildEmoji(guildID, emojiID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_EMOJI(guildID, emojiID), true);
    }

    /**
    * Get a guild's emojis via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Object>>} An array of guild emoji objects
    */
    getRESTGuildEmojis(guildID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_EMOJIS(guildID), true);
    }

    /**
    * Get a guild's members via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @returns {Promise<Member>}
    */
    getRESTGuildMember(guildID, memberID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_MEMBER(guildID, memberID), true).then((member) => new Member(member, this.guilds.get(guildID), this));
    }

    /**
    * Get a guild's members via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] The highest user ID of the previous page
    * @arg {Number} [options.limit=1] The max number of members to get (1 to 1000)
    * @returns {Promise<Array<Member>>}
    */
    getRESTGuildMembers(guildID, options = {}) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_MEMBERS(guildID), true, options).then((members) => members.map((member) => new Member(member, this.guilds.get(guildID), this)));
    }

    /**
    * Get a guild's roles via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Role>>}
    */
    getRESTGuildRoles(guildID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_ROLES(guildID), true).then((roles) => roles.map((role) => new Role(role, null)));
    }

    /**
    * Get a list of the user's guilds via the REST API. REST mode is required to use this endpoint.
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] The highest guild ID of the previous page
    * @arg {String} [options.before] The lowest guild ID of the next page
    * @arg {Number} [options.limit=100] The max number of guilds to get (1 to 1000)
    * @returns {Promise<Array<Guild>>}
    */
    getRESTGuilds(options = {}) {
        // TODO type
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.USER_GUILDS("@me"), true, options).then((guilds) => guilds.map((guild) => new Guild(guild, this)));
    }

    /**
    * Get a guild scheduled event via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the guild scheduled event
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to the event
    * @returns {Promise<GuildScheduledEvent>}
    */
    getRESTGuildScheduledEvent(guildID, eventID, options = {}) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }

        options.with_user_count = options.withUserCount;
        return this.requestHandler.request("GET", Endpoints.GUILD_SCHEDULED_EVENT(guildID, eventID), true, options).then((data) => new GuildScheduledEvent(data, this));
    }

    /**
    * Get a guild sticker via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
    */
    getRESTGuildSticker(guildID, stickerID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_STICKER(guildID, stickerID), true);
    }

    /**
    * Get a guild's stickers via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Object>>} An array of guild sticker objects
    */
    getRESTGuildStickers(guildID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.GUILD_STICKERS(guildID), true);
    }

    /**
    * Get a sticker via the REST API. REST mode is required to use this endpoint.
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
     */
    getRESTSticker(stickerID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.STICKER(stickerID), true);
    }

    /**
    * Get a user's data via the REST API. REST mode is required to use this endpoint.
    * @arg {String} userID The ID of the user
    * @returns {Promise<User>}
    */
    getRESTUser(userID) {
        if(!this.options.restMode) {
            return Promise.reject(new Error("Dysnomia REST mode is not enabled"));
        }
        return this.requestHandler.request("GET", Endpoints.USER(userID), true).then((user) => new User(user, this));
    }

    /**
    * Get properties of the bot user
    * @returns {Promise<ExtendedUser>}
    */
    getSelf() {
        return this.requestHandler.request("GET", Endpoints.USER("@me"), true).then((data) => new ExtendedUser(data, this));
    }

    /**
    * Get the stage instance associated with a stage channel
    * @arg {String} channelID The stage channel ID
    * @returns {Promise<StageInstance>}
    */
    getStageInstance(channelID) {
        return this.requestHandler.request("GET", Endpoints.STAGE_INSTANCE(channelID), true).then((instance) => new StageInstance(instance, this));
    }

    /**
    * Get a list of members that are part of a thread channel
    * @arg {String} channelID The ID of the thread channel
    * @returns {Promise<Array<ThreadMember>>}
    */
    getThreadMembers(channelID) {
        return this.requestHandler.request("GET", Endpoints.THREAD_MEMBERS(channelID), true).then((members) => members.map((member) => new ThreadMember(member, this)));
    }

    /**
    * Get a list of general/guild-specific voice regions
    * @arg {String} [guildID] The ID of the guild
    * @returns {Promise<Array<Object>>} Resolves with an array of voice region objects
    */
    getVoiceRegions(guildID) {
        return guildID ? this.requestHandler.request("GET", Endpoints.GUILD_VOICE_REGIONS(guildID), true) : this.requestHandler.request("GET", Endpoints.VOICE_REGIONS, true);
    }

    /**
    * Get a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @returns {Promise<Object>} Resolves with a webhook object
    */
    getWebhook(webhookID, token) {
        return this.requestHandler.request("GET", token ? Endpoints.WEBHOOK_TOKEN(webhookID, token) : Endpoints.WEBHOOK(webhookID), !token);
    }

    /**
    * Get a webhook message
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} token The token of the webhook
    * @arg {String} messageID The message ID of a message sent by this webhook
    * @returns {Promise<Message>} Resolves with a webhook message
    */
    getWebhookMessage(webhookID, token, messageID) {
        return this.requestHandler.request("GET", Endpoints.WEBHOOK_MESSAGE(webhookID, token, messageID)).then((message) => new Message(message, this));
    }

    /**
    * Join a thread
    * @arg {String} channelID The ID of the thread channel
    * @arg {String} [userID="@me"] The user ID of the user joining
    * @returns {Promise}
    */
    joinThread(channelID, userID = "@me") {
        return this.requestHandler.request("PUT", Endpoints.THREAD_MEMBER(channelID, userID), true);
    }

    /**
    * Join a voice channel
    * @arg {String} channelID The ID of the voice channel
    * @arg {Object} [options] VoiceConnection constructor options
    * @arg {Object} [options.opusOnly] Skip opus encoder initialization. You should not enable this unless you know what you are doing
    * @arg {Object} [options.shared] Whether the VoiceConnection will be part of a SharedStream or not
    * @arg {Boolean} [options.selfMute] Whether the bot joins the channel muted or not
    * @arg {Boolean} [options.selfDeaf] Whether the bot joins the channel deafened or not
    * @returns {Promise<VoiceConnection>} Resolves with a VoiceConnection
    */
    joinVoiceChannel(channelID, options = {}) {
        const channel = this.getChannel(channelID);
        if(!channel) {
            return Promise.reject(new Error("Channel not found"));
        }
        if(channel.guild && channel.guild.members.has(this.user.id) && !(channel.permissionsOf(this.user.id).allow & Constants.Permissions.voiceConnect)) {
            return Promise.reject(new Error("Insufficient permission to connect to voice channel"));
        }
        this.shards.get(this.guildShardMap[this.channelGuildMap[channelID]] || 0).sendWS(Constants.GatewayOPCodes.VOICE_STATE_UPDATE, {
            guild_id: this.channelGuildMap[channelID] || null,
            channel_id: channelID || null,
            self_mute: options.selfMute || false,
            self_deaf: options.selfDeaf || false
        });
        if(options.opusOnly === undefined) {
            options.opusOnly = this.options.opusOnly;
        }
        return this.voiceConnections.join(this.channelGuildMap[channelID], channelID, options);
    }

    /**
    * Kick a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    kickGuildMember(guildID, userID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_MEMBER(guildID, userID), true, {
            reason
        });
    }

    /**
    * Leave a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    */
    leaveGuild(guildID) {
        return this.requestHandler.request("DELETE", Endpoints.USER_GUILD("@me", guildID), true);
    }

    /**
    * Leave a thread
    * @arg {String} channelID The ID of the thread channel
    * @arg {String} [userID="@me"] The user ID of the user leaving
    * @returns {Promise}
    */
    leaveThread(channelID, userID = "@me") {
        return this.requestHandler.request("DELETE", Endpoints.THREAD_MEMBER(channelID, userID), true);
    }

    /**
    * Leaves a voice channel
    * @arg {String} channelID The ID of the voice channel
    */
    leaveVoiceChannel(channelID) {
        if(!channelID || !this.channelGuildMap[channelID]) {
            return;
        }
        this.closeVoiceConnection(this.channelGuildMap[channelID]);
    }

    /**
    * Pin a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    pinMessage(channelID, messageID) {
        return this.requestHandler.request("PUT", Endpoints.CHANNEL_PIN(channelID, messageID), true);
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
    pruneMembers(guildID, options = {}) {
        return this.requestHandler.request("POST", Endpoints.GUILD_PRUNE(guildID), true, {
            days: options.days,
            compute_prune_count: options.computePruneCount,
            include_roles: options.includeRoles,
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
        const del = async (_before, _after) => {
            const messages = await this.getMessages(channelID, {
                limit: 100,
                before: _before,
                after: _after
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
            await del((_before || !_after) && messages[messages.length - 1].id, _after && messages[0].id);
        };
        await del(options.before, options.after);
        return checkToDelete();
    }

    /**
    * Remove a role from a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    removeGuildMemberRole(guildID, memberID, roleID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_MEMBER_ROLE(guildID, memberID, roleID), true, {
            reason
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
    removeMessageReaction(channelID, messageID, reaction, userID) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL_MESSAGE_REACTION_USER(channelID, messageID, reaction, userID || "@me"), true);
    }

    /**
    * Remove all reactions from a message for a single emoji.
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    */
    removeMessageReactionEmoji(channelID, messageID, reaction) {
        if(reaction === decodeURI(reaction)) {
            reaction = encodeURIComponent(reaction);
        }
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL_MESSAGE_REACTION(channelID, messageID, reaction), true);
    }

    /**
    * Remove all reactions from a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    removeMessageReactions(channelID, messageID) {
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL_MESSAGE_REACTIONS(channelID, messageID), true);
    }

    /**
    * Search for guild members by partial nickname/username
    * @arg {String} guildID The ID of the guild
    * @arg {String} query The query string to match username(s) and nickname(s) against
    * @arg {Number} [limit=1] The maximum number of members you want returned, capped at 100
    * @returns {Promise<Array<Member>>}
    */
    searchGuildMembers(guildID, query, limit) {
        return this.requestHandler.request("GET", Endpoints.GUILD_MEMBERS_SEARCH(guildID), true, {
            query,
            limit
        }).then((members) => {
            const guild = this.guilds.get(guildID);
            return members.map((member) => new Member(member, guild, this));
        });
    }

    /**
    * Send typing status in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise}
    */
    sendChannelTyping(channelID) {
        return this.requestHandler.request("POST", Endpoints.CHANNEL_TYPING(channelID), true);
    }

    /**
    * Force a guild template to sync
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    syncGuildTemplate(guildID, code) {
        return this.requestHandler.request("PUT", Endpoints.GUILD_TEMPLATE_GUILD(guildID, code), true).then((template) => new GuildTemplate(template, this));
    }

    /**
    * Unban a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    unbanGuildMember(guildID, userID, reason) {
        return this.requestHandler.request("DELETE", Endpoints.GUILD_BAN(guildID, userID), true, {
            reason
        });
    }

    /**
    * Unpin a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    */
    unpinMessage(channelID, messageID) {
        return this.requestHandler.request("DELETE", Endpoints.CHANNEL_PIN(channelID, messageID), true);
    }

    /**
    * Validate discovery search term
    * @arg {String} term The search term to check
    * @returns {Promise<Object>} An object with a `valid` field which is `true` when valid and `false` when invalid
    */
    validateDiscoverySearchTerm(term) {
        return this.requestHandler.request("GET", Endpoints.DISCOVERY_VALIDATION + `?term=${encodeURI(term)}`, true);
    }

    _formatAllowedMentions(allowed) {
        if(!allowed) {
            return this.options.allowedMentions;
        }
        const result = {
            parse: []
        };
        if(allowed.everyone) {
            result.parse.push("everyone");
        }
        if(allowed.roles === true) {
            result.parse.push("roles");
        } else if(Array.isArray(allowed.roles)) {
            if(allowed.roles.length > 100) {
                throw new Error("Allowed role mentions cannot exceed 100.");
            }
            result.roles = allowed.roles;
        }
        if(allowed.users === true) {
            result.parse.push("users");
        } else if(Array.isArray(allowed.users)) {
            if(allowed.users.length > 100) {
                throw new Error("Allowed user mentions cannot exceed 100.");
            }
            result.users = allowed.users;
        }
        if(allowed.repliedUser !== undefined) {
            result.replied_user = allowed.repliedUser;
        }
        return result;
    }

    _formatImage(url, format, size) {
        if(!format || !Constants.ImageFormats.includes(format.toLowerCase())) {
            format = url.includes("/a_") ? "gif" : this.options.defaultImageFormat;
        }
        if(!size || size < Constants.ImageSizeBoundaries.MINIMUM || size > Constants.ImageSizeBoundaries.MAXIMUM || (size & (size - 1))) {
            size = this.options.defaultImageSize;
        }
        return `${Endpoints.CDN_URL}${url}.${format}?size=${size}`;
    }

    _processAttachments(attachments) {
        if(!attachments) {
            return [];
        }
        const files = [];
        const resultAttachments = [];

        attachments.forEach((attachment, idx) => {
            if(attachment.id) {
                resultAttachments.push(attachment);
            } else {
                files.push({
                    fieldName: `files[${idx}]`,
                    file: attachment.file,
                    name: attachment.filename
                });

                resultAttachments.push({
                    ...attachment,
                    id: idx
                });
            }
        });

        return [files, resultAttachments];
    }

    toString() {
        return `[Client ${this.user.id}]`;
    }

    toJSON(props = []) {
        return Base.prototype.toJSON.call(this, [
            "application",
            "bot",
            "channelGuildMap",
            "gatewayURL",
            "guilds",
            "guildShardMap",
            "lastConnect",
            "lastReconnectDelay",
            "options",
            "presence",
            "privateChannelMap",
            "privateChannels",
            "ready",
            "reconnectAttempts",
            "requestHandler",
            "shards",
            "startTime",
            "unavailableGuilds",
            "users",
            "voiceConnections",
            ...props
        ]);
    }
}

module.exports = Client;
