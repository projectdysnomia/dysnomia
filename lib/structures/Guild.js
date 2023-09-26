"use strict";

const Base = require("./Base");
const Channel = require("./Channel");
const Endpoints = require("../rest/Endpoints");
const Collection = require("../util/Collection");
const GuildChannel = require("./GuildChannel");
const Member = require("./Member");
const Role = require("./Role");
const VoiceState = require("./VoiceState");
const Permission = require("./Permission");
const GuildScheduledEvent = require("./GuildScheduledEvent");
const {Permissions} = require("../Constants");
const StageInstance = require("./StageInstance");
const ThreadChannel = require("./ThreadChannel");

/**
* Represents a guild
* @extends Base
*/
class Guild extends Base {
    #client;
    /**
     * Collection of Channels in the guild
     * @type {Collection<GuildChannel>}
     */
    channels = new Collection(GuildChannel);
    /**
     * A collection of scheduled events in the guild
     * @type {Collection<GuildScheduledEvent>}
     */
    events = new Collection(GuildScheduledEvent);
    /**
     * Collection of Members in the guild
     * @type {Collection<Member>}
     */
    members = new Collection(Member);
    /**
     * Collection of Roles in the guild
     * @type {Collection<Role>}
     */
    roles = new Collection(Role);
    /**
     * Collection of stage instances in the guild
     * @type {Collection<StageInstance>}
     */
    stageInstances = new Collection(StageInstance);
    /**
     * Collection of threads that the current user has permission to view
     * @type {Collection<ThreadChannel>}
     */
    threads = new Collection(ThreadChannel);
    /**
     * Collection of voice states in the guild
     * @type {Collection<VoiceState>}
     */
    voiceStates = new Collection(VoiceState);

    /**
     * Timestamp of the guild's creation
     * @member {Number} Guild#createdAt
     */
    /**
     * The ID of the guild
     * @member {String} Guild#id
     */

