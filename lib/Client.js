"use strict";

const Base = require("./structures/Base");
const Collection = require("./util/Collection");
const Constants = require("./Constants");
const Endpoints = require("./rest/Endpoints");
const Guild = require("./structures/Guild");
const PrivateChannel = require("./structures/PrivateChannel");
const RESTClient = require("./rest/RESTClient");
const ShardManager = require("./gateway/ShardManager");
const UnavailableGuild = require("./structures/UnavailableGuild");
const User = require("./structures/User");
const VoiceConnectionManager = require("./voice/VoiceConnectionManager");
const {formatAllowedMentions} = require("./util/util");
const {setTimeout: sleep} = require("node:timers/promises");

let EventEmitter;
try {
    EventEmitter = require("eventemitter3");
} catch{
    EventEmitter = require("node:events");
}
let Erlpack;
try {
    Erlpack = require("erlpack");
} catch{ // eslint-disable no-empty
}

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
* @prop {RESTClient} rest The REST client used to send requests
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
    channelGuildMap = {};
    guilds = new Collection(Guild);
    guildShardMap = {};
    lastConnect = 0;
    lastReconnectDelay = 0;
    presence = {
        activities: null,
        afk: false,
        since: null,
        status: "offline"
    };
    privateChannelMap = {};
    privateChannels = new Collection(PrivateChannel);
    ready = false;
    reconnectAttempts = 0;
    startTime = 0;
    threadGuildMap = {};
    unavailableGuilds = new Collection(UnavailableGuild);
    users = new Collection(User);
    voiceConnections = new VoiceConnectionManager();

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
    * @arg {Object} [options.rest.agent] The dispatcher to use for undici
    * @arg {String} [options.rest.baseURL] The base URL to use for API requests. Defaults to `https://discord.com/api/v${REST_VERSION}`
    * @arg {Number} [options.rest.ratelimiterOffset=0] A number of milliseconds to offset the ratelimit timing calculations by
    * @arg {Number} [options.rest.requestTimeout=15000] A number of milliseconds before REST requests are considered timed out
    * @arg {Number} [options.rest.retryLimit=3] The amount of times it will retry to send the request
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
            ws: {},
            gateway: {}
        }, options);

        this.options.allowedMentions = formatAllowedMentions(this.options.allowedMentions);
        if(!Constants.ImageFormats.includes(this.options.defaultImageFormat.toLowerCase())) {
            throw new TypeError(`Invalid default image format: ${this.options.defaultImageFormat}`);
        }
        const defaultImageSize = this.options.defaultImageSize;
        if(defaultImageSize < Constants.ImageSizeBoundaries.MINIMUM || defaultImageSize > Constants.ImageSizeBoundaries.MAXIMUM || (defaultImageSize & (defaultImageSize - 1))) {
            throw new TypeError(`Invalid default image size: ${defaultImageSize}`);
        }

        Object.defineProperty(this, "_token", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: token
        });

        this.rest = new RESTClient(Object.assign({
            client: this,
            token: token
        }, this.options.rest));
        delete this.options.rest;

        // Backwards compatibility
        this.rest.on("response", (request) => this.emit("rawREST", request));

        this.shards = new ShardManager(this, this.options.gateway);
        delete this.options.gateway;

        this.bot = this._token.startsWith("Bot ");

        this.connect = this.connect.bind(this);
    }

    get uptime() {
        return this.startTime ? Date.now() - this.startTime : 0;
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
    addGuildMember(guildID, userID, accessToken, options = {}) {
        process.emitWarning("addGuildMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.addGuildMember(guildID, userID, accessToken, options);
    }

    /**
    * Add a role to a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    addGuildMemberRole(guildID, memberID, roleID, reason) {
        process.emitWarning("addGuildMemberRole() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.addGuildMemberRole(guildID, memberID, roleID, reason);
    }

    /**
    * Add a reaction to a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    * @deprecated
    */
    addMessageReaction(channelID, messageID, reaction) {
        process.emitWarning("addMessageReaction() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.addMessageReaction(channelID, messageID, reaction);
    }

    /**
    * Ban a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {Number} [options.deleteMessageSeconds=0] Number of seconds to delete messages for, between 0 and 604800 inclusive
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    banGuildMember(guildID, userID, options) {
        process.emitWarning("banGuildMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.banGuildMember(guildID, userID, options);
    }

    /**
    * Edits command permissions for a multiple commands in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} guildID The guild ID
    * @arg {Array<Object>} permissions An array of [partial guild command permissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure)
    * @returns {Promise<Array<Object>>} Returns an array of [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) objects.
    * @deprecated
    */
    bulkEditCommandPermissions(guildID, permissions) {
        process.emitWarning("bulkEditCommandPermissions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.bulkEditCommandPermissions(guildID, permissions);
    }

    /**
    * Bulk create/edit global application commands
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @returns {Promise<ApplicationCommand[]>}
    * @deprecated
    */
    bulkEditCommands(commands) {
        process.emitWarning("bulkEditCommands() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.bulkEditCommands(commands);
    }

    /**
    * Bulk create/edit guild application commands
    * @arg {String} guildID Guild id to create the commands in
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @returns {ApplicationCommand[]} Resolves with an array of commands objects
    * @deprecated
    */
    bulkEditGuildCommands(guildID, commands) {
        process.emitWarning("bulkEditGuildCommands() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.bulkEditGuildCommands(guildID, commands);
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
            const data = await (this.shards.options.maxShards === "auto" || (this.shards.options.shardConcurrency === "auto" && this.bot)
                ? this.rest.getBotGateway()
                : this.rest.getGateway());

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
                this.shards.options.lastShardID ??= data.shards - 1;
            }

            if(this.shards.options.shardConcurrency === "auto" && typeof data.session_start_limit?.max_concurrency === "number") {
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
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @arg {Object} [options.triggerMetadata] The [trigger metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) for the rule
     * @arg {Number} options.triggerType The [trigger type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types) of the rule
     * @returns {Promise<AutoModerationRule>}
     * @deprecated
    */
    createAutoModerationRule(guildID, options) {
        process.emitWarning("createAutoModerationRule() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createAutoModerationRule(guildID, options);
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
    * @deprecated
    */
    createChannel(guildID, name, type, options = {}) {
        process.emitWarning("createChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createChannel(guildID, name, type, options);
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
    * @deprecated
    */
    createChannelInvite(channelID, options = {}, reason) {
        process.emitWarning("createChannelInvite() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createChannelInvite(channelID, options, reason);
    }

    /**
    * Create a channel webhook
    * @arg {String} channelID The ID of the channel to create the webhook in
    * @arg {Object} options Webhook options
    * @arg {String} options.name The default name
    * @arg {String?} [options.avatar] The default avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} Resolves with a webhook object
    * @deprecated
    */
    createChannelWebhook(channelID, options, reason) {
        process.emitWarning("createChannelWebhook() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createChannelWebhook(channelID, options, reason);
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
    * @deprecated
    */
    createCommand(command) {
        process.emitWarning("createCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createCommand(command);
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
    * @deprecated
    */
    createGuild(name, options) {
        process.emitWarning("createGuild() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuild(name, options);
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
    * @deprecated
    */
    createGuildCommand(guildID, command) {
        process.emitWarning("createGuildCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuildCommand(guildID, command);
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
    * @deprecated
    */
    createGuildEmoji(guildID, options, reason) {
        process.emitWarning("createGuildEmoji() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuildEmoji(guildID, options, reason);
    }

    /**
    * Create a guild based on a template. This can only be used with bots in less than 10 guilds
    * @arg {String} code The template code
    * @arg {String} name The name of the guild
    * @arg {String} [icon] The 128x128 icon as a base64 data URI
    * @returns {Promise<Guild>}
    * @deprecated
    */
    createGuildFromTemplate(code, name, icon) {
        process.emitWarning("createGuildFromTemplate() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuildFromTemplate(code, name, icon);
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
    * @deprecated
    */
    createGuildScheduledEvent(guildID, event, reason) {
        process.emitWarning("createGuildScheduledEvent() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuildScheduledEvent(guildID, event, reason);
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
    * @deprecated
    */
    createGuildSticker(guildID, options, reason) {
        process.emitWarning("createGuildSticker() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuildSticker(guildID, options, reason);
    }

    /**
    * Create a template for a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} name The name of the template
    * @arg {String} [description] The description for the template
    * @returns {Promise<GuildTemplate>}
    * @deprecated
    */
    createGuildTemplate(guildID, name, description) {
        process.emitWarning("createGuildTemplate() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createGuildTemplate(guildID, name, description);
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
    * @arg {String} [file.fieldName] The multipart field name
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise}
    * @deprecated
    */
    createInteractionResponse(interactionID, interactionToken, options, file) {
        process.emitWarning("createInteractionResponse() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createInteractionResponse(interactionID, interactionToken, options, file);
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
    * @deprecated
    */
    createMessage(channelID, content) {
        process.emitWarning("createMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createMessage(channelID, content);
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
    * @deprecated
    */
    createRole(guildID, options, reason) {
        process.emitWarning("createRole() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createRole(guildID, options, reason);
    }

    /**
    * Create a stage instance
    * @arg {String} channelID The ID of the stage channel to create the instance in
    * @arg {Object} options The stage instance options
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
    * @arg {Boolean} [options.sendStartNotification] Whether to notify @everyone that a stage instance has started or not
    * @arg {String} options.topic The stage instance topic
    * @returns {Promise<StageInstance>}
    * @deprecated
    */
    createStageInstance(channelID, options) {
        process.emitWarning("createStageInstance() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createStageInstance(channelID, options);
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
    * @deprecated
    */
    createThread(channelID, options) {
        process.emitWarning("createThread() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createThread(channelID, options);
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
    * @deprecated
    */
    createThreadWithMessage(channelID, messageID, options) {
        process.emitWarning("createThreadWithMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.createThreadWithMessage(channelID, messageID, options);
    }

    /**
     * Crosspost (publish) a message to subscribed channels
     * @arg {String} channelID The ID of the NewsChannel
     * @arg {String} messageID The ID of the message
     * @returns {Promise<Message>}
     * @deprecated
    */
    crosspostMessage(channelID, messageID) {
        process.emitWarning("crosspostMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.crosspostMessage(channelID, messageID);
    }

    /**
     * Delete an auto moderation rule
     * @arg {String} guildID The guildID to delete the rule from
     * @arg {String} ruleID The ID of the rule to delete
     * @arg {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     * @deprecated
    */
    deleteAutoModerationRule(guildID, ruleID, reason) {
        process.emitWarning("deleteAutoModerationRule() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteAutoModerationRule(guildID, ruleID, reason);
    }

    /**
    * Delete a guild channel, or leave a private channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteChannel(channelID, reason) {
        process.emitWarning("deleteChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteChannel(channelID, reason);
    }

    /**
    * Delete a channel permission overwrite
    * @arg {String} channelID The ID of the channel
    * @arg {String} overwriteID The ID of the overwritten user or role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteChannelPermission(channelID, overwriteID, reason) {
        process.emitWarning("deleteChannelPermission() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteChannelPermission(channelID, overwriteID, reason);
    }

    /**
    * Delete a global application command
    * @arg {String} commandID The command id
    * @returns {Promise}
    * @deprecated
    */
    deleteCommand(commandID) {
        process.emitWarning("deleteCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteCommand(commandID);
    }

    /**
    * Delete a guild (bot user must be owner)
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    * @deprecated
    */
    deleteGuild(guildID) {
        process.emitWarning("deleteGuild() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuild(guildID);
    }

    /**
    * Delete a guild application command
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @returns {Promise}
    * @deprecated
    */
    deleteGuildCommand(guildID, commandID) {
        process.emitWarning("deleteGuildCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuildCommand(guildID, commandID);
    }

    /**
    * Delete a guild emoji object
    * @arg {String} guildID The ID of the guild to delete the emoji in
    * @arg {String} emojiID The ID of the emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteGuildEmoji(guildID, emojiID, reason) {
        process.emitWarning("deleteGuildEmoji() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuildEmoji(guildID, emojiID, reason);
    }

    /**
    * Delete a guild integration
    * @arg {String} guildID The ID of the guild
    * @arg {String} integrationID The ID of the integration
    * @returns {Promise}
    * @deprecated
    */
    deleteGuildIntegration(guildID, integrationID) {
        process.emitWarning("deleteGuildIntegration() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuildIntegration(guildID, integrationID);
    }

    /**
    * Delete a guild scheduled event
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the event
    * @returns {Promise}
    * @deprecated
    */
    deleteGuildScheduledEvent(guildID, eventID) {
        process.emitWarning("deleteGuildScheduledEvent() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuildScheduledEvent(guildID, eventID);
    }

    /**
    * Delete a guild sticker
    * @arg {String} guildID The ID of the guild
    * @arg {String} stickerID The ID of the sticker
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteGuildSticker(guildID, stickerID, reason) {
        process.emitWarning("deleteGuildSticker() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuildSticker(guildID, stickerID, reason);
    }

    /**
    * Delete a guild template
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    * @deprecated
    */
    deleteGuildTemplate(guildID, code) {
        process.emitWarning("deleteGuildTemplate() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteGuildTemplate(guildID, code);
    }

    /**
    * Delete an invite
    * @arg {String} inviteID The ID of the invite
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteInvite(inviteID, reason) {
        process.emitWarning("deleteInvite() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteInvite(inviteID, reason);
    }

    /**
    * Delete a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteMessage(channelID, messageID, reason) {
        process.emitWarning("deleteMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteMessage(channelID, messageID, reason);
    }

    /**
    * Bulk delete messages
    * @arg {String} channelID The ID of the channel
    * @arg {Array<String>} messageIDs Array of message IDs to delete
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteMessages(channelID, messageIDs, reason) {
        process.emitWarning("deleteMessages() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteMessages(channelID, messageIDs, reason);
    }

    /**
    * Delete a guild role
    * @arg {String} guildID The ID of the guild to create the role in
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteRole(guildID, roleID, reason) {
        process.emitWarning("deleteRole() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteRole(guildID, roleID, reason);
    }

    /**
    * Delete a stage instance
    * @arg {String} channelID The stage channel associated with the instance
    * @returns {Promise}
    * @deprecated
    */
    deleteStageInstance(channelID) {
        process.emitWarning("deleteStageInstance() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteStageInstance(channelID);
    }

    /**
    * Delete a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    deleteWebhook(webhookID, token, reason) {
        process.emitWarning("deleteWebhook() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteWebhook(webhookID, token, reason);
    }

    /**
    * Delete a webhook message
    * @arg {String} webhookID
    * @arg {String} token
    * @arg {String} messageID
    * @returns {Promise}
    * @deprecated
    */
    deleteWebhookMessage(webhookID, token, messageID) {
        process.emitWarning("deleteWebhookMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.deleteWebhookMessage(webhookID, token, messageID);
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
     * @deprecated
    */
    editAutoModerationRule(guildID, ruleID, options) {
        process.emitWarning("editAutoModerationRule() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editAutoModerationRule(guildID, ruleID, options);
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
    * @deprecated
    */
    editChannel(channelID, options, reason) {
        process.emitWarning("editChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editChannel(channelID, options, reason);
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
    * @deprecated
    */
    editChannelPermission(channelID, overwriteID, allow, deny, type, reason) {
        process.emitWarning("editChannelPermission() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editChannelPermission(channelID, overwriteID, allow, deny, type, reason);
    }

    /**
    * Edit a guild channel's position. Note that channel position numbers are grouped by type (category, text, voice), then sorted in ascending order (lowest number is on top).
    * @arg {String} channelID The ID of the channel
    * @arg {Number} position The new position of the channel
    * @arg {Object} [options] Additional options when editing position
    * @arg {Boolean} [options.lockPermissions] Whether to sync the channel's permissions with the new parent, if changing parents
    * @arg {String} [options.parentID] The new parent ID (category channel) for the channel that is moved
    * @returns {Promise}
    * @deprecated
    */
    editChannelPosition(channelID, position, options = {}) {
        process.emitWarning("editChannelPosition() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editChannelPosition(channelID, position, options);
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
    * @deprecated
    */
    editChannelPositions(guildID, channelPositions) {
        process.emitWarning("editChannelPositions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editChannelPositions(guildID, channelPositions);
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
    * @deprecated
    */
    editCommand(commandID, command) {
        process.emitWarning("editCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editCommand(commandID, command);
    }

    /**
    * Edits command permissions for a specific command in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @arg {Array<Object>} permissions An array of [permissions objects](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-structure)
    * @returns {Promise<Object>} Resolves with a [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) object.
    * @deprecated
    */
    editCommandPermissions(guildID, commandID, permissions) {
        process.emitWarning("editCommandPermissions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editCommandPermissions(guildID, commandID, permissions);
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
    * @deprecated
    */
    editGuild(guildID, options, reason) {
        process.emitWarning("editGuild() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuild(guildID, options, reason);
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
    * @deprecated
    */
    editGuildCommand(guildID, commandID, command) {
        process.emitWarning("editGuildCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildCommand(guildID, commandID, command);
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
    * @deprecated
    */
    editGuildEmoji(guildID, emojiID, options, reason) {
        process.emitWarning("editGuildEmoji() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildEmoji(guildID, emojiID, options, reason);
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
    * @deprecated
    */
    editGuildMember(guildID, memberID, options, reason) {
        process.emitWarning("editGuildMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildMember(guildID, memberID, options, reason);
    }

    /**
     * Edits the guild's MFA level. Requires the guild to be owned by the bot user
     * @arg {String} guildID The guild ID to edit the MFA level in
     * @arg {Object} options The options for the request
     * @arg {Number} options.level The new MFA level
     * @arg {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Number>} Returns the new MFA level
     * @deprecated
    */
    editGuildMFALevel(guildID, options) {
        process.emitWarning("editGuildMFALevel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildMFALevel(guildID, options);
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
    * @deprecated
    */
    editGuildScheduledEvent(guildID, eventID, event, reason) {
        process.emitWarning("editGuildScheduledEvent() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildScheduledEvent(guildID, eventID, event, reason);
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
    * @deprecated
    */
    editGuildSticker(guildID, stickerID, options, reason) {
        process.emitWarning("editGuildSticker() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildSticker(guildID, stickerID, options, reason);
    }

    /**
    * Edit a guild template
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @arg {Object} options The properties to edit
    * @arg {String} [options.name] The name of the template
    * @arg {String?} [options.description] The description for the template. Set to `null` to remove the description
    * @returns {Promise<GuildTemplate>}
    * @deprecated
    */
    editGuildTemplate(guildID, code, options) {
        process.emitWarning("editGuildTemplate() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildTemplate(guildID, code, options);
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
    * @deprecated
    */
    editGuildVoiceState(guildID, options, userID = "@me") {
        process.emitWarning("editGuildVoiceState() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildVoiceState(guildID, options, userID);
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
    * @deprecated
    */
    editGuildWelcomeScreen(guildID, options) {
        process.emitWarning("editGuildWelcomeScreen() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildWelcomeScreen(guildID, options);
    }

    /**
    * Modify a guild's widget
    * @arg {String} guildID The ID of the guild
    * @arg {Object} options The widget object to modify (https://discord.com/developers/docs/resources/guild#modify-guild-widget)
    * @returns {Promise<Object>} A guild widget object
    * @deprecated
    */
    editGuildWidget(guildID, options) {
        process.emitWarning("editGuildWidget() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editGuildWidget(guildID, options);
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
    * @deprecated
    */
    editMessage(channelID, messageID, content) {
        process.emitWarning("editMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editMessage(channelID, messageID, content);
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
    * @deprecated
    */
    editRole(guildID, roleID, options, reason) {
        process.emitWarning("editRole() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editRole(guildID, roleID, options, reason);
    }

    /**
     * Updates the role connection metadata
     * @arg {Array<Object>} metadata An array of [role connection metadata objects](https://discord.com/developers/docs/resources/application-role-connection-metadata#application-role-connection-metadata-object)
     * @returns {Promise<Object[]>}
     * @deprecated
    */
    editRoleConnectionMetadata(metadata) {
        process.emitWarning("editRoleConnectionMetadata() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editRoleConnectionMetadata(metadata);
    }

    /**
    * Edit a guild role's position. Note that role position numbers are highest on top and lowest at the bottom.
    * @arg {String} guildID The ID of the guild the role is in
    * @arg {String} roleID The ID of the role
    * @arg {Number} position The new position of the role
    * @returns {Promise}
    * @deprecated
    */
    editRolePosition(guildID, roleID, position) {
        process.emitWarning("editRolePosition() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editRolePosition(guildID, roleID, position);
    }

    /**
    * Edit properties of the bot user
    * @arg {Object} options The properties to edit
    * @arg {String} [options.username] The new username
    * @arg {String?} [options.avatar] The new avatar as a base64 data URI. Note: base64 strings alone are not base64 data URI strings
    * @returns {Promise<ExtendedUser>}
    * @deprecated
    */
    editSelf(options) {
        process.emitWarning("editSelf() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editSelf(options);
    }

    /**
    * Update a stage instance
    * @arg {String} channelID The ID of the stage channel associated with the instance
    * @arg {Object} options The properties to edit
    * @arg {Number} [options.privacyLevel] The privacy level of the stage instance. 1 is public (deprecated), 2 is guild only
    * @arg {String} [options.topic] The stage instance topic
    * @returns {Promise<StageInstance>}
    * @deprecated
    */
    editStageInstance(channelID, options) {
        process.emitWarning("editStageInstance() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editStageInstance(channelID, options);
    }

    /**
    * Update the bot's status on all guilds
    * @arg {String} [status] Sets the bot's status, either "online", "idle", "dnd", or "invisible"
    * @arg {Array | Object} [activities] Sets the bot's activities. A single activity object is also accepted for backwards compatibility
    * @arg {String} activities[].name The name of the activity
    * @arg {Number} activities[].type The type of the activity. 0 is playing, 1 is streaming (Twitch only), 2 is listening, 3 is watching, 5 is competing in
    * @arg {String} [activities[].url] The URL of the activity
    * @deprecated
    */
    editStatus(status, activities) {
        process.emitWarning("editStatus() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editStatus(status, activities);
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
    * @deprecated
    */
    editWebhook(webhookID, options, token, reason) {
        process.emitWarning("editWebhook() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editWebhook(webhookID, options, token, reason);
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
    * @deprecated
    */
    editWebhookMessage(webhookID, token, messageID, options) {
        process.emitWarning("editWebhookMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.editWebhookMessage(webhookID, token, messageID, options);
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
    * @deprecated
    */
    executeSlackWebhook(webhookID, token, options) {
        process.emitWarning("executeSlackWebhook() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.executeSlackWebhook(webhookID, token, options);
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
    * @deprecated
    */
    executeWebhook(webhookID, token, options) {
        process.emitWarning("executeWebhook() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.executeWebhook(webhookID, token, options);
    }

    /**
     * Follow a NewsChannel in another channel. This creates a webhook in the target channel
     * @arg {String} channelID The ID of the NewsChannel
     * @arg {String} webhookChannelID The ID of the target channel
     * @returns {Object} An object containing the NewsChannel's ID and the new webhook's ID
     * @deprecated
    */
    followChannel(channelID, webhookChannelID) {
        process.emitWarning("followChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.followChannel(channelID, webhookChannelID);
    }

    /**
    * Get all active threads in a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} An object containing an array of `threads` and an array of `members`
    * @deprecated
    */
    getActiveGuildThreads(guildID) {
        process.emitWarning("getActiveGuildThreads() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getActiveGuildThreads(guildID);
    }

    /**
    * Get all archived threads in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} type The type of thread channel, either "public" or "private"
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    * @deprecated
    */
    getArchivedThreads(channelID, type, options = {}) {
        process.emitWarning("getArchivedThreads() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getArchivedThreads(channelID, type, options);
    }

    /**
     * Get an existing auto moderation rule
     * @arg {String} guildID The ID of the guild to get the rule from
     * @arg {String} ruleID The ID of the rule to get
     * @returns {Promise<AutoModerationRule>}
     * @deprecated
    */
    getAutoModerationRule(guildID, ruleID) {
        process.emitWarning("getAutoModerationRule() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getAutoModerationRule(guildID, ruleID);
    }

    /**
     * Get a guild's auto moderation rules
     * @arg {String} guildID The ID of the guild to get the rules of
     * @returns {Promise<Object[]>}
     * @deprecated
    */
    getAutoModerationRules(guildID) {
        process.emitWarning("getAutoModerationRules() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getAutoModerationRules(guildID);
    }

    /**
    * Get general and bot-specific info on connecting to the Discord gateway (e.g. connection ratelimit)
    * @returns {Promise<Object>} Resolves with an object containing gateway connection info
    * @deprecated
    */
    getBotGateway() {
        process.emitWarning("getBotGateway() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getBotGateway();
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
    * @deprecated
    */
    getChannelInvites(channelID) {
        process.emitWarning("getChannelInvites() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getChannelInvites(channelID);
    }

    /**
    * Get all the webhooks in a channel
    * @arg {String} channelID The ID of the channel to get webhooks for
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    * @deprecated
    */
    getChannelWebhooks(channelID) {
        process.emitWarning("getChannelWebhooks() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getChannelWebhooks(channelID);
    }

    /**
    * Get a global application command
    * @arg {String} commandID The command id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand>}
    * @deprecated
    */
    getCommand(commandID, withLocalizations) {
        process.emitWarning("getCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getCommand(commandID, withLocalizations);
    }

    /**
    * Get the a guild's application command permissions
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @returns {Promise<Object>} Resolves with a guild application command permissions object.
    * @deprecated
    */
    getCommandPermissions(guildID, commandID) {
        process.emitWarning("getCommandPermissions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getCommandPermissions(guildID, commandID);
    }

    /**
    * Get the global application commands
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand[]>}
    * @deprecated
    */
    getCommands(withLocalizations) {
        process.emitWarning("getCommands() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getCommands(withLocalizations);
    }

    /**
    * Get a DM channel with a user, or create one if it does not exist
    * @arg {String} userID The ID of the user
    * @returns {Promise<PrivateChannel>}
    * @deprecated
    */
    getDMChannel(userID) {
        process.emitWarning("getDMChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getDMChannel(userID);
    }

    /**
    * Get info on connecting to the Discord gateway
    * @returns {Promise<Object>} Resolves with an object containing gateway connection info
    * @deprecated
    */
    getGateway() {
        process.emitWarning("getGateway() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGateway();
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
    * @deprecated
    */
    getGuildAuditLog(guildID, options = {}) {
        process.emitWarning("getGuildAuditLog() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildAuditLog(guildID, options);
    }

    /**
    * Get a ban from the ban list of a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the banned user
    * @returns {Promise<Object>} Resolves with {reason: String, user: User}
    * @deprecated
    */
    getGuildBan(guildID, userID) {
        process.emitWarning("getGuildBan() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildBan(guildID, userID);
    }

    /**
    * Get the ban list of a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Only get users after given user ID
    * @arg {String} [options.before] Only get users before given user ID
    * @arg {Number} [options.limit=1000] The maximum number of users to return
    * @returns {Promise<Array<Object>>} Resolves with an array of { reason: String, user: User }
    * @deprecated
    */
    async getGuildBans(guildID, options = {}) {
        process.emitWarning("getGuildBans() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildBans(guildID, options);
    }

    /**
    * Get a guild application command
    * @arg {String} guildID The guild ID
    * @arg {String} commandID The command id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand>} Resolves with an command object.
    * @deprecated
    */
    getGuildCommand(guildID, commandID, withLocalizations) {
        process.emitWarning("getGuildCommand() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildCommand(guildID, commandID, withLocalizations);
    }

    /**
    * Get the all of a guild's application command permissions
    * @arg {String} guildID The guild ID
    * @returns {Promise<Array<Object>>} Resolves with an array of guild application command permissions objects.
    * @deprecated
    */
    getGuildCommandPermissions(guildID) {
        process.emitWarning("getGuildCommandPermissions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildCommandPermissions(guildID);
    }

    /**
    * Get a guild's application commands
    * @arg {String} guildID The guild id
    * @arg {Boolean} [withLocalizations] Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<ApplicationCommand[]>} Resolves with an array of command objects.
    * @deprecated
    */
    getGuildCommands(guildID, withLocalizations) {
        process.emitWarning("getGuildCommands() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildCommands(guildID, withLocalizations);
    }

    /**
    * Get a list of integrations for a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<GuildIntegration>>}
    * @deprecated
    */
    getGuildIntegrations(guildID) {
        process.emitWarning("getGuildIntegrations() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildIntegrations(guildID);
    }

    /**
    * Get all invites in a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Invite>>}
    * @deprecated
    */
    getGuildInvites(guildID) {
        process.emitWarning("getGuildInvites() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildInvites(guildID);
    }

    /**
    * Get a guild preview for a guild. Only available for community guilds.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<GuildPreview>}
    * @deprecated
    */
    getGuildPreview(guildID) {
        process.emitWarning("getGuildPreview() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildPreview(guildID);
    }

    /**
    * Get a guild's scheduled events
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to each event
    * @returns {Promise<Array<GuildScheduledEvent>>}
    * @deprecated
    */
    getGuildScheduledEvents(guildID, options = {}) {
        process.emitWarning("getGuildScheduledEvents() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildScheduledEvents(guildID, options);
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
    * @deprecated
    */
    getGuildScheduledEventUsers(guildID, eventID, options = {}) {
        process.emitWarning("getGuildScheduledEventUsers() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildScheduledEventUsers(guildID, eventID, options);
    }

    /**
    * Get a guild template
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    * @deprecated
    */
    getGuildTemplate(code) {
        process.emitWarning("getGuildTemplate() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildTemplate(code);
    }

    /**
    * Get a guild's templates
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<GuildTemplate>>}
    * @deprecated
    */
    getGuildTemplates(guildID) {
        process.emitWarning("getGuildTemplates() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildTemplates(guildID);
    }

    /**
    * Returns the vanity url of the guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    * @deprecated
    */
    getGuildVanity(guildID) {
        process.emitWarning("getGuildVanity() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildVanity(guildID);
    }

    /**
    * Get all the webhooks in a guild
    * @arg {String} guildID The ID of the guild to get webhooks for
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    * @deprecated
    */
    getGuildWebhooks(guildID) {
        process.emitWarning("getGuildWebhooks() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildWebhooks(guildID);
    }

    /**
    * Get the welcome screen of a Community guild, shown to new members
    * @arg {String} guildID The ID of the guild to get the welcome screen for
    * @returns {Promise<Object>}
    * @deprecated
    */
    getGuildWelcomeScreen(guildID) {
        process.emitWarning("getGuildWelcomeScreen() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildWelcomeScreen(guildID);
    }

    /**
    * Get a guild's widget object
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} A guild widget object
    * @deprecated
    */
    getGuildWidget(guildID) {
        process.emitWarning("getGuildWidget() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildWidget(guildID);
    }

    /**
    * Get a guild's widget settings object. Requires MANAGE_GUILD permission
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Object>} A guild widget setting object
    * @deprecated
    */
    getGuildWidgetSettings(guildID) {
        process.emitWarning("getGuildWidgetSettings() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildWidgetSettings(guildID);
    }

    /**
    * Get info on an invite
    * @arg {String} inviteID The ID of the invite
    * @arg {Object | Boolean} [options] Options for fetching the invite.
    * @arg {Boolean} [options.withCounts] Whether to fetch additional invite info or not (approximate member counts, approximate presences, channel counts, etc.)
    * @arg {Boolean} [options.withExpiration] Whether to fetch the expiration time or not
    * @arg {String} [options.guildScheduledEventID] The guild scheduled event ID to include along with the invite
    * @returns {Promise<Invite>}
    * @deprecated
    */
    getInvite(inviteID, options = {}) {
        process.emitWarning("getInvite() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getInvite(inviteID, options);
    }

    /**
    * Get joined private archived threads in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {Object} [options] Additional options when requesting archived threads
    * @arg {Date} [options.before] List of threads to return before the timestamp
    * @arg {Number} [options.limit] Maximum number of threads to return
    * @returns {Promise<Object>} An object containing an array of `threads`, an array of `members` and whether the response `hasMore` threads that could be returned in a subsequent call
    * @deprecated
    */
    getJoinedPrivateArchivedThreads(channelID, options = {}) {
        process.emitWarning("getJoinedPrivateArchivedThreads() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getJoinedPrivateArchivedThreads(channelID, options);
    }

    /**
    * Get a previous message in a channel
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise<Message>}
    * @deprecated
    */
    getMessage(channelID, messageID) {
        process.emitWarning("getMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getMessage(channelID, messageID);
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
    * @deprecated
    */
    getMessageReaction(channelID, messageID, reaction, options = {}) {
        process.emitWarning("getMessageReaction() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getMessageReaction(channelID, messageID, reaction, options);
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
    * @deprecated
    */
    async getMessages(channelID, options = {}) {
        process.emitWarning("getMessages() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getMessages(channelID, options);
    }

    /**
     * Get the list of sticker packs available to Nitro subscribers
     * @returns {Promise<Object>} An object whichs contains a value which contains an array of sticker packs
     * @deprecated
    */
    getNitroStickerPacks() {
        process.emitWarning("getNitroStickerPacks() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getNitroStickerPacks();
    }

    /**
    * Get data on the bot's OAuth2 application
    * @returns {Promise<Object>} The bot's application data. Refer to [Discord's Documentation](https://discord.com/developers/docs/topics/oauth2#get-current-application-information) for object structure
    * @deprecated
    */
    getOAuthApplication() {
        process.emitWarning("getOAuthApplication() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getOAuthApplication();
    }

    /**
    * Get all the pins in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<Array<Message>>}
    * @deprecated
    */
    getPins(channelID) {
        process.emitWarning("getPins() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getPins(channelID);
    }

    /**
    * Get the prune count for a guild
    * @arg {String} guildID The ID of the guild
    * @arg {Number} [options] The options to use to get number of prune members
    * @arg {Number} [options.days=7] The number of days of inactivity to prune for
    * @arg {Array<String>} [options.includeRoles] An array of role IDs that members must have to be considered for pruning
    * @returns {Promise<Number>} Resolves with the number of members that would be pruned
    * @deprecated
    */
    getPruneCount(guildID, options = {}) {
        process.emitWarning("getPruneCount() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getPruneCount(guildID, options);
    }

    /**
    * Get a channel's data via the REST API. REST mode is required to use this endpoint.
    * @arg {String} channelID The ID of the channel
    * @returns {Promise<CategoryChannel | PrivateChannel | TextChannel | TextVoiceChannel | NewsChannel | NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>}
    * @deprecated
    */
    getRESTChannel(channelID) {
        process.emitWarning("getRESTChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getChannel(channelID);
    }

    /**
    * Get a guild's data via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {Boolean} [withCounts=false] Whether the guild object will have approximateMemberCount and approximatePresenceCount
    * @returns {Promise<Guild>}
    * @deprecated
    */
    getRESTGuild(guildID, withCounts = false) {
        process.emitWarning("getRESTGuild() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuild(guildID, withCounts);
    }

    /**
    * Get a guild's channels via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<CategoryChannel | TextChannel | TextVoiceChannel | NewsChannel | StageChannel>>}
    * @deprecated
    */
    getRESTGuildChannels(guildID) {
        process.emitWarning("getRESTGuildChannels() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildChannels(guildID);
    }

    /**
    * Get a guild emoji via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} emojiID The ID of the emoji
    * @returns {Promise<Object>} An emoji object
    * @deprecated
    */
    getRESTGuildEmoji(guildID, emojiID) {
        process.emitWarning("getRESTGuildEmoji() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildEmoji(guildID, emojiID);
    }

    /**
    * Get a guild's emojis via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Object>>} An array of guild emoji objects
    * @deprecated
    */
    getRESTGuildEmojis(guildID) {
        process.emitWarning("getRESTGuildEmojis() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildEmojis(guildID);
    }

    /**
    * Get a guild's members via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @returns {Promise<Member>}
    * @deprecated
    */
    getRESTGuildMember(guildID, memberID) {
        process.emitWarning("getRESTGuildMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getGuildMember(guildID, memberID);
    }

    /**
    * Get a guild's members via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] The highest user ID of the previous page
    * @arg {Number} [options.limit=1] The max number of members to get (1 to 1000)
    * @returns {Promise<Array<Member>>}
    * @deprecated
    */
    getRESTGuildMembers(guildID, options = {}) {
        process.emitWarning("getRESTGuildMembers() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTGuildMembers(guildID, options);
    }

    /**
    * Get a guild's roles via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Role>>}
    * @deprecated
    */
    getRESTGuildRoles(guildID) {
        process.emitWarning("getRESTGuildRoles() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTGuildRoles(guildID);
    }

    /**
    * Get a list of the user's guilds via the REST API. REST mode is required to use this endpoint.
    * @arg {Object} [options] Options for the request.
    * @arg {String} [options.after] The highest guild ID of the previous page
    * @arg {String} [options.before] The lowest guild ID of the next page
    * @arg {Number} [options.limit=100] The max number of guilds to get (1 to 1000)
    * @returns {Promise<Array<Guild>>}
    * @deprecated
    */
    getRESTGuilds(options = {}) {
        process.emitWarning("getRESTGuilds() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTGuilds(options);
    }

    /**
    * Get a guild scheduled event via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} eventID The ID of the guild scheduled event
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to the event
    * @returns {Promise<GuildScheduledEvent>}
    * @deprecated
    */
    getRESTGuildScheduledEvent(guildID, eventID, options = {}) {
        process.emitWarning("getRESTGuildScheduledEvent() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTGuildScheduledEvent(guildID, eventID, options);
    }

    /**
    * Get a guild sticker via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
    * @deprecated
    */
    getRESTGuildSticker(guildID, stickerID) {
        process.emitWarning("getRESTGuildSticker() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTGuildSticker(guildID, stickerID);
    }

    /**
    * Get a guild's stickers via the REST API. REST mode is required to use this endpoint.
    * @arg {String} guildID The ID of the guild
    * @returns {Promise<Array<Object>>} An array of guild sticker objects
    * @deprecated
    */
    getRESTGuildStickers(guildID) {
        process.emitWarning("getRESTGuildStickers() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTGuildStickers(guildID);
    }

    /**
    * Get a sticker via the REST API. REST mode is required to use this endpoint.
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
     * @deprecated
    */
    getRESTSticker(stickerID) {
        process.emitWarning("getRESTSticker() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTSticker(stickerID);
    }

    /**
    * Get a user's data via the REST API. REST mode is required to use this endpoint.
    * @arg {String} userID The ID of the user
    * @returns {Promise<User>}
    * @deprecated
    */
    getRESTUser(userID) {
        process.emitWarning("getRESTUser() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRESTUser(userID);
    }

    /**
     * Gets the role connection metadata
     * @returns {Promise<Object[]>}
     * @deprecated
    */
    getRoleConnectionMetadata() {
        process.emitWarning("getRoleConnectionMetadata() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getRoleConnectionMetadata();
    }

    /**
    * Get properties of the bot user
    * @returns {Promise<ExtendedUser>}
    * @deprecated
    */
    getSelf() {
        process.emitWarning("getSelf() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getSelf();
    }

    /**
    * Get the stage instance associated with a stage channel
    * @arg {String} channelID The stage channel ID
    * @returns {Promise<StageInstance>}
    * @deprecated
    */
    getStageInstance(channelID) {
        process.emitWarning("getStageInstance() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getStageInstance(channelID);
    }

    /**
     * Gets a thread member object for a specified user
     * @arg {String} channelID The ID of the thread channel
     * @arg {String} memberID The ID of the member
     * @arg {Object} [options] Options for the request
     * @arg {Boolean} [options.withMember] Whether to include a Member object for each thread member
     * @returns {Promise<ThreadMember>}
     * @deprecated
    */
    getThreadMember(channelID, memberID, options = {}) {
        process.emitWarning("getThreadMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getThreadMember(channelID, memberID, options);
    }

    /**
    * Get a list of members that are part of a thread channel
    * @arg {String} channelID The ID of the thread channel
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Fetch thread members after this user ID
    * @arg {Number} [options.limit] The maximum amount of thread members to fetch
    * @arg {Boolean} [options.withMember] Whether to include a Member object for each thread member
    * @returns {Promise<Array<ThreadMember>>}
    * @deprecated
    */
    getThreadMembers(channelID, options = {}) {
        process.emitWarning("getThreadMembers() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getThreadMembers(channelID, options);
    }

    /**
    * Get a list of general/guild-specific voice regions
    * @arg {String} [guildID] The ID of the guild
    * @returns {Promise<Array<Object>>} Resolves with an array of voice region objects
    * @deprecated
    */
    getVoiceRegions(guildID) {
        process.emitWarning("getVoiceRegions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getVoiceRegions(guildID);
    }

    /**
    * Get a webhook
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} [token] The token of the webhook, used instead of the Bot Authorization token
    * @returns {Promise<Object>} Resolves with a webhook object
    * @deprecated
    */
    getWebhook(webhookID, token) {
        process.emitWarning("getWebhook() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getWebhook(webhookID, token);
    }

    /**
    * Get a webhook message
    * @arg {String} webhookID The ID of the webhook
    * @arg {String} token The token of the webhook
    * @arg {String} messageID The message ID of a message sent by this webhook
    * @returns {Promise<Message>} Resolves with a webhook message
    * @deprecated
    */
    getWebhookMessage(webhookID, token, messageID) {
        process.emitWarning("getWebhookMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.getWebhookMessage(webhookID, token, messageID);
    }

    /**
    * Join a thread
    * @arg {String} channelID The ID of the thread channel
    * @arg {String} [userID="@me"] The user ID of the user joining
    * @returns {Promise}
    * @deprecated
    */
    joinThread(channelID, userID = "@me") {
        process.emitWarning("joinThread() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.joinThread(channelID, userID);
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
        if(channel.guild?.members.has(this.user.id) && !(channel.permissionsOf(this.user.id).allow & Constants.Permissions.voiceConnect)) {
            return Promise.reject(new Error("Insufficient permission to connect to voice channel"));
        }
        this.shards.get(this.guildShardMap[this.channelGuildMap[channelID]] || 0).sendWS(Constants.GatewayOPCodes.VOICE_STATE_UPDATE, {
            guild_id: this.channelGuildMap[channelID] || null,
            channel_id: channelID || null,
            self_mute: options.selfMute || false,
            self_deaf: options.selfDeaf || false
        });
        options.opusOnly ??= this.options.opusOnly;
        return this.voiceConnections.join(this.channelGuildMap[channelID], channelID, options);
    }

    /**
    * Kick a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    kickGuildMember(guildID, userID, reason) {
        process.emitWarning("kickGuildMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.kickGuildMember(guildID, userID, reason);
    }

    /**
    * Leave a guild
    * @arg {String} guildID The ID of the guild
    * @returns {Promise}
    * @deprecated
    */
    leaveGuild(guildID) {
        process.emitWarning("leaveGuild() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.leaveGuild(guildID);
    }

    /**
    * Leave a thread
    * @arg {String} channelID The ID of the thread channel
    * @arg {String} [userID="@me"] The user ID of the user leaving
    * @returns {Promise}
    * @deprecated
    */
    leaveThread(channelID, userID = "@me") {
        process.emitWarning("leaveThread() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.leaveThread(channelID, userID);
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
     * @inheritdoc
     */
    on(event, listener) {
        if(event === "rawREST") {
            process.emitWarning("Client's \"rawREST\" event is deprecated, use RESTClient's \"response\" event instead.", "DeprecationWarning");
        }

        return super.on(event, listener);
    }

    /**
     * @inheritdoc
     */
    once(event, listener) {
        if(event === "rawREST") {
            process.emitWarning("Client's \"rawREST\" event is deprecated, use RESTClient's \"response\" event instead.", "DeprecationWarning");
        }

        return super.once(event, listener);
    }

    /**
    * Pin a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    * @deprecated
    */
    pinMessage(channelID, messageID) {
        process.emitWarning("pinMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.pinMessage(channelID, messageID);
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
    * @deprecated
    */
    pruneMembers(guildID, options = {}) {
        process.emitWarning("pruneMembers() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.pruneMembers(guildID, options);
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
    * @deprecated
    */
    async purgeChannel(channelID, options) {
        process.emitWarning("purgeChannel() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.purgeChannel(channelID, options);
    }

    /**
    * Remove a role from a guild member
    * @arg {String} guildID The ID of the guild
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    removeGuildMemberRole(guildID, memberID, roleID, reason) {
        process.emitWarning("removeGuildMemberRole() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.removeGuildMemberRole(guildID, memberID, roleID, reason);
    }

    /**
    * Remove a reaction from a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @arg {String} [userID="@me"] The ID of the user to remove the reaction for
    * @returns {Promise}
    * @deprecated
    */
    removeMessageReaction(channelID, messageID, reaction, userID) {
        process.emitWarning("removeMessageReaction() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.removeMessageReaction(channelID, messageID, reaction, userID);
    }

    /**
    * Remove all reactions from a message for a single emoji.
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @arg {String} reaction The reaction (Unicode string if Unicode emoji, `emojiName:emojiID` if custom emoji)
    * @returns {Promise}
    * @deprecated
    */
    removeMessageReactionEmoji(channelID, messageID, reaction) {
        process.emitWarning("removeMessageReactionEmoji() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.removeMessageReactionEmoji(channelID, messageID, reaction);
    }

    /**
    * Remove all reactions from a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    * @deprecated
    */
    removeMessageReactions(channelID, messageID) {
        process.emitWarning("removeMessageReactions() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.removeMessageReactions(channelID, messageID);
    }

    /**
    * Search for guild members by partial nickname/username
    * @arg {String} guildID The ID of the guild
    * @arg {String} query The query string to match username(s) and nickname(s) against
    * @arg {Number} [limit=1] The maximum number of members you want returned, capped at 100
    * @returns {Promise<Array<Member>>}
    * @deprecated
    */
    searchGuildMembers(guildID, query, limit) {
        process.emitWarning("searchGuildMembers() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.searchGuildMembers(guildID, query, limit);
    }

    /**
    * Send typing status in a channel
    * @arg {String} channelID The ID of the channel
    * @returns {Promise}
    * @deprecated
    */
    sendChannelTyping(channelID) {
        process.emitWarning("sendChannelTyping() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.sendChannelTyping(channelID);
    }

    /**
    * Force a guild template to sync
    * @arg {String} guildID The ID of the guild
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    * @deprecated
    */
    syncGuildTemplate(guildID, code) {
        process.emitWarning("syncGuildTemplate() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.syncGuildTemplate(guildID, code);
    }

    /**
    * Unban a user from a guild
    * @arg {String} guildID The ID of the guild
    * @arg {String} userID The ID of the user
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    * @deprecated
    */
    unbanGuildMember(guildID, userID, reason) {
        process.emitWarning("unbanGuildMember() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.unbanGuildMember(guildID, userID, reason);
    }

    /**
    * Unpin a message
    * @arg {String} channelID The ID of the channel
    * @arg {String} messageID The ID of the message
    * @returns {Promise}
    * @deprecated
    */
    unpinMessage(channelID, messageID) {
        process.emitWarning("unpinMessage() is deprecated and will be removed in the future.", "DeprecationWarning");
        return this.rest.unpinMessage(channelID, messageID);
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