    constructor(data, client) {
        super(data.id);
        this.#client = client;
        /**
         * The Shard that owns the guild
         * @type {Shard}
         */
        this.shard = client.shards.get(client.guildShardMap[this.id] || (Base.getDiscordEpoch(data.id) % client.shards.options.maxShards) || 0);
        /**
         * Whether the guild is unavailable or not
         * @type {Boolean}
         */
        this.unavailable = !!data.unavailable;
        /**
         * Timestamp of when the bot account joined the guild
         * @type {Number}
         */
        this.joinedAt = Date.parse(data.joined_at);

        /**
         * Number of members in the guild
         * @type {Number}
         */
        this.memberCount = data.member_count;
        /**
         * The application ID of the guild creator if it is bot-created
         * @type {String?}
         */
        this.applicationID = data.application_id;

        if(data.widget_enabled !== undefined) {
            /**
             * Whether the guild widget is enabled. REST only.
             * @type {Boolean?}
             */
            this.widgetEnabled = data.widget_enabled;
        }
        if(data.widget_channel_id !== undefined) {
            /**
             * The channel ID that the widget will generate an invite to. REST only.
             * @type {String?}
             */
            this.widgetChannelID = data.widget_channel_id;
        }

        if(data.approximate_member_count !== undefined) {
            /**
             * The approximate number of members in the guild (REST only)
             * @type {Number?}
             */
            this.approximateMemberCount = data.approximate_member_count;
        }
        if(data.approximate_presence_count !== undefined) {
            /**
             * The approximate number of presences in the guild (REST only)
             * @type {Number?}
             */
            this.approximatePresenceCount = data.approximate_presence_count;
        }

        if(data.roles) {
            for(const role of data.roles) {
                this.roles.add(role, this);
            }
        }

        if(data.channels) {
            for(const channelData of data.channels) {
                channelData.guild_id = this.id;
                const channel = Channel.from(channelData, client);
                channel.guild = this;
                this.channels.add(channel, client);
                client.channelGuildMap[channel.id] = this.id;
            }
        }

        if(data.threads) {
            for(const threadData of data.threads) {
                threadData.guild_id = this.id;
                const channel = Channel.from(threadData, client);
                channel.guild = this;
                this.threads.add(channel, client);
                client.threadGuildMap[channel.id] = this.id;
            }
        }

        if(data.members) {
            for(const member of data.members) {
                member.id = member.user.id;
                this.members.add(member, this);
            }
        }

        if(data.stage_instances) {
            for(const stageInstance of data.stage_instances) {
                stageInstance.guild_id = this.id;
                this.stageInstances.add(stageInstance, client);
            }
        }

        if(data.presences) {
            for(const presence of data.presences) {
                if(!this.members.get(presence.user.id)) {
                    let userData = client.users.get(presence.user.id);
                    if(userData) {
                        userData = `{username: ${userData.username}, id: ${userData.id}, discriminator: ${userData.discriminator}}`;
                    }
                    client.emit("debug", `Presence without member. ${presence.user.id}. In global user cache: ${userData}. ` + JSON.stringify(presence), this.shard.id);
                    continue;
                }
                presence.id = presence.user.id;
                this.members.update(presence);
            }
        }

        if(data.voice_states) {
            for(const voiceState of data.voice_states) {
                if(!this.members.get(voiceState.user_id)) {
                    continue;
                }
                voiceState.id = voiceState.user_id;
                try {
                    const channel = this.channels.get(voiceState.channel_id);
                    const member = this.members.update(voiceState);
                    channel?.voiceMembers?.add(member);
                } catch(err) {
                    client.emit("error", err, this.shard.id);
                    continue;
                }
                if(client.options.seedVoiceConnections && voiceState.id === client.user.id && !client.voiceConnections.get(this.id)) {
                    process.nextTick(() => this.#client.joinVoiceChannel(voiceState.channel_id));
                }
            }
        }

        if(data.guild_scheduled_events) {
            for(const event of data.guild_scheduled_events) {
                this.events.add(event, client);
            }
        }
        this.update(data);
    }

    update(data) {
        if(data.name !== undefined) {
            /**
             * The name of the guild
             * @type {String}
             */
            this.name = data.name;
        }
        if(data.verification_level !== undefined) {
            /**
             * The guild verification level
             * @type {Number}
             */
            this.verificationLevel = data.verification_level;
        }
        if(data.splash !== undefined) {
            /**
             * The hash of the guild splash image, or null if no splash (VIP only)
             * @type {String?}
             */
            this.splash = data.splash;
        }
        if(data.discovery_splash !== undefined) {
            /**
             * The hash of the guild discovery splash image, or null if no discovery splash
             * @type {String?}
             */
            this.discoverySplash = data.discovery_splash;
        }
        if(data.banner !== undefined) {
            /**
             * The hash of the guild banner image, or null if no banner (VIP only)
             * @type {String?}
             */
            this.banner = data.banner;
        }
        if(data.owner_id !== undefined) {
            /**
             * The ID of the user that is the guild owner
             * @type {String}
             */
            this.ownerID = data.owner_id;
        }
        if(data.icon !== undefined) {
            /**
             * The hash of the guild icon, or null if no icon
             * @type {String?}
             */
            this.icon = data.icon;
        }
        if(data.features !== undefined) {
            /**
             * An array of guild feature strings
             * @type {Array<String>}
             */
            this.features = data.features;
        }
        if(data.emojis !== undefined) {
            /**
             * An array of guild emoji objects
             * @type {Array<Object>}
             */
            this.emojis = data.emojis;
        }
        if(data.stickers !== undefined) {
            /**
             * An array of guild sticker objects
             * @type {Array<Object>?}
             */
            this.stickers = data.stickers;
        }
        if(data.afk_channel_id !== undefined) {
            /**
             * The ID of the AFK voice channel
             * @type {String?}
             */
            this.afkChannelID = data.afk_channel_id;
        }
        if(data.afk_timeout !== undefined) {
            /**
             * The AFK timeout in seconds
             * @type {Number}
             */
            this.afkTimeout = data.afk_timeout;
        }
        if(data.default_message_notifications !== undefined) {
            /**
             * The default notification settings for the guild. 0 is "All Messages", 1 is "Only @mentions"
             * @type {Number}
             */
            this.defaultNotifications = data.default_message_notifications;
        }
        if(data.mfa_level !== undefined) {
            /**
             * The admin 2FA level for the guild. 0 is not required, 1 is required
             * @type {Number}
             */
            this.mfaLevel = data.mfa_level;
        }
        if(data.large !== undefined) {
            /**
             * Whether the guild's member count is over the large guild threshold
             * @type {Boolean}
             */
            this.large = data.large;
        }
        if(data.max_presences !== undefined) {
            /**
             * The maximum number of people that can be online in a guild at once (returned from REST API only)
             * @type {Number?}
             */
            this.maxPresences = data.max_presences;
        }
        if(data.explicit_content_filter !== undefined) {
            /**
             * The explicit content filter level for the guild. 0 is off, 1 is on for people without roles, 2 is on for all
             * @type {Number}
             */
            this.explicitContentFilter = data.explicit_content_filter;
        }
        if(data.system_channel_id !== undefined) {
            /**
             * The ID of the default channel for system messages (built-in join messages and boost messages)
             * @type {String?}
             */
            this.systemChannelID = data.system_channel_id;
        }
        if(data.system_channel_flags !== undefined) {
            /**
             * The flags for the system channel
             * @type {Number}
             */
            this.systemChannelFlags = data.system_channel_flags;
        }
        if(data.premium_progress_bar_enabled !== undefined) {
            /**
             * If the boost progress bar is enabled
             * @type {Boolean}
             */
            this.premiumProgressBarEnabled = data.premium_progress_bar_enabled;
        }
        if(data.premium_tier !== undefined) {
            /**
             * Nitro boost level of the guild
             * @type {Number}
             */
            this.premiumTier = data.premium_tier;
        }
        if(data.premium_subscription_count !== undefined) {
            /**
             * The total number of users currently boosting this guild
             * @type {Number?}
             */
            this.premiumSubscriptionCount = data.premium_subscription_count;
        }
        if(data.vanity_url_code !== undefined) {
            /**
             * The vanity URL of the guild (VIP only)
             * @type {String?}
             */
            this.vanityURL = data.vanity_url_code;
        }
        if(data.preferred_locale !== undefined) {
            /**
             * Preferred "COMMUNITY" guild language used in server discovery and notices from Discord, and sent in interactions
             * @type {String}
             */
            this.preferredLocale = data.preferred_locale;
        }
        if(data.description !== undefined) {
            /**
             * The description for the guild (VIP only)
             * @type {String?}
             */
            this.description = data.description;
        }
        if(data.max_members !== undefined) {
            /**
             * The maximum amount of members for the guild
             * @type {Number?}
             */
            this.maxMembers = data.max_members;
        }
        if(data.public_updates_channel_id !== undefined) {
            /**
             * ID of the guild's updates channel if the guild has "COMMUNITY" features
             * @type {String?}
             */
            this.publicUpdatesChannelID = data.public_updates_channel_id;
        }
        if(data.rules_channel_id !== undefined) {
            /**
             * The channel where "COMMUNITY" guilds display rules and/or guidelines
             * @type {String?}
             */
            this.rulesChannelID = data.rules_channel_id;
        }
        if(data.max_video_channel_users !== undefined) {
            /**
             * The max number of users allowed in a video channel
             * @type {Number?}
             */
            this.maxVideoChannelUsers = data.max_video_channel_users;
        }
        if(data.max_stage_video_channel_users !== undefined) {
            /**
             * The max number of users allowed in a stage video channel
             * @type {Number?}
             */
            this.maxStageVideoChannelUsers = data.max_stage_video_channel_users;
        }
        if(data.welcome_screen !== undefined) {
            /**
             * The welcome screen of a Community guild, shown to new members
             * @type {Guild.WelcomeScreen?}
             */
            this.welcomeScreen = {
                description: data.welcome_screen.description,
                welcomeChannels: data.welcome_screen.welcome_channels?.map((c) => {
                    return {
                        channelID: c.channel,
                        description: c.description,
                        emojiID: c.emoji_id,
                        emojiName: c.emoji_name
                    };
                })
            };
        }
        if(data.nsfw_level !== undefined) {
            /**
             * The guild NSFW level designated by Discord
             * @type {Number}
             */
            this.nsfwLevel = data.nsfw_level;
        }
        if(data.safety_alerts_channel_id !== undefined) {
            /**
             * The ID of the channel where safety alerts from Discord are received
             * @type {String?}
             */
            this.safetyAlertsChannelID = data.safety_alerts_channel_id;
        }
    }

    /**
     * The URL of the guild's banner image
     * @type {String?}
     */
    get bannerURL() {
        return this.banner ? this.#client._formatImage(Endpoints.BANNER(this.id, this.banner)) : null;
    }

    /**
     * The URL of the guild's icon
     * @type {String?}
     */
    get iconURL() {
        return this.icon ? this.#client._formatImage(Endpoints.GUILD_ICON(this.id, this.icon)) : null;
    }

    /**
     * The URL of the guild's splash image
     * @type {String?}
     */
    get splashURL() {
        return this.splash ? this.#client._formatImage(Endpoints.GUILD_SPLASH(this.id, this.splash)) : null;
    }

    /**
     * The URL of the guild's discovery splash image
     * @type {String?}
     */
    get discoverySplashURL() {
        return this.discoverySplash ? this.#client._formatImage(Endpoints.GUILD_DISCOVERY_SPLASH(this.id, this.discoverySplash)) : null;
    }

    /**
     * Add a user to the guild
     * @arg {String} userID The ID of the user
     * @arg {String} accessToken The access token of the user
     * @arg {Object} [options] Options for adding the user
     * @arg {String} [options.nick] The user's nickname
     * @arg {Array<String>} [options.roles] Array of role IDs to add to the user
     * @arg {Boolean} [options.mute] Whether the user should be muted
     * @arg {Boolean} [options.deaf] Whether the user should be deafened
     */
    addMember(userID, accessToken, options = {}) {
        return this.#client.addGuildMember.call(this.#client, this.id, userID, accessToken, options);
    }

    /**
    * Add a role to a guild member
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    addMemberRole(memberID, roleID, reason) {
        return this.#client.addGuildMemberRole.call(this.#client, this.id, memberID, roleID, reason);
    }

    /**
    * Ban a user from the guild
    * @arg {String} userID The ID of the member
    * @arg {Number} [options.deleteMessageSeconds=0] Number of seconds to delete messages for, between 0 and 604,800 inclusive
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    banMember(userID, options) {
        return this.#client.banGuildMember.call(this.#client, this.id, userID, options);
    }

    /**
    * Edits command permissions for a multiple commands in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {Array<Object>} permissions An array of [partial guild command permissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure)
    * @returns {Promise<Array<Object>>} Returns an array of [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) objects.
    */
    bulkEditCommandPermissions(permissions) {
        return this.#client.bulkEditCommandPermissions.call(this.#client, this.id, permissions);
    }

    /**
    * Bulk create/edit guild application commands
    * @arg {Array<Object>} commands An array of [Command objects](https://discord.com/developers/docs/interactions/application-commands#application-command-object)
    * @returns {Promise<Object>} Resolves with a commands object
    */
    bulkEditCommands(commands) {
        return this.#client.bulkEditGuildCommands.call(this.#client, this.id, commands);
    }

    /**
     * Create an auto moderation rule
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
    createAutoModerationRule(options) {
        return this.#client.createAutoModerationRule.call(this.#client, this.id, options);
    }

    /**
    * Create a channel in the guild
    * @arg {String} name The name of the channel
    * @arg {Number} [type=0] The type of the channel, either 0 (text), 2 (voice), 4 (category), 5 (news), 13 (stage), or 15 (forum)
    * @arg {Object | String} [options] The properties the channel should have.
    * @arg {Array<Object>} [options.availableTags] Available tags for a forum channel
    * @arg {Number} [options.bitrate] The bitrate of the channel (voice channels only)
    * @arg {Number} [options.defaultAutoArchiveDuration] The default duration of newly created threads in minutes to automatically archive the thread after inactivity (60, 1440, 4320, 10080)
    * @arg {Number} [options.defaultForumLayout] The default forum layout view used to display forum posts
    * @arg {Object} [options.defaultReactionEmoji] The emoji to show as the reaction button (forum channels only)
    * @arg {Object} [options.defaultSortOrder] The default thread sorting order
    * @arg {Number} [options.defaultThreadRateLimitPerUser] The initial ratelimit of the channel to use on newly created threads, in seconds. 0 means no ratelimit is enabled
    * @arg {Boolean} [options.nsfw] The nsfw status of the channel
    * @arg {String?} [options.parentID] The ID of the parent category channel for this channel
    * @arg {Array} [options.permissionOverwrites] An array containing permission overwrite objects
    * @arg {Number} [options.position] The sorting position of the channel
    * @arg {Number} [options.rateLimitPerUser] The time in seconds a user has to wait before sending another message (does not affect bots or users with manageMessages/manageChannel permissions) (text channels only)
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @arg {String} [options.rtcRegion] The RTC region ID of the channel (automatic if `null`) (voice channels only)
    * @arg {String} [options.topic] The topic of the channel (text channels only)
    * @arg {Number} [options.userLimit] The channel user limit (voice channels only)
    * @arg {Number} [options.videoQualityMode] The camera video quality mode of the voice channel (voice channels only). `1` is auto, `2` is 720p
    * @returns {Promise<CategoryChannel | ForumChannel | ForumChannel | TextChannel | TextVoiceChannel>}
    */
    createChannel(name, type, options) {
        return this.#client.createChannel.call(this.#client, this.id, name, type, options);
    }

    /**
    * Create a guild application command
    * @arg {Object} command A command object
    * @arg {String} command.name The command name
    * @arg {Number} command.type The [type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types) of command
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {String} [command.defaultMemberPermissions] The [permissions](https://discord.com/developers/docs/topics/permissions) required by default for this command to be usable
    * @returns {Promise<ApplicationCommand>}
    */
    createCommand(command) {
        return this.#client.createGuildCommand.call(this.#client, this.id, command);
    }

    /**
    * Create a emoji in the guild
    * @arg {Object} options Emoji options
    * @arg {String} options.image The base 64 encoded string
    * @arg {String} options.name The name of emoji
    * @arg {Array} [options.roles] An array containing authorized role IDs
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} A guild emoji object
    */
    createEmoji(options, reason) {
        return this.#client.createGuildEmoji.call(this.#client, this.id, options, reason);
    }

    /**
    * Create a guild role
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
    createRole(options, reason) {
        return this.#client.createRole.call(this.#client, this.id, options, reason);
    }

    /**
    * Create a guild scheduled event
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
    createScheduledEvent(event, reason) {
        return this.#client.createGuildScheduledEvent.call(this.#client, this.id, event, reason);
    }

    /**
    * Create a guild sticker
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
    createSticker(options, reason) {
        return this.#client.createGuildSticker.call(this.#client, this.id, options, reason);
    }

    /**
    * Create a template for this guild
    * @arg {String} name The name of the template
    * @arg {String} [description] The description for the template
    * @returns {Promise<GuildTemplate>}
    */
    createTemplate(name, description) {
        return this.#client.createGuildTemplate.call(this.#client, this.id, name, description);
    }

    /**
    * Delete the guild (bot user must be owner)
    * @returns {Promise}
    */
    delete() {
        return this.#client.deleteGuild.call(this.#client, this.id);
    }

    /**
     * Delete an auto moderation rule
     * @arg {String} ruleID The ID of the rule to delete
     * @arg {String} [reason] The reason to be displayed in audit logs
     * @returns {Promise}
     */
    deleteAutoModerationRule(ruleID, reason) {
        return this.#client.deleteAutoModerationRule.call(this.#client, this.id, ruleID, reason);
    }

    /**
    * Delete a guild application command
    * @arg {String} commandID The command id
    * @returns {Promise}
    */
    deleteCommand(commandID) {
        return this.#client.deleteGuildCommand.call(this.#client, this.id, commandID);
    }

    /**
    * Delete a emoji in the guild
    * @arg {String} emojiID The ID of the emoji
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteEmoji(emojiID, reason) {
        return this.#client.deleteGuildEmoji.call(this.#client, this.id, emojiID, reason);
    }

    /**
    * Delete a guild integration
    * @arg {String} integrationID The ID of the integration
    * @returns {Promise}
    */
    deleteIntegration(integrationID) {
        return this.#client.deleteGuildIntegration.call(this.#client, this.id, integrationID);
    }

    /**
    * Delete a role
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteRole(roleID, reason) {
        return this.#client.deleteRole.call(this.#client, this.id, roleID, reason);
    }

    /**
    * Delete a guild scheduled event
    * @arg {String} eventID The ID of the event
    * @returns {Promise}
    */
    deleteScheduledEvent(eventID) {
        return this.#client.deleteGuildScheduledEvent.call(this.#client, this.id, eventID);
    }

    /**
    * Delete a guild sticker
    * @arg {String} stickerID The ID of the sticker
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    deleteSticker(stickerID, reason) {
        return this.#client.deleteGuildSticker.call(this.#client, this.id, stickerID, reason);
    }

    /**
    * Delete a guild template
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    deleteTemplate(code) {
        return this.#client.deleteGuildTemplate.call(this.#client, this.id, code);
    }

    /**
    * Get the guild's banner with the given format and size
    * @arg {String} [format] The filetype of the icon ("jpg", "jpeg", "png", "gif", or "webp")
    * @arg {Number} [size] The size of the icon (any power of two between 16 and 4096)
    * @returns {String?}
    */
    dynamicBannerURL(format, size) {
        return this.banner ? this.#client._formatImage(Endpoints.BANNER(this.id, this.banner), format, size) : null;
    }

    /**
     * Get the guild's discovery splash with the given format and size
     * @arg {String} [format] The filetype of the icon ("jpg", "jpeg", "png", "gif", or "webp")
     * @arg {Number} [size] The size of the icon (any power of two between 16 and 4096)
     * @returns {String?}
     */
    dynamicDiscoverySplashURL(format, size) {
        return this.discoverySplash ? this.#client._formatImage(Endpoints.GUILD_DISCOVERY_SPLASH(this.id, this.discoverySplash), format, size) : null;
    }

    /**
    * Get the guild's icon with the given format and size
    * @arg {String} [format] The filetype of the icon ("jpg", "jpeg", "png", "gif", or "webp")
    * @arg {Number} [size] The size of the icon (any power of two between 16 and 4096)
    * @returns {String?}
    */
    dynamicIconURL(format, size) {
        return this.icon ? this.#client._formatImage(Endpoints.GUILD_ICON(this.id, this.icon), format, size) : null;
    }

    /**
    * Get the guild's splash with the given format and size
    * @arg {String} [format] The filetype of the icon ("jpg", "jpeg", "png", "gif", or "webp")
    * @arg {Number} [size] The size of the icon (any power of two between 16 and 4096)
    * @returns {String?}
    */
    dynamicSplashURL(format, size) {
        return this.splash ? this.#client._formatImage(Endpoints.GUILD_SPLASH(this.id, this.splash), format, size) : null;
    }

    /**
    * Edit the guild
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
    * @arg {String} [options.ownerID] The ID of the member to transfer guild ownership to (bot user must be owner)
    * @arg {String} [options.preferredLocale] Preferred "COMMUNITY" guild language used in server discovery and notices from Discord, and sent in interactions
    * @arg {Boolean} [options.premiumProgressBarEnabled] If the boost progress bar is enabled
    * @arg {String?} [options.publicUpdatesChannelID] The id of the channel where admins and moderators of "COMMUNITY" guilds receive notices from Discord
    * @arg {String?} [options.rulesChannelID] The id of the channel where "COMMUNITY" guilds display rules and/or guidelines
    * @arg {String} [options.splash] The guild splash image as a base64 data URI (VIP only). Note: base64 strings alone are not base64 data URI strings
    * @arg {Number} [options.systemChannelFlags] The flags for the system channel
    * @arg {String?} [options.systemChannelID] The ID of the system channel
    * @arg {Number} [options.verificationLevel] The guild verification level
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Guild>}
    */
    edit(options, reason) {
        return this.#client.editGuild.call(this.#client, this.id, options, reason);
    }

    /**
     * edit an existing auto moderation rule
     * @arg {String} ruleID The ID of the rule to edit
     * @arg {Object} options The rule to create
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
    editAutoModerationRule(ruleID, options) {
        return this.#client.editAutoModerationRule.call(this.#client, this.id, ruleID, options);
    }

    /**
    * Edit multiple channels' positions. Note that channel position numbers are grouped by type (category, text, voice), then sorted in ascending order (lowest number is on top).
    * @arg {Array<Object>} channelPositions An array of [ChannelPosition](https://discord.com/developers/docs/resources/guild#modify-guild-channel-positions)
    * @arg {String} channelPositions[].id The ID of the channel
    * @arg {Number} [channelPositions[].position] The new position of the channel
    * @arg {Boolean} [channelPositions[].lockPermissions] Whether to sync the channel's permissions with the new parent, if changing parents
    * @arg {String} [channelPositions[].parentID] The new parent ID (category channel) for the channel that is moved. For each request, only one channel can change parents
    * @returns {Promise}
    */
    editChannelPositions(channelPositions) {
        return this.#client.editChannelPositions.call(this.#client, this.id, channelPositions);
    }

    /**
    * Edit a guild application command
    * @arg {String} commandID The command id
    * @arg {Object} command A command object
    * @arg {String} [command.name] The command name
    * @arg {Object} [command.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [command.description] The command description (chat input commands only)
    * @arg {Object} [command.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Array<Object>} [command.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {String} [command.defaultMemberPermissions] The [permissions](https://discord.com/developers/docs/topics/permissions) required by default for this command to be usable
    * @returns {Promise<ApplicationCommand>}
    */
    editCommand(commandID, command) {
        return this.#client.editGuildCommand.call(this.#client, this.id, commandID, command);
    }

    /**
    * Edits command permissions for a specific command in a guild.
    * Note: You can only add up to 10 permission overwrites for a command.
    * @arg {String} commandID The command id
    * @arg {Array<Object>} permissions An array of [permissions objects](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-application-command-permissions-structure)
    * @returns {Promise<Object>} Resolves with a [GuildApplicationCommandPermissions](https://discord.com/developers/docs/interactions/application-commands#application-command-permissions-object-guild-application-command-permissions-structure) object.
    */
    editCommandPermissions(commandID, permissions) {
        return this.#client.editCommandPermissions.call(this.#client, this.id, commandID, permissions);
    }

    /**
    * Edit a emoji in the guild
    * @arg {String} emojiID The ID of the emoji you want to modify
    * @arg {Object} options Emoji options
    * @arg {String} [options.name] The name of emoji
    * @arg {Array} [options.roles] An array containing authorized role IDs
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Object>} A guild emoji object
    */
    editEmoji(emojiID, options, reason) {
        return this.#client.editGuildEmoji.call(this.#client, this.id, emojiID, options, reason);
    }

    /**
    * Edit a guild member
    * @arg {String} memberID The ID of the member (use "@me" to edit the current bot user)
    * @arg {Object} options The properties to edit
    * @arg {String?} [options.channelID] The ID of the voice channel to move the member to (must be in voice). Set to `null` to disconnect the member
    * @arg {Date?} [options.communicationDisabledUntil] When the user's timeout should expire. Set to `null` to instantly remove timeout
    * @arg {Boolean} [options.deaf] Server deafen the member
    * @arg {Number} [options.flags] The guild member flag bit set
    * @arg {Boolean} [options.mute] Server mute the member
    * @arg {String} [options.nick] Set the member's guild nickname, "" to remove
    * @arg {Array<String>} [options.roles] The array of role IDs the member should have
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise<Member>}
    */
    editMember(memberID, options, reason) {
        return this.#client.editGuildMember.call(this.#client, this.id, memberID, options, reason);
    }

    /**
     * Edits the guild's MFA level. Requires the guild to be owned by the bot user
     * @param {Object} options The options for the request
     * @param {Number} options.level The new MFA level
     * @param {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Number>} Returns the new MFA level
     */
    editMFALevel(options) {
        return this.#client.editGuildMFALevel.call(this.#client, this.id, options);
    }

    /**
     * Edits the onboarding flow of this guild, shown to new members
     * @param {Object} options The [guild onboarding](https://discord.com/developers/docs/resources/guild#guild-onboarding-object) object
     * @param {String} [options.reason] The reason to be displayed in audit logs
     * @returns {Promise<Object>} Resolves with the [guild onboarding object](https://discord.com/developers/docs/resources/guild#guild-onboarding-object)
     */
    editOnboarding(options) {
        return this.#client.editGuildOnboarding.call(this.#client, this.id, options);
    }

    /**
    * Edit the guild role
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
    editRole(roleID, options, reason) {
        return this.#client.editRole.call(this.#client, this.id, roleID, options, reason);
    }

    /**
    * Edit this scheduled event
    * @arg {String} eventID The guild scheduled event ID
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
    editScheduledEvent(eventID, event, reason) {
        return this.#client.editGuildScheduledEvent.call(this.#client, this.id, eventID, event, reason);
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
    editSticker(stickerID, options, reason) {
        return this.#client.editGuildSticker.call(this.#client, this.id, stickerID, options, reason);
    }

    /**
    * Edit a guild template
    * @arg {String} code The template code
    * @arg {Object} options The properties to edit
    * @arg {String} [options.name] The name of the template
    * @arg {String?} [options.description] The desription for the template. Set to `null` to remove the description
    * @returns {Promise<GuildTemplate>}
    */
    editTemplate(code, options) {
        return this.#client.editGuildTemplate.call(this.#client, this.id, code, options);
    }

    /**
    * Update a user's voice state - See [caveats](https://discord.com/developers/docs/resources/guild#modify-user-voice-state-caveats)
    * @arg {Object} options The properties to edit
    * @arg {String} options.channelID The ID of the channel the user is currently in
    * @arg {Date?} [options.requestToSpeakTimestamp] Sets the user's request to speak - this can only be used when the `userID` param is "@me"
    * @arg {Boolean} [options.suppress] Toggles the user's suppress state
    * @arg {String} [userID="@me"] The user ID of the user to update
    * @returns {Promise}
    */
    editVoiceState(options, userID) {
        return this.#client.editGuildVoiceState.call(this.#client, this.id, options, userID);
    }

    /**
    * Edit the guild welcome screen
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
    editWelcomeScreen(options) {
        return this.#client.editGuildWelcomeScreen.call(this.#client, this.id, options);
    }

    /**
    * Modify a guild's widget
    * @arg {Object} options The widget object to modify (https://discord.com/developers/docs/resources/guild#modify-guild-widget)
    * @returns {Promise<Object>} A guild widget object
    */
    editWidget(options) {
        return this.#client.editGuildWidget.call(this.#client, this.id, options);
    }

    /**
    * Request specific guild members through the gateway connection
    * @arg {Object} [options] Options for fetching the members
    * @arg {Number} [options.limit] The maximum number of members to fetch
    * @arg {Boolean} [options.presences] Whether to request member presences or not. When using intents, the `GUILD_PRESENCES` intent is required.
    * @arg {String} [options.query] The query used for looking up the members. When using intents, `GUILD_MEMBERS` is required to fetch all members.
    * @arg {Number} [options.timeout] The number of milliseconds to wait before resolving early. Defaults to the `requestTimeout` client option
    * @arg {Array<String>} [options.userIDs] The IDs of members to fetch
    * @returns {Promise<Array<Member>>} Resolves with the fetched members.
    */
    fetchMembers(options) {
        return this.shard.requestGuildMembers(this.id, options);
    }

    /**
    * Get all active threads in this guild
    * @returns {Promise<Object>} An object containing an array of `threads` and an array of `members`
    */
    getActiveThreads() {
        return this.#client.getActiveGuildThreads.call(this.#client, this.id);
    }

    /**
    * Get the audit log for the guild
    * @arg {Object} [options] Options for the request.
    * @arg {Number} [options.actionType] Filter entries by action type
    * @arg {String} [options.after] Get entries after this entry ID
    * @arg {String} [options.before] Get entries before this entry ID
    * @arg {Number} [options.limit=50] The maximum number of entries to return
    * @arg {String} [options.userID] Filter entries by the user that performed the action
    * @returns {Promise<{entries: Array<GuildAuditLogEntry>, integrations: Array<PartialIntegration>, threads: Array<NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel>, users: Array<User>, webhooks: Array<Webhook>}>}
    */
    getAuditLog(options) {
        return this.#client.getGuildAuditLog.call(this.#client, this.id, options);
    }

    /**
     * Get an existing auto moderation rule
     * @arg {String} guildID The ID of the guild to get the rule from
     * @arg {String} ruleID The ID of the rule to get
     * @returns {Promise<Object>}
     */
    getAutoModerationRule(ruleID) {
        return this.#client.getAutoModerationRule.call(this.#client, this.id, ruleID);
    }

    /**
     * Get a guild's auto moderation rules
     * @arg {String} guildID The ID of the guild to get the rules of
     * @returns {Promise<Object[]>}
     */
    getAutoModerationRules() {
        return this.#client.getAutoModerationRules.call(this.#client, this.id);
    }

    /**
    * Get a ban from the ban list of a guild
    * @arg {String} userID The ID of the banned user
    * @returns {Promise<Object>} Resolves with {reason: String, user: User}
    */
    getBan(userID) {
        return this.#client.getGuildBan.call(this.#client, this.id, userID);
    }

    /**
    * Get the ban list of the guild
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Only get users after given user ID
    * @arg {String} [options.before] Only get users before given user ID
    * @arg {Number} [options.limit=1000] The maximum number of users to return
    * @returns {Promise<Array<Object>>} Resolves with an array of { reason: String, user: User }
    */
    getBans(options) {
        return this.#client.getGuildBans.call(this.#client, this.id, options);
    }

    /**
    * Get a guild application command
    * @arg {String} commandID The command id
    * @arg {Boolean} withLocalizations Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<Object>} Resolves with a command object
    */
    getCommand(commandID, withLocalizations) {
        return this.#client.getGuildCommand.call(this.#client, this.id, commandID, withLocalizations);
    }

    /**
    * Get the a guild's application command permissions
    * @arg {String} commandID The command id
    * @returns {Promise<Object>} Resolves with a guild application command permissions object.
    */
    getCommandPermissions(commandID) {
        return this.#client.getCommandPermissions.call(this.#client, this.id, commandID);
    }

    /**
    * Get the guild's application commands
    * @arg {Boolean} withLocalizations Include [localizations](https://discord.com/developers/docs/interactions/application-commands#retrieving-localized-commands) in the response
    * @returns {Promise<Array<Object>>} Resolves with an array of command objects
    */
    getCommands(withLocalizations) {
        return this.#client.getGuildCommands.call(this.#client, this.id, withLocalizations);
    }

    /**
    * Get the all of a guild's application command permissions
    * @returns {Promise<Array<Object>>} Resolves with an array of guild application command permissions objects.
    */
    getGuildCommandPermissions() {
        return this.#client.getGuildCommandPermissions.call(this.#client, this.id);
    }

    /**
    * Get a list of integrations for the guild
    * @returns {Promise<Array<GuildIntegration>>}
    */
    getIntegrations() {
        return this.#client.getGuildIntegrations.call(this.#client, this.id);
    }

    /**
    * Get all invites in the guild
    * @returns {Promise<Array<Invite>>}
    */
    getInvites() {
        return this.#client.getGuildInvites.call(this.#client, this.id);
    }

    /**
     * Get the onboarding flow of the guild, shown to new members
     * @returns {Promise<Object>} Resolves with the [guild onboarding object](https://discord.com/developers/docs/resources/guild#guild-onboarding-object)
     */
    getOnboarding() {
        return this.#client.getGuildOnboarding.call(this.#client, this.id);
    }

    /**
    * Get the prune count for the guild
    * @arg {Number} [options] The options to use to get number of prune members
    * @arg {Number} [options.days=7] The number of days of inactivity to prune for
    * @arg {Array<String>} [options.includeRoles] An array of role IDs that members must have to be considered for pruning
    * @returns {Promise<Number>} Resolves with the number of members that would be pruned
    */
    getPruneCount(options) {
        return this.#client.getPruneCount.call(this.#client, this.id, options);
    }

    /**
    * Get a guild's channels via the REST API. REST mode is required to use this endpoint.
    * @returns {Promise<Array<CategoryChannel | TextChannel | TextVoiceChannel | NewsChannel | StageChannel>>}
    */
    getRESTChannels() {
        return this.#client.getRESTGuildChannels.call(this.#client, this.id);
    }

    /**
    * Get a guild emoji via the REST API. REST mode is required to use this endpoint.
    * @arg {String} emojiID The ID of the emoji
    * @returns {Promise<Object>} An emoji object
    */
    getRESTEmoji(emojiID) {
        return this.#client.getRESTGuildEmoji.call(this.#client, this.id, emojiID);
    }

    /**
    * Get a guild's emojis via the REST API. REST mode is required to use this endpoint.
    * @returns {Promise<Array<Object>>} An array of guild emoji objects
    */
    getRESTEmojis() {
        return this.#client.getRESTGuildEmojis.call(this.#client, this.id);
    }

    /**
    * Get a guild's members via the REST API. REST mode is required to use this endpoint.
    * @arg {String} memberID The ID of the member
    * @returns {Promise<Member>}
    */
    getRESTMember(memberID) {
        return this.#client.getRESTGuildMember.call(this.#client, this.id, memberID);
    }

    /**
    * Get a guild's members via the REST API. REST mode is required to use this endpoint.
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] The highest user ID of the previous page
    * @arg {Number} [options.limit=1] The max number of members to get (1 to 1000)
    * @returns {Promise<Array<Member>>}
    */
    getRESTMembers(options) {
        return this.#client.getRESTGuildMembers.call(this.#client, this.id, options);
    }

    /**
    * Get a guild's roles via the REST API. REST mode is required to use this endpoint.
    * @returns {Promise<Array<Role>>}
    */
    getRESTRoles() {
        return this.#client.getRESTGuildRoles.call(this.#client, this.id);
    }

    /**
    * Get a guild scheduled event via the REST API. REST mode is required to use this endpoint.
    * @arg {String} eventID The ID of the guild scheduled event
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to the event
    * @returns {Promise<GuildScheduledEvent>}
    */
    getRESTScheduledEvent(eventID, options) {
        return this.#client.getRESTGuildScheduledEvent.call(this.#client, this.id, eventID, options);
    }

    /**
    * Get a guild sticker via the REST API. REST mode is required to use this endpoint.
    * @arg {String} stickerID The ID of the sticker
    * @returns {Promise<Object>} A sticker object
    */
    getRESTSticker(stickerID) {
        return this.#client.getRESTGuildSticker.call(this.#client, this.id, stickerID);
    }

    /**
    * Get a guild's stickers via the REST API. REST mode is required to use this endpoint.
    * @returns {Promise<Array<Object>>} An array of guild sticker objects
    */
    getRESTStickers() {
        return this.#client.getRESTGuildStickers.call(this.#client, this.id);
    }

    /**
    * Get the guild's scheduled events
    * @arg {Object} [options] Options for the request
    * @arg {Boolean} [options.withUserCount] Whether to include the number of users subscribed to each event
    * @returns {Promise<Array<GuildScheduledEvent>>}
    */
    getScheduledEvents(options) {
        return this.#client.getGuildScheduledEvents.call(this.#client, this.id, options);
    }

    /**
    * Get a list of users subscribed to a guild scheduled event
    * @arg {String} eventID The ID of the event
    * @arg {Object} [options] Options for the request
    * @arg {String} [options.after] Get users after this user ID. If `options.before` is provided, this will be ignored. Fetching users in between `before` and `after` is not supported
    * @arg {String} [options.before] Get users before this user ID
    * @arg {Number} [options.limit=100] The number of users to get (max 100). Pagination will only work if one of `options.after` or `options.after` is also provided
    * @arg {Boolean} [options.withMember] Include guild member data
    * @returns {Promise<Array<{guildScheduledEventID: String, member: Member | undefined, user: User}>>}
    */
    getScheduledEventUsers(eventID, options) {
        return this.#client.getGuildScheduledEventUsers.call(this.#client, this.id, eventID, options);
    }

    /**
    * Get the guild's templates
    * @returns {Promise<Array<GuildTemplate>>}
    */
    getTemplates() {
        return this.#client.getGuildTemplates.call(this.#client, this.id);
    }

    /**
    * Returns the vanity url of the guild
    * @returns {Promise}
    */
    getVanity() {
        return this.#client.getGuildVanity.call(this.#client, this.id);
    }

    /**
    * Get possible voice regions for a guild
    * @returns {Promise<Array<Object>>} Resolves with an array of voice region objects
    */
    getVoiceRegions() {
        return this.#client.getVoiceRegions.call(this.#client, this.id);
    }

    /**
    * Get all the webhooks in the guild
    * @returns {Promise<Array<Object>>} Resolves with an array of webhook objects
    */
    getWebhooks() {
        return this.#client.getGuildWebhooks.call(this.#client, this.id);
    }

    /**
    * Get the welcome screen of the Community guild, shown to new members
    * @returns {Promise<Object>}
    */
    getWelcomeScreen() {
        return this.#client.getGuildWelcomeScreen.call(this.#client, this.id);
    }

    /**
    * Get a guild's widget object
    * @returns {Promise<Object>} A guild widget object
    */
    getWidget() {
        return this.#client.getGuildWidget.call(this.#client, this.id);
    }

    /**
    * Get a guild's widget settings object
    * @returns {Promise<Object>} A guild widget settings object
    */
    getWidgetSettings() {
        return this.#client.getGuildWidgetSettings.call(this.#client, this.id);
    }

    /**
    * Kick a member from the guild
    * @arg {String} userID The ID of the member
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    kickMember(userID, reason) {
        return this.#client.kickGuildMember.call(this.#client, this.id, userID, reason);
    }

    /**
    * Leave the guild
    * @returns {Promise}
    */
    leave() {
        return this.#client.leaveGuild.call(this.#client, this.id);
    }

    /**
    * Leaves the voice channel in this guild
    */
    leaveVoiceChannel() {
        this.#client.closeVoiceConnection.call(this.#client, this.id);
    }

    /**
    * Get the guild permissions of a member
    * @arg {String | Member | Object} memberID The ID of the member or a Member object
    * @returns {Permission}
    */
    permissionsOf(memberID) {
        const member = typeof memberID === "string" ? this.members.get(memberID) : memberID;
        if(member.id === this.ownerID) {
            return new Permission(Permissions.all);
        } else {
            let permissions = this.roles.get(this.id).permissions.allow;
            if(permissions & Permissions.administrator) {
                return new Permission(Permissions.all);
            }
            for(let role of member.roles) {
                role = this.roles.get(role);
                if(!role) {
                    continue;
                }

                const {allow: perm} = role.permissions;
                if(perm & Permissions.administrator) {
                    permissions = Permissions.all;
                    break;
                } else {
                    permissions |= perm;
                }
            }
            return new Permission(permissions);
        }
    }

    /**
    * Begin pruning the guild
    * @arg {Number} [options] The options to pass to prune members
    * @arg {Boolean} [options.computePruneCount=true] Whether or not the number of pruned members should be returned. Discord discourages setting this to true for larger guilds
    * @arg {Number} [options.days=7] The number of days of inactivity to prune for
    * @arg {Array<String>} [options.includeRoles] An array of role IDs that members must have to be considered for pruning
    * @arg {String} [options.reason] The reason to be displayed in audit logs
    * @returns {Promise<Number>} Resolves with the number of pruned members
    */
    pruneMembers(options) {
        return this.#client.pruneMembers.call(this.#client, this.id, options);
    }

    /**
    * Remove a role from a guild member
    * @arg {String} memberID The ID of the member
    * @arg {String} roleID The ID of the role
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    removeMemberRole(memberID, roleID, reason) {
        return this.#client.removeGuildMemberRole.call(this.#client, this.id, memberID, roleID, reason);
    }

    /**
    * Search for guild members by partial nickname/username
    * @arg {String} query The query string to match username(s) and nickname(s) against
    * @arg {Number} [limit=1] The maximum number of members you want returned, capped at 100
    * @returns {Promise<Array<Member>>}
    */
    searchMembers(query, limit) {
        return this.#client.searchGuildMembers.call(this.#client, this.id, query, limit);
    }

    /**
    * Force a guild template to sync
    * @arg {String} code The template code
    * @returns {Promise<GuildTemplate>}
    */
    syncTemplate(code) {
        return this.#client.syncGuildTemplate.call(this.#client, this.id, code);
    }

    /**
    * Unban a user from the guild
    * @arg {String} userID The ID of the member
    * @arg {String} [reason] The reason to be displayed in audit logs
    * @returns {Promise}
    */
    unbanMember(userID, reason) {
        return this.#client.unbanGuildMember.call(this.#client, this.id, userID, reason);
    }

    toJSON(props = []) {
        return super.toJSON([
            "afkChannelID",
            "afkTimeout",
            "applicationID",
            "approximateMemberCount",
            "approximatePresenceCount",
            "banner",
            "channels",
            "defaultNotifications",
            "description",
            "discoverySplash",
            "emojis",
            "explicitContentFilter",
            "features",
            "icon",
            "joinedAt",
            "large",
            "maxMembers",
            "maxPresences",
            "maxStageVideoChannelUsers",
            "maxVideoChannelUsers",
            "memberCount",
            "members",
            "mfaLevel",
            "name",
            "ownerID",
            "preferredLocale",
            "premiumProgressBarEnabled",
            "premiumSubscriptionCount",
            "premiumTier",
            "publicUpdatesChannelID",
            "roles",
            "rulesChannelID",
            "safetyAlertsChannelID",
            "splash",
            "stickers",
            "systemChannelFlags",
            "systemChannelID",
            "unavailable",
            "vanityURL",
            "verificationLevel",
            "voiceStates",
            "welcomeScreen",
            "widgetChannelID",
            "widgetEnabled",
            ...props
        ]);
    }
}

module.exports = Guild;

/**
 * The welcome screen of a Community guild, shown to new members
 * @typedef Guild.WelcomeScreen
 * @prop {String?} description The description in the welcome screen
 * @prop {Array<Object>} welcomeChannels The list of channels in the welcome screens. Each channels have the following properties: `channelID`, `description`, `emojiID`, `emojiName`. `emojiID` and `emojiName` properties can be null.
 */
