import { EventEmitter } from "events";
import { Duplex, Readable as ReadableStream, Stream } from "stream";
import { Agent as HTTPSAgent } from "https";
import { IncomingMessage, ClientRequest, IncomingHttpHeaders } from "http";
import OpusScript = require("opusscript"); // Thanks TypeScript
import { URL } from "url";
import { Socket as DgramSocket } from "dgram";
import * as WebSocket from "ws";

declare namespace Dysnomia {
  export const Constants: Constants;
  export const VERSION: string;

  // TYPES

  // Application Command
  type AnyApplicationCommand<W extends boolean = false> = ChatInputApplicationCommand<W> | MessageApplicationCommand<W> | UserApplicationCommand<W> | PrimaryEntryPointApplicationCommand<W>;
  type ApplicationCommandEntryPointHandlerTypes = Constants["ApplicationCommandEntryPointHandlerTypes"][keyof Constants["ApplicationCommandEntryPointHandlerTypes"]];
  type ApplicationCommandOptions = ApplicationCommandOptionsWithOptions | ApplicationCommandOptionsWithValue;
  type ApplicationCommandOptionsTypes = Constants["ApplicationCommandOptionTypes"][keyof Constants["ApplicationCommandOptionTypes"]];
  type ApplicationCommandOptionsTypesWithAutocomplete = Constants["ApplicationCommandOptionTypes"][keyof Pick<Constants["ApplicationCommandOptionTypes"], "STRING" | "INTEGER" | "NUMBER">];
  type ApplicationCommandOptionsTypesWithChoices = Constants["ApplicationCommandOptionTypes"][keyof Pick<Constants["ApplicationCommandOptionTypes"], "STRING" | "INTEGER" | "NUMBER">];
  type ApplicationCommandOption<T extends keyof Constants["ApplicationCommandOptionTypes"]> = ApplicationCommandOptionBase<Constants["ApplicationCommandOptionTypes"][T]>;
  type ApplicationCommandOptionAutocomplete<T extends "INTEGER" | "NUMBER" | "STRING"> = (ApplicationCommandOption<T> & ApplicationCommandOptionsAutocomplete);
  type ApplicationCommandOptionChannelTypes<T extends "CHANNEL"> = (ApplicationCommandOption<T> & ApplicationCommandOptionsChannelTypes);
  type ApplicationCommandOptionChoices<T extends "INTEGER" | "NUMBER" | "STRING"> = (ApplicationCommandOption<T> & ApplicationCommandOptionsChoices<Constants["ApplicationCommandOptionTypes"][T]>);
  type ApplicationCommandOptionMinMaxValue<T extends "INTEGER" | "NUMBER"> = (ApplicationCommandOption<T> & ApplicationCommandOptionsMinMaxValue);
  type ApplicationCommandOptionMinMaxLength<T extends "STRING"> = (ApplicationCommandOption<T> & ApplicationCommandOptionsMinMaxLength);

  type ApplicationCommandOptionsAttachment = ApplicationCommandOption<"ATTACHMENT">;
  type ApplicationCommandOptionsBoolean = ApplicationCommandOption<"BOOLEAN">;
  type ApplicationCommandOptionsChannel = ApplicationCommandOptionChannelTypes<"CHANNEL">;
  type ApplicationCommandOptionsInteger = ApplicationCommandOptionAutocomplete<"INTEGER"> | ApplicationCommandOptionChoices<"INTEGER"> | ApplicationCommandOptionMinMaxValue<"INTEGER">;
  type ApplicationCommandOptionsMentionable = ApplicationCommandOption<"MENTIONABLE">;
  type ApplicationCommandOptionsNumber = ApplicationCommandOptionAutocomplete<"NUMBER"> | ApplicationCommandOptionChoices<"NUMBER"> | ApplicationCommandOptionMinMaxValue<"NUMBER">;
  type ApplicationCommandOptionsRole = ApplicationCommandOption<"ROLE">;
  type ApplicationCommandOptionsString = ApplicationCommandOptionAutocomplete<"STRING"> | ApplicationCommandOptionChoices<"STRING"> | ApplicationCommandOptionMinMaxLength<"STRING">;
  type ApplicationCommandOptionsUser = ApplicationCommandOption<"USER">;

  type ApplicationCommandOptionsWithOptions = ApplicationCommandOptionsSubCommand | ApplicationCommandOptionsSubCommandGroup;
  type ApplicationCommandOptionsWithValue = ApplicationCommandOptionsString | ApplicationCommandOptionsInteger | ApplicationCommandOptionsBoolean | ApplicationCommandOptionsUser | ApplicationCommandOptionsChannel | ApplicationCommandOptionsRole | ApplicationCommandOptionsMentionable | ApplicationCommandOptionsNumber | ApplicationCommandOptionsAttachment;
  type ApplicationCommandStructure = ChatInputApplicationCommandStructure | MessageApplicationCommandStructure | UserApplicationCommandStructure | PrimaryEntryPointApplicationCommandStructure;
  type ApplicationCommandStructureConversion<T extends ApplicationCommandStructure, W extends boolean = false> = T extends ChatInputApplicationCommandStructure ?
    ChatInputApplicationCommand<W> : T extends MessageApplicationCommandStructure ?
      MessageApplicationCommand<W> : T extends UserApplicationCommandStructure ?
        UserApplicationCommand<W> : T extends PrimaryEntryPointApplicationCommandStructure ?
          PrimaryEntryPointApplicationCommand<W> : never;
  type ApplicationCommandTypes = Constants["ApplicationCommandTypes"][keyof Constants["ApplicationCommandTypes"]];
  type ApplicationRoleConnectionMetadataTypes = Constants["RoleConnectionMetadataTypes"][keyof Constants["RoleConnectionMetadataTypes"]];
  type ChatInputApplicationCommand<W extends boolean = false> = ApplicationCommand<"CHAT_INPUT", W>;
  type MessageApplicationCommand<W extends boolean = false> = ApplicationCommand<"MESSAGE", W>;
  type MessageApplicationCommandStructure = ApplicationCommandStructureBase<"MESSAGE">;
  type ModalSubmitInteractionDataComponent = ModalSubmitInteractionDataTextInputComponent;
  type PrimaryEntryPointApplicationCommand<W extends boolean = false> = ApplicationCommand<"PRIMARY_ENTRY_POINT", W>;
  type UserApplicationCommand<W extends boolean = false> = ApplicationCommand<"USER", W>;
  type UserApplicationCommandStructure = ApplicationCommandStructureBase<"USER">;

  // Auto Moderation
  type AutoModerationActionType = Constants["AutoModerationActionTypes"][keyof Constants["AutoModerationActionTypes"]];
  type AutoModerationEventType = Constants["AutoModerationEventTypes"][keyof Constants["AutoModerationEventTypes"]];
  type AutoModerationKeywordPresetType = Constants["AutoModerationKeywordPresetTypes"][keyof Constants["AutoModerationKeywordPresetTypes"]];
  type AutoModerationTriggerType = Constants["AutoModerationTriggerTypes"][keyof Constants["AutoModerationTriggerTypes"]];
  type EditAutoModerationRuleOptions = Partial<Omit<CreateAutoModerationRuleOptions, "triggerType">>;

  // Cache
  interface Uncached { id: string }

  // Channel
  type AnyChannel = AnyGuildChannel | GroupChannel | PrivateChannel;
  type AnyGuildChannel = GuildTextableChannel | AnyVoiceChannel | CategoryChannel;
  type AnyThreadChannel = NewsThreadChannel | PrivateThreadChannel | PublicThreadChannel | ThreadChannel;
  type AnyVoiceChannel = TextVoiceChannel | StageChannel;
  type GuildTextableChannel = TextChannel | TextVoiceChannel | NewsChannel | StageChannel;
  type GuildTextableWithThreads = GuildTextableChannel | AnyThreadChannel;
  type InviteChannel = InvitePartialChannel | Exclude<AnyGuildChannel, CategoryChannel | AnyThreadChannel>;
  type PossiblyUncachedInteractionChannel = TextableChannel | PartialChannel;
  type PossiblyUncachedSpeakableChannel = VoiceChannel | StageChannel | Uncached;
  type PossiblyUncachedTextable = Textable | Uncached;
  type PossiblyUncachedTextableChannel = TextableChannel | Uncached;
  type TextableChannel = (GuildTextable & GuildTextableChannel) | (ThreadTextable & AnyThreadChannel) | (Textable & (PrivateChannel | GroupChannel));
  type VideoQualityMode = Constants["VideoQualityModes"][keyof Constants["VideoQualityModes"]];
  type ChannelTypes = GuildChannelTypes | PrivateChannelTypes;
  type GuildChannelTypes = Exclude<Constants["ChannelTypes"][keyof Constants["ChannelTypes"]], PrivateChannelTypes>;
  type TextChannelTypes = GuildTextChannelTypes | PrivateChannelTypes;
  type GuildTextChannelTypes = Constants["ChannelTypes"][keyof Pick<Constants["ChannelTypes"], "GUILD_TEXT" | "GUILD_ANNOUNCEMENT">];
  type GuildThreadChannelTypes = Constants["ChannelTypes"][keyof Pick<Constants["ChannelTypes"], "ANNOUNCEMENT_THREAD" | "PRIVATE_THREAD" | "PUBLIC_THREAD">];
  type GuildThreadOnlyChannelTypes = Constants["ChannelTypes"][keyof Pick<Constants["ChannelTypes"], "GUILD_FORUM" | "GUILD_MEDIA">];
  type GuildPublicThreadChannelTypes = Exclude<GuildThreadChannelTypes, Constants["ChannelTypes"]["PRIVATE_THREAD"]>;
  type GuildVoiceChannelTypes = Constants["ChannelTypes"][keyof Pick<Constants["ChannelTypes"], "GUILD_VOICE" | "GUILD_STAGE_VOICE">];
  type PrivateChannelTypes = Constants["ChannelTypes"][keyof Pick<Constants["ChannelTypes"], "DM" | "GROUP_DM">];
  type TextVoiceChannelTypes = Constants["ChannelTypes"][keyof Pick<Constants["ChannelTypes"], "GUILD_VOICE" | "GUILD_STAGE_VOICE">];
  type ThreadSortingOrders = Constants["ThreadSortingOrders"][keyof Constants["ThreadSortingOrders"]];
  type ForumLayoutTypes = Constants["ForumLayoutTypes"][keyof Constants["ForumLayoutTypes"]];

  // Client
  type MembershipStates = Constants["MembershipState"][keyof Constants["MembershipState"]];

  // Gateway/REST
  type IntentStrings = keyof Constants["Intents"];
  type ReconnectDelayFunction = (lastDelay: number, attempts: number) => number;
  type RequestMethod = "GET" | "PATCH" | "DELETE" | "POST" | "PUT";

  // Guild
  type DefaultNotifications = Constants["DefaultMessageNotificationLevels"][keyof Constants["DefaultMessageNotificationLevels"]];
  type ExplicitContentFilter = Constants["ExplicitContentFilterLevels"][keyof Constants["ExplicitContentFilterLevels"]];
  type GuildFeatures = Constants["GuildFeatures"][number];
  type GuildScheduledEventEditOptions<T extends GuildScheduledEventEntityTypes> = GuildScheduledEventEditOptionsExternal | GuildScheduledEventEditOptionsDiscord | GuildScheduledEventEditOptionsBase<T>;
  type GuildScheduledEventOptions<T extends GuildScheduledEventEntityTypes> = GuildScheduledEventOptionsExternal | GuildScheduledEventOptionsDiscord | GuildScheduledEventOptionsBase<T>;
  type GuildScheduledEventEntityTypes = Constants["GuildScheduledEventEntityTypes"][keyof Constants["GuildScheduledEventEntityTypes"]];
  type GuildScheduledEventPrivacyLevel = Constants["GuildScheduledEventPrivacyLevel"][keyof Constants["GuildScheduledEventPrivacyLevel"]];
  type GuildScheduledEventStatus = Constants["GuildScheduledEventStatus"][keyof Constants["GuildScheduledEventStatus"]];
  type NSFWLevel = Constants["GuildNSFWLevels"][keyof Constants["GuildNSFWLevels"]];
  type OnboardingModes = Constants["OnboardingModes"][keyof Constants["OnboardingModes"]];
  type OnboardingPromptTypes = Constants["OnboardingPromptTypes"][keyof Constants["OnboardingPromptTypes"]];
  type PossiblyUncachedInteractionGuild = Guild | InteractionGuild;
  type PossiblyUncachedGuild = Guild | Uncached;
  type PossiblyUncachedGuildScheduledEvent = GuildScheduledEvent | Uncached;
  type PossiblyUncachedGuildSoundboardSound = SoundboardSound | { id: string; guild: PossiblyUncachedGuild };
  type PremiumTier = Constants["PremiumTiers"][keyof Constants["PremiumTiers"]];
  type VerificationLevel = Constants["VerificationLevels"][keyof Constants["VerificationLevels"]];
  type SystemChannelFlags = Constants["SystemChannelFlags"][keyof Constants["SystemChannelFlags"]];
  type GuildIntegrationTypes = Constants["GuildIntegrationTypes"][number];
  type GuildIntegrationExpireBehavior = Constants["GuildIntegrationExpireBehavior"][keyof Constants["GuildIntegrationExpireBehavior"]];

  // Interaction
  type AnyInteraction = AnyInteractionGateway | PingInteraction;
  type AnyInteractionGateway = AutocompleteInteraction | CommandInteraction | ComponentInteraction | ModalSubmitInteraction;
  type ApplicationIntegrationTypes = Constants["ApplicationIntegrationTypes"][keyof Constants["ApplicationIntegrationTypes"]];
  type InteractionContextTypes = Constants["InteractionContextTypes"][keyof Constants["InteractionContextTypes"]];
  type InteractionContent = Pick<WebhookPayload, "content" | "embeds" | "allowedMentions" | "tts" | "flags" | "components" | "attachments" | "poll">;
  type InteractionContentEdit = Omit<InteractionContent, "tts" | "flags">;
  type InteractionDataOption<T extends Exclude<keyof Constants["ApplicationCommandOptionTypes"], "SUB_COMMAND" | "SUB_COMMAND_GROUP">, V = boolean | number | string> = InteractionDataOptionsBase<Constants["ApplicationCommandOptionTypes"][T], V>;
  type InteractionDataOptions = InteractionDataOptionsWithOptions | InteractionDataOptionsWithValue;
  type InteractionDataOptionsBoolean = InteractionDataOption<"BOOLEAN", boolean>;
  type InteractionDataOptionsChannel = InteractionDataOption<"CHANNEL", string>;
  type InteractionDataOptionsInteger = InteractionDataOption<"INTEGER", number>;
  type InteractionDataOptionsMentionable = InteractionDataOption<"MENTIONABLE", string>;
  type InteractionDataOptionsNumber = InteractionDataOption<"NUMBER", number>;
  type InteractionDataOptionsRole = InteractionDataOption<"ROLE", string>;
  type InteractionDataOptionsString = InteractionDataOption<"STRING", string>;
  type InteractionDataOptionsUser = InteractionDataOption<"USER", string>;
  type InteractionDataOptionsWithOptions = InteractionDataOptionsSubCommand | InteractionDataOptionsSubCommandGroup;
  type InteractionDataOptionsWithValue = InteractionDataOptionsString | InteractionDataOptionsInteger | InteractionDataOptionsBoolean | InteractionDataOptionsUser | InteractionDataOptionsChannel | InteractionDataOptionsRole | InteractionDataOptionsMentionable | InteractionDataOptionsNumber;
  type InteractionResponse = InteractionResponseAutocomplete | InteractionResponseDeferred | InteractionResponseLaunchActivity | InteractionResponseMessage | InteractionResponsePong | InteractionResponsePremiumRequired;
  type InteractionResponseTypes = Constants["InteractionResponseTypes"][keyof Constants["InteractionResponseTypes"]];
  type InteractionTypes = Constants["InteractionTypes"][keyof Constants["InteractionTypes"]];

  // Invite
  type InviteTargetTypes = Constants["InviteTargetTypes"][keyof Constants["InviteTargetTypes"]];
  type InviteTypes = Constants["InviteTypes"][keyof Constants["InviteTypes"]];

  // Message
  type ActionRowComponents = Button | SelectMenu;
  type BaseSelectMenuTypes = Exclude<SelectMenuTypes, SelectMenuExtendedTypes>;
  type Button = InteractionButton | PremiumButton | URLButton;
  type ButtonStyles = Constants["ButtonStyles"][keyof Constants["ButtonStyles"]];
  type ButtonStyleNormal = Exclude<ButtonStyles, ButtonStyleLink | ButtonStylePremium>;
  type ButtonStyleLink = Constants["ButtonStyles"]["LINK"];
  type ButtonStylePremium = Constants["ButtonStyles"]["PREMIUM"];
  type Component = ActionRow | ActionRowComponents;
  type ComponentTypes = Constants["ComponentTypes"][keyof Constants["ComponentTypes"]];
  type ImageFormat = Constants["ImageFormats"][number];
  type MessageActivityTypes = Constants["MessageActivityTypes"][keyof Constants["MessageActivityTypes"]];
  type MessageContent<T extends "hasNonce" | "" = ""> = string | AdvancedMessageContent<T>;
  type MessageReferenceSend = MessageReferenceReply | MessageReferenceForward;
  type MessageReferenceTypes = Constants["MessageReferenceTypes"][keyof Constants["MessageReferenceTypes"]];
  type MFALevel = Constants["MFALevels"][keyof Constants["MFALevels"]];
  type PollLayoutTypes = Constants["PollLayoutTypes"][keyof Constants["PollLayoutTypes"]];
  type PossiblyUncachedMessage = Message | { author?: User | Uncached; channel: TextableChannel | { id: string; guild?: Uncached }; guildID?: string; id: string };
  type ReactionTypes = Constants["ReactionTypes"][keyof Constants["ReactionTypes"]];
  type SelectMenu = BaseSelectMenu | ChannelSelectMenu | StringSelectMenu | UserSelectMenu | RoleSelectMenu | MentionableSelectMenu;
  type SelectMenuTypes = Constants["ComponentTypes"][keyof Pick<Constants["ComponentTypes"], "STRING_SELECT" | "USER_SELECT" | "ROLE_SELECT" | "MENTIONABLE_SELECT" | "CHANNEL_SELECT">];
  type SelectMenuExtendedTypes = Constants["ComponentTypes"][keyof Pick<Constants["ComponentTypes"], "STRING_SELECT" | "CHANNEL_SELECT" | "ROLE_SELECT" | "USER_SELECT" | "MENTIONABLE_SELECT">];

  // Permission
  type PermissionType = Constants["PermissionOverwriteTypes"][keyof Constants["PermissionOverwriteTypes"]];

  // Presence/Relationship
  type ActivityFlags = Constants["ActivityFlags"][keyof Constants["ActivityFlags"]];
  type ActivityType = Constants["ActivityTypes"][keyof Constants["ActivityTypes"]];
  /** @deprecated This is equivalent to ActivityType, use that type instead */
  type BotActivityType = ActivityType;
  type FriendSuggestionReasons = { name: string; platform_type: string; type: number }[];
  type Status = "online" | "idle" | "dnd";
  type SelfStatus = Status | "invisible";
  type UserStatus = Status | "offline";

  // Selfbot
  type ConnectionVisibilityTypes = Constants["ConnectionVisibilityTypes"][keyof Constants["ConnectionVisibilityTypes"]];

  // Sticker
  type StickerTypes = Constants["StickerTypes"][keyof Constants["StickerTypes"]];
  type StickerFormats = Constants["StickerFormats"][keyof Constants["StickerFormats"]];

  // Thread
  type AutoArchiveDuration = 60 | 1440 | 4320 | 10080;

  // User
  type PremiumTypes = Constants["PremiumTypes"][keyof Constants["PremiumTypes"]];

  // Voice
  type ConverterCommand = "./ffmpeg" | "./avconv" | "ffmpeg" | "avconv";
  type StageInstancePrivacyLevel = Constants["StageInstancePrivacyLevel"][keyof Constants["StageInstancePrivacyLevel"]];
  type VoiceChannelEffectAnimationType = Constants["VoiceChannelEffectAnimationTypes"][keyof Constants["VoiceChannelEffectAnimationTypes"]];

  // Webhook
  type MessageWebhookContent = Pick<WebhookPayload, "content" | "embeds" | "allowedMentions" | "components" | "attachments" | "threadID">;
  type WebhookTypes = Constants["WebhookTypes"][keyof Constants["WebhookTypes"]];

  // Subscriptions
  type EntitlementOwnerTypes = Constants["EntitlementOwnerTypes"][keyof Constants["EntitlementOwnerTypes"]];
  type EntitlementTypes = Constants["EntitlementTypes"][keyof Constants["EntitlementTypes"]];
  type SKUTypes = Constants["SKUTypes"][keyof Constants["SKUTypes"]];

  // INTERFACES
  // Internals
  interface JSONCache {
    [s: string]: unknown;
  }
  interface NestedJSON {
    toJSON(arg?: unknown, cache?: (string | unknown)[]): JSONCache;
  }
  interface SimpleJSON {
    toJSON(props?: string[]): JSONCache;
  }

  // Application Command
  interface ApplicationCommandStructureBase<T extends keyof Constants["ApplicationCommandTypes"] = keyof Constants["ApplicationCommandTypes"]> {
    contexts?: InteractionContextTypes[];
    defaultMemberPermissions?: bigint | number | string | Permission;
    /** @deprecated */
    dmPermission?: boolean;
    integrationTypes?: ApplicationIntegrationTypes[];
    name: string;
    nameLocalizations?: Record<string, string>;
    nsfw?: boolean;
    type: Constants["ApplicationCommandTypes"][T];
  }
  interface ApplicationCommandOptionBase<T extends ApplicationCommandOptionsTypes> {
    description: string;
    description_localizations?: Record<string, string>;
    name: string;
    name_localizations?: Record<string, string>;
    required?: T extends Constants["ApplicationCommandOptionTypes"]["SUB_COMMAND" | "SUB_COMMAND_GROUP"] ? never : boolean;
    type: T;
  }
  interface ApplicationCommandOptionsAutocomplete {
    autocomplete?: boolean;
  }
  interface ApplicationCommandOptionsChoice<T extends ApplicationCommandOptionsTypesWithChoices = ApplicationCommandOptionsTypesWithChoices> {
    name: string;
    value:
    T extends Constants["ApplicationCommandOptionTypes"]["STRING"] ? string :
      T extends Constants["ApplicationCommandOptionTypes"]["INTEGER" | "NUMBER"] ? number :
        unknown;
  }

  interface ApplicationCommandOptionsChannelTypes {
    channel_types?: GuildChannelTypes[];
  }
  interface ApplicationCommandOptionsChoices<T extends ApplicationCommandOptionsTypesWithChoices = ApplicationCommandOptionsTypesWithChoices> { choices?: ApplicationCommandOptionsChoice<T>[] }
  interface ApplicationCommandOptionsMinMaxValue {
    max_value?: number;
    min_value?: number;
  }
  interface ApplicationCommandOptionsMinMaxLength {
    max_length?: number;
    min_length?: number;
  }
  interface ApplicationCommandOptionsSubCommand extends ApplicationCommandOptionBase<Constants["ApplicationCommandOptionTypes"]["SUB_COMMAND"]> {
    options?: ApplicationCommandOptionsWithValue[];
  }
  interface ApplicationCommandOptionsSubCommandGroup extends ApplicationCommandOptionBase<Constants["ApplicationCommandOptionTypes"]["SUB_COMMAND_GROUP"]> {
    options?: (ApplicationCommandOptionsSubCommand | ApplicationCommandOptionsWithValue)[];
  }
  interface ApplicationCommandPermissions {
    id: string;
    permission: boolean;
    type: Constants["ApplicationCommandPermissionTypes"][keyof Constants["ApplicationCommandPermissionTypes"]];
  }
  interface ApplicationRoleConnectionMetadata {
    description: string;
    descriptionLocalizations?: Record<string, string>;
    key: string;
    name: string;
    nameLocalizations?: Record<string, string>;
    type: ApplicationRoleConnectionMetadataTypes;
  }
  interface ChatInputApplicationCommandStructure extends ApplicationCommandStructureBase<"CHAT_INPUT"> {
    description: string;
    descriptionLocalizations?: Record<string, string>;
    options?: ApplicationCommandOptions[];
  }
  interface PrimaryEntryPointApplicationCommandStructure extends ApplicationCommandStructureBase<"PRIMARY_ENTRY_POINT"> {
    handler?: ApplicationCommandEntryPointHandlerTypes;
  }
  interface GuildApplicationCommandPermissions {
    application_id: string;
    guild_id: string;
    id: string;
    permissions: ApplicationCommandPermissions[];
  }

  // Auto Moderation
  interface AutoModerationAction {
    metadata?: AutoModerationActionMetadata;
    type: AutoModerationActionType;
  }
  interface AutoModerationActionExecution {
    action: AutoModerationAction;
    alertSystemMessageID?: string;
    channelID?: string;
    content?: string;
    guildID: string;
    matchedContent?: string | null;
    matchedKeyword: string | null;
    messageID?: string;
    ruleID: string;
    ruleTriggerType: AutoModerationTriggerType;
    userID: string;
  }
  interface AutoModerationActionMetadata {
    /** valid for SEND_ALERT_MESSAGE */
    channel_id?: string;
    /** valid for BLOCK_MESSAGE */
    custom_message?: string;
    /** valid for TIMEOUT */
    duration_seconds?: number;
  }
  interface CreateAutoModerationRuleOptions {
    actions: AutoModerationAction[];
    enabled?: boolean;
    eventType: AutoModerationEventType;
    exemptChannels?: string[];
    exemptRoles?: string[];
    name: string;
    reason?: string;
    triggerMetadata?: Partial<AutoModerationTriggerMetadata>;
    triggerType: AutoModerationTriggerType;
  }

  interface AutoModerationTriggerMetadata {
    /** valid for KEYWORD, KEYWORD_PRESET, MEMBER_PROFILE */
    allow_list: string[];
    /** valid for KEYWORD, MEMBER_PROFILE */
    keyword_filter: string[];
    /** valid for MENTION_SPAM */
    mention_total_limit: number;
    /** valid for MENTION_SPAM */
    mention_raid_protection_enabled: boolean;
    /** valid for KEYWORD_PRESET */
    presets: AutoModerationKeywordPresetType[];
    /** valid for KEYWORD, MEMBER_PROFILE */
    regex_patterns: string[];
  }
  // Channel
  interface ChannelFollow {
    channel_id: string;
    webhook_id: string;
  }
  interface ChannelPosition {
    id: string;
    position?: number;
    lockPermissions?: boolean;
    parentID?: string;
  }
  interface CreateChannelOptions {
    availableTags?: (Required<Pick<ForumTag, "name">> & Partial<ForumTag>)[];
    bitrate?: number;
    defaultAutoArchiveDuration?: AutoArchiveDuration;
    defaultForumLayout?: ForumLayoutTypes;
    defaultReactionEmoji?: ForumDefaultReactionEmoji | null;
    defaultSortOrder?: ThreadSortingOrders | null;
    defaultThreadRateLimitPerUser?: number | null;
    nsfw?: boolean;
    parentID?: string;
    permissionOverwrites?: Overwrite[];
    position?: number;
    rateLimitPerUser?: number;
    reason?: string;
    rtcRegion?: string | null;
    topic?: string;
    userLimit?: number;
    videoQualityMode?: VideoQualityMode;
  }
  interface EditChannelOptions extends Omit<CreateChannelOptions, "reason"> {
    archived?: boolean;
    appliedTags?: string[];
    autoArchiveDuration?: AutoArchiveDuration;
    flags?: number;
    invitable?: boolean;
    locked?: boolean;
    name?: string;
  }
  interface EditChannelPositionOptions {
    lockPermissions?: string;
    parentID?: string;
  }
  interface ForumTag {
    id: string;
    name: string;
    moderated: boolean;
    emojiID?: string | null;
    emojiName?: string | null;
  }

  interface ForumDefaultReactionEmoji {
    emojiID?: string | null;
    emojiName?: string | null;
  }
  interface GetMessagesOptions {
    after?: string;
    around?: string;
    before?: string;
    limit?: number;
  }
  interface GetThreadMemberOptions {
    withMember?: boolean;
  }
  interface GetThreadMembersOptions {
    after?: string;
    limit?: number;
    withMember?: boolean;
  }
  interface GuildPinnable extends Pinnable {
    lastPinTimestamp: number | null;
    topic?: string | null;
  }
  interface GuildTextable extends Textable {
    rateLimitPerUser: number;
    createWebhook(options: { name: string; avatar?: string | null }, reason?: string): Promise<Webhook>;
    deleteMessages(messageIDs: string[], reason?: string): Promise<void>;
    getWebhooks(): Promise<Webhook[]>;
    purge(options: PurgeChannelOptions): Promise<number>;
    removeMessageReactionEmoji(messageID: string, reaction: string): Promise<void>;
    removeMessageReactions(messageID: string): Promise<void>;
  }
  interface PartialChannel {
    bitrate?: number;
    id: string;
    name?: string;
    nsfw?: boolean;
    parent_id?: number;
    permission_overwrites?: Overwrite[];
    rate_limit_per_user?: number;
    topic?: string | null;
    type: number;
    user_limit?: number;
  }
  interface Pinnable {
    getPins(): Promise<Message[]>;
    pinMessage(messageID: string): Promise<void>;
    unpinMessage(messageID: string): Promise<void>;
  }
  interface PurgeChannelOptions {
    after?: string;
    before?: string;
    filter?: (m: Message<GuildTextableChannel>) => boolean;
    limit: number;
    reason?: string;
  }
  interface Textable {
    lastMessageID: string;
    messages: Collection<Message<this>>;
    addMessageReaction(messageID: string, reaction: string): Promise<void>;
    createMessage(content: MessageContent<"hasNonce">): Promise<Message<this>>;
    deleteMessage(messageID: string, reason?: string): Promise<void>;
    editMessage(messageID: string, content: MessageContent): Promise<Message<this>>;
    getMessage(messageID: string): Promise<Message<this>>;
    getMessageReaction(messageID: string, reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    getMessages(options?: GetMessagesOptions): Promise<Message<this>[]>;
    removeMessageReaction(messageID: string, reaction: string, userID?: string): Promise<void>;
    sendTyping(): Promise<void>;
    unsendMessage(messageID: string): Promise<void>;
  }
  interface ThreadTextable extends Textable, Pinnable {
    lastPinTimestamp?: number;
    deleteMessages(messageIDs: string[], reason?: string): Promise<void>;
    getMember(options: GetThreadMemberOptions): Promise<ThreadMember>;
    getMembers(options: GetThreadMembersOptions): Promise<ThreadMember[]>;
    join(userID: string): Promise<void>;
    leave(userID: string): Promise<void>;
    purge(options: PurgeChannelOptions): Promise<number>;
    removeMessageReactionEmoji(messageID: string, reaction: string): Promise<void>;
    removeMessageReactions(messageID: string): Promise<void>;
  }
  interface WebhookData {
    channelID: string;
    guildID: string;
  }

  // Client
  interface ClientOptions {
    allowedMentions?: AllowedMentions;
    defaultImageFormat?: string;
    defaultImageSize?: number;
    gateway?: GatewayOptions;
    messageLimit?: number;
    opusOnly?: boolean;
    requestTimeout?: number;
    rest?: RequestHandlerOptions;
    restMode?: boolean;
    ws?: unknown;
  }
  interface RequestHandlerOptions {
    agent?: HTTPSAgent;
    baseURL?: string;
    disableLatencyCompensation?: boolean;
    domain?: string;
    headers?: Record<string, number | string | string[]>;
    https?: boolean;
    latencyThreshold?: number;
    port?: number;
    ratelimiterOffset?: number;
    requestTimeout?: number;
  }

  interface EditSelfOptions {
    avatar?: string | null;
    banner?: string | null;
    username?: string;
  }

  // Embed
  // Omit<T, K> used to override
  interface Embed extends Omit<EmbedOptions, "footer" | "image" | "thumbnail" | "author"> {
    author?: EmbedAuthor;
    footer?: EmbedFooter;
    image?: EmbedImage;
    provider?: EmbedProvider;
    thumbnail?: EmbedImage;
    type: string;
    video?: EmbedVideo;
  }
  interface EmbedAuthor extends EmbedAuthorOptions {
    proxy_icon_url?: string;
  }
  interface EmbedAuthorOptions {
    icon_url?: string;
    name: string;
    url?: string;
  }
  interface EmbedField {
    inline?: boolean;
    name: string;
    value: string;
  }
  interface EmbedFooter extends EmbedFooterOptions {
    proxy_icon_url?: string;
  }
  interface EmbedFooterOptions {
    icon_url?: string;
    text: string;
  }
  interface EmbedImage extends EmbedImageOptions {
    height?: number;
    proxy_url?: string;
    width?: number;
  }
  interface EmbedImageOptions {
    url?: string;
  }
  interface EmbedOptions {
    author?: EmbedAuthorOptions;
    color?: number;
    description?: string;
    fields?: EmbedField[];
    footer?: EmbedFooterOptions;
    image?: EmbedImageOptions;
    thumbnail?: EmbedImageOptions;
    timestamp?: Date | string;
    title?: string;
    url?: string;
  }
  interface EmbedProvider {
    name?: string;
    url?: string;
  }
  interface EmbedVideo {
    height?: number;
    proxy_url?: string;
    url?: string;
    width?: number;
  }

  // Emoji
  interface Emoji extends EmojiBase {
    animated: boolean;
    available: boolean;
    id: string;
    managed: boolean;
    require_colons: boolean;
    roles: string[];
    user?: PartialUser;
  }
  interface EmojiBase {
    icon?: string;
    name: string;
  }
  interface EmojiOptions extends Exclude<EmojiBase, "icon"> {
    image: string;
    roles?: string[];
  }
  interface PartialEmoji {
    id?: string;
    name: string;
    animated?: boolean;
  }

  // Events
  interface OldGuild {
    afkChannelID: string | null;
    afkTimeout: number;
    banner: string | null;
    defaultNotifications: DefaultNotifications;
    description: string | null;
    discoverySplash: string | null;
    emojis: Omit<Emoji, "user" | "icon">[];
    explicitContentFilter: ExplicitContentFilter;
    features: GuildFeatures[];
    icon: string | null;
    large: boolean;
    maxMembers?: number;
    maxStageVideoChannelUsers?: number;
    maxVideoChannelUsers?: number;
    mfaLevel: MFALevel;
    name: string;
    nsfwLevel: NSFWLevel;
    ownerID: string;
    preferredLocale?: string;
    premiumProgressBarEnabled: boolean;
    premiumSubscriptionCount?: number;
    premiumTier: PremiumTier;
    publicUpdatesChannelID: string | null;
    rulesChannelID: string | null;
    safetyAlertsChannelID: string | null;
    splash: string | null;
    stickers?: Sticker[];
    systemChannelFlags: SystemChannelFlags;
    systemChannelID: string | null;
    vanityURL: string | null;
    verificationLevel: VerificationLevel;
    welcomeScreen?: WelcomeScreen;
  }
  interface OldGuildChannel {
    availableTags?: ForumTag[];
    bitrate?: number;
    defaultAutoArchiveDuration?: AutoArchiveDuration;
    defaultForumLayout?: ForumLayoutTypes;
    defaultReactionEmoji?: ForumDefaultReactionEmoji;
    defaultSortOrder?: ThreadSortingOrders;
    defaultThreadRateLimitPerUser?: number;
    flags?: number;
    name: string;
    nsfw?: boolean;
    parentID: string | null;
    permissionOverwrites: Collection<PermissionOverwrite>;
    position: number;
    rateLimitPerUser?: number;
    rtcRegion?: string | null;
    topic?: string | null;
    type: GuildChannelTypes;
  }
  interface OldGuildScheduledEvent {
    channel: PossiblyUncachedSpeakableChannel | null;
    description?: string | null;
    entityID: string | null;
    enitityMetadata: GuildScheduledEventMetadata | null;
    entityType: GuildScheduledEventEntityTypes;
    image?: string;
    name: string;
    privacyLevel: GuildScheduledEventPrivacyLevel;
    scheduledEndTime: number | null;
    scheduledStartTime: number;
    status: GuildScheduledEventStatus;
  }
  interface OldGuildSoundboardSound {
    available: boolean;
    emojiID: string | null;
    emojiName: string | null;
    name: string;
    volume: number;
  }
  interface OldGuildTextChannel extends OldGuildChannel {
    nsfw: boolean;
    rateLimitPerUser: number;
    topic?: string | null;
    type: GuildTextChannelTypes;
  }
  interface OldMember {
    avatar: string | null;
    communicationDisabledUntil: number | null;
    flags: number;
    nick: string | null;
    pending?: boolean;
    premiumSince?: number | null;
    roles: string[];
  }
  interface OldMessage {
    attachments: Attachment[];
    channelMentions: string[];
    components?: Component[];
    content: string;
    editedTimestamp?: number;
    embeds: Embed[];
    flags: number;
    mentions: User[];
    pinned: boolean;
    roleMentions: string[];
    tts: boolean;
  }
  interface OldRole {
    color: number;
    flags: number;
    hoist: boolean;
    icon: string | null;
    managed: boolean;
    mentionable: boolean;
    name: string;
    permissions: Permission;
    position: number;
    unicodeEmoji: string | null;
  }
  interface OldStageInstance {
    discoverableDisabled: boolean;
    privacyLevel: StageInstancePrivacyLevel;
    topic: string;
  }
  interface OldVoiceChannel extends OldGuildChannel {
    bitrate: number;
    rtcRegion: string | null;
    type: GuildVoiceChannelTypes;
    userLimit: number;
    videoQualityMode: VideoQualityMode;
  }
  interface OldThread {
    appliedTags?: string[];
    flags?: number;
    name: string;
    rateLimitPerUser: number;
    threadMetadata: ThreadMetadata;
  }
  interface OldThreadMember {
    flags: number;
  }
  interface OldVoiceState {
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
    selfStream: boolean;
    selfVideo: boolean;
  }
  interface VoiceChannelEffect {
    guild: Guild | Uncached;
    channel: AnyVoiceChannel | Uncached;
    user: User | Uncached;
    emoji?: PartialEmoji;
    animationType?: VoiceChannelEffectAnimationType;
    animationID?: number;
    soundID?: string | number;
    soundVolume?: number;
  }
  interface EventListeners {
    applicationCommandPermissionsUpdate: [applicationCommandPermissions: GuildApplicationCommandPermissions];
    autoModerationActionExecution: [guild: Guild, action: AutoModerationActionExecution];
    autoModerationRuleCreate: [guild: Guild, rule: AutoModerationRule];
    autoModerationRuleDelete: [guild: Guild, rule: AutoModerationRule];
    autoModerationRuleUpdate: [guild: Guild, rule: AutoModerationRule | null, newRule: AutoModerationRule];
    channelCreate: [channel: AnyGuildChannel];
    channelDelete: [channel: AnyChannel];
    channelPinUpdate: [channel: TextableChannel, timestamp: number, oldTimestamp: number];
    channelUpdate: [channel: AnyGuildChannel, oldChannel: OldGuildChannel | OldGuildTextChannel | OldVoiceChannel];
    connect: [id: number];
    debug: [message: string, id?: number];
    disconnect: [];
    entitlementCreate: [entitlement: Entitlement];
    entitlementUpdate: [entitlement: Entitlement];
    entitlementDelete: [entitlement: Entitlement];
    error: [err: Error, id?: number];
    guildAuditLogEntryCreate: [entry: GuildAuditLogEntry];
    guildAvailable: [guild: Guild];
    guildBanAdd: [guild: PossiblyUncachedGuild, user: User];
    guildBanRemove: [guild: PossiblyUncachedGuild, user: User];
    guildCreate: [guild: Guild];
    guildDelete: [guild: PossiblyUncachedGuild];
    guildEmojisUpdate: [guild: PossiblyUncachedGuild, emojis: Emoji[], oldEmojis: Emoji[] | null];
    guildIntegrationsUpdate: [guild: PossiblyUncachedGuild];
    guildMemberAdd: [guild: Guild, member: Member];
    guildMemberChunk: [guild: Guild, member: Member[]];
    guildMemberRemove: [guild: Guild, member: Member | MemberPartial];
    guildMemberUpdate: [guild: Guild, member: Member, oldMember: OldMember | null];
    guildRoleCreate: [guild: Guild, role: Role];
    guildRoleDelete: [guild: Guild, role: Role];
    guildRoleUpdate: [guild: Guild, role: Role, oldRole: OldRole];
    guildScheduledEventCreate: [event: GuildScheduledEvent];
    guildScheduledEventDelete: [event: GuildScheduledEvent];
    guildScheduledEventUpdate: [event: GuildScheduledEvent, oldEvent: OldGuildScheduledEvent | null];
    guildScheduledEventUserAdd: [event: PossiblyUncachedGuildScheduledEvent, user: User | Uncached];
    guildScheduledEventUserRemove: [event: PossiblyUncachedGuildScheduledEvent, user: User | Uncached];
    guildSoundboardSoundCreate: [sound: SoundboardSound];
    guildSoundboardSoundDelete: [sound: PossiblyUncachedGuildSoundboardSound];
    guildSoundboardSoundUpdate: [sound: SoundboardSound, oldSound: OldGuildSoundboardSound | null];
    guildSoundboardSoundsUpdate: [guild: PossiblyUncachedGuild, sounds: SoundboardSound[], oldSounds: (OldGuildSoundboardSound | null)[]];
    guildStickersUpdate: [guild: PossiblyUncachedGuild, stickers: Sticker[], oldStickers: Sticker[] | null];
    guildUnavailable: [guild: UnavailableGuild];
    guildUpdate: [guild: Guild, oldGuild: OldGuild];
    hello: [trace: string[], id: number];
    interactionCreate: [interaction: AnyInteractionGateway];
    inviteCreate: [guild: Guild, invite: Invite];
    inviteDelete: [guild: Guild, invite: Invite];
    integrationCreate: [guild: Guild, integration: GuildIntegration];
    integrationUpdate: [guild: Guild, integration: GuildIntegration];
    integrationDelete: [guild: PossiblyUncachedGuild, integration: DeletedGuildIntegration];
    messageCreate: [message: Message<PossiblyUncachedTextableChannel>];
    messageDelete: [message: PossiblyUncachedMessage];
    messageDeleteBulk: [messages: PossiblyUncachedMessage[]];
    messagePollVoteAdd: [message: PossiblyUncachedMessage, answerID: number, user: User | Uncached];
    messagePollVoteRemove: [message: PossiblyUncachedMessage, answerID: number, user: User | Uncached];
    messageReactionAdd: [message: PossiblyUncachedMessage, emoji: PartialEmoji, reactor: Member | Uncached, isBurst: boolean];
    messageReactionRemove: [message: PossiblyUncachedMessage, emoji: PartialEmoji, userID: string, isBurst: boolean];
    messageReactionRemoveAll: [message: PossiblyUncachedMessage];
    messageReactionRemoveEmoji: [message: PossiblyUncachedMessage, emoji: PartialEmoji];
    messageUpdate: [message: Message<PossiblyUncachedTextableChannel>, oldMessage: OldMessage | null];
    presenceUpdate: [other: Member, oldPresence: Presence | null];
    rawREST: [request: RawRESTRequest];
    rawWS: [packet: RawPacket, id: number];
    ready: [];
    shardPreReady: [id: number];
    soundboardSounds: [guild: PossiblyUncachedGuild, sounds: SoundboardSound[]];
    stageInstanceCreate: [stageInstance: StageInstance];
    stageInstanceDelete: [stageInstance: StageInstance];
    stageInstanceUpdate: [stageInstance: StageInstance, oldStageInstance: OldStageInstance | null];
    threadCreate: [channel: AnyThreadChannel];
    threadDelete: [channel: AnyThreadChannel];
    threadListSync: [guild: Guild, deletedThreads: (AnyThreadChannel | Uncached)[], activeThreads: AnyThreadChannel[], joinedThreadsMember: ThreadMember[]];
    threadMembersUpdate: [channel: AnyThreadChannel, addedMembers: ThreadMember[], removedMembers: (ThreadMember | Uncached)[]];
    threadMemberUpdate: [channel: AnyThreadChannel, member: ThreadMember, oldMember: OldThreadMember];
    threadUpdate: [channel: AnyThreadChannel, oldChannel: OldThread | null];
    typingStart: [channel: GuildTextableChannel | Uncached, user: User | Uncached, member: Member]
        | [channel: PrivateChannel | Uncached, user: User | Uncached, member: null];
    unavailableGuildCreate: [guild: UnavailableGuild];
    unknown: [packet: RawPacket, id?: number];
    userUpdate: [user: User, oldUser: OldUser | null];
    voiceChannelEffectSend: [effect: VoiceChannelEffect];
    voiceChannelJoin: [member: Member, channel: AnyVoiceChannel];
    voiceChannelLeave: [member: Member, channel: AnyVoiceChannel];
    voiceChannelSwitch: [member: Member, newChannel: AnyVoiceChannel, oldChannel: AnyVoiceChannel];
    voiceStateUpdate: [member: Member, oldState: OldVoiceState];
    warn: [message: string, id?: number];
    webhooksUpdate: [data: WebhookData];
  }
  interface ClientEvents extends EventListeners {
    shardDisconnect: [err: Error | undefined, id: number];
    shardReady: [id: number];
    shardResume: [id: number];
  }
  interface ShardEvents extends EventListeners {
    resume: [];
  }
  interface StreamEvents {
    end: [];
    error: [err: Error];
    start: [];
  }
  interface VoiceEvents {
    connect: [];
    debug: [message: string];
    disconnect: [err?: Error];
    end: [];
    error: [err: Error];
    pong: [latency: number];
    ready: [];
    resumed: [];
    speakingStart: [userID: string];
    speakingStop: [userID: string];
    start: [];
    unknown: [packet: RawPacket];
    usersConnect: [userIDs: string[]];
    userDisconnect: [userID: string];
    warn: [message: string];
  }

  // Gateway/REST
  interface GatewayOptions {
    autoreconnect?: boolean;
    compress?: boolean;
    connectionTimeout?: number;
    disableEvents?: Record<string, boolean>;
    firstShardID?: number;
    getAllUsers?: boolean;
    guildCreateTimeout?: number;
    intents?: number | (IntentStrings | number)[];
    largeThreshold?: number;
    lastShardID?: number;
    maxReconnectAttempts?: number;
    maxResumeAttempts?: number;
    maxConcurrency?: number | "auto";
    maxShards?: number | "auto";
    reconnectDelay?: ReconnectDelayFunction;
    seedVoiceConnections?: boolean;
  }
  interface HTTPResponse {
    code: number;
    message: string;
  }
  interface LatencyRef {
    lastTimeOffsetCheck: number;
    latency: number;
    raw: number[];
    timeOffset: number;
    timeOffsets: number[];
  }
  interface RawPacket {
    d?: unknown;
    op: number;
    s?: number;
    t?: string;
  }
  interface RawRESTRequest {
    auth: boolean;
    body?: unknown;
    file?: FileContent;
    method: string;
    resp: IncomingMessage;
    route: string;
    short: boolean;
    url: string;
  }
  interface RequestMembersPromise {
    members: Member[];
    received: number;
    res: (value: Member[]) => void;
    timeout: NodeJS.Timeout;
  }
  interface RequestSoundboardSoundsPromise {
    res: (value: Record<string, SoundboardSound[]>) => void;
    soundboardSounds: Record<string, SoundboardSound[]>;
    timeout: NodeJS.Timeout;
  }

  // Guild
  interface AddGuildMemberOptions {
    nick?: string;
    roles?: string[];
    deaf?: boolean;
    mute?: boolean;
  }
  export interface BanMemberOptions {
    deleteMessageSeconds?: number;
    reason?: string;
  }
  interface BulkGuildMemberBanResult {
    bannedUsers: string[];
    failedUsers: string[];
  }
  interface CreateGuildOptions {
    afkChannelID?: string;
    afkTimeout?: number;
    channels?: PartialChannel[];
    defaultNotifications?: DefaultNotifications;
    explicitContentFilter?: ExplicitContentFilter;
    icon?: string;
    roles?: PartialRole[];
    systemChannelFlags?: number;
    systemChannelID?: string;
    verificationLevel?: VerificationLevel;
  }
  interface DeletedGuildIntegration {
    applicationID?: string;
    id: string;
  }
  interface DiscoveryCategory {
    id: number;
    is_primary: boolean;
    name: {
      default: string;
      localizations?: { [lang: string]: string };
    };
  }
  interface DiscoveryMetadata {
    category_ids: number[];
    emoji_discoverability_enabled: boolean;
    guild_id: string;
    keywords: string[] | null;
    primary_category_id: number;
  }
  interface DiscoveryOptions {
    emojiDiscoverabilityEnabled?: boolean;
    keywords?: string[];
    primaryCategoryID?: string;
    reason?: string;
  }
  interface DiscoverySubcategoryResponse {
    category_id: number;
    guild_id: string;
  }
  interface EditGuildMFALevelOptions {
    level: MFALevel;
    reason?: string;
  }
  interface EditGuildOnboardingOptions extends Partial<Omit<GuildOnboarding, "guild_id" | "prompts">> {
    prompts?: EditGuildOnboardingPrompt[];
    reason?: string;
  }
  interface GetGuildAuditLogOptions {
    actionType?: number;
    after?: string;
    before?: string;
    limit?: number;
    userID?: string;
  }
  interface GetGuildBansOptions {
    after?: string;
    before?: string;
    limit?: number;
  }
  interface GetGuildScheduledEventOptions {
    withUserCount?: boolean;
  }
  interface GetGuildScheduledEventUsersOptions {
    after?: string;
    before?: string;
    limit?: number;
    withMember?: boolean;
  }
  interface GetPruneOptions {
    days?: number;
    includeRoles?: string[];
  }
  interface GetRESTGuildMembersOptions {
    after?: string;
    limit?: number;
  }
  interface GetRESTGuildsOptions {
    after?: string;
    before?: string;
    limit?: number;
    withCounts?: boolean;
  }
  interface GuildAuditLog {
    autoModerationRules: AutoModerationRule[];
    commands: ApplicationCommand[];
    entries: GuildAuditLogEntry[];
    events: GuildScheduledEvent[];
    integrations: GuildIntegration[];
    threads: AnyThreadChannel[];
    users: User[];
    webhooks: Webhook[];
  }
  interface GuildBan {
    reason?: string;
    user: User;
  }
  interface GuildOnboarding {
    enabled: boolean;
    default_channel_ids: string[];
    guild_id: string;
    mode: OnboardingModes;
    prompts: GuildOnboardingPrompt[];
  }
  interface GuildOnboardingPrompt {
    id: string;
    in_onboarding: boolean;
    options: GuildOnboardingPromptOption[];
    required: boolean;
    single_select: boolean;
    type: OnboardingPromptTypes;
    title: string;
  }
  interface GuildOnboardingPromptOption {
    channel_ids: string[];
    description: string | null;
    emoji: PartialEmoji;
    id: string;
    role_ids: string[];
    title: string;
  }
  interface EditGuildOnboardingPrompt extends Omit<GuildOnboardingPrompt, "options"> {
    options: EditGuildOnboardingPromptOption[];
  }
  interface EditGuildOnboardingPromptOption extends Omit<GuildOnboardingPromptOption, "emoji"> {
    emoji_id?: string;
    emoji_name?: string;
    emoji_animated?: boolean;
  }
  interface GuildOptions {
    afkChannelID?: string;
    afkTimeout?: number;
    banner?: string;
    defaultNotifications?: DefaultNotifications;
    description?: string;
    discoverySplash?: string;
    explicitContentFilter?: ExplicitContentFilter;
    features?: GuildFeatures[]; // Though only some are editable?
    icon?: string;
    name?: string;
    ownerID?: string;
    preferredLocale?: string;
    premiumProgressBarEnabled?: boolean;
    publicUpdatesChannelID?: string;
    rulesChannelID?: string;
    safetyAlertsChannelID?: string;
    splash?: string;
    systemChannelFlags?: number;
    systemChannelID?: string;
    verificationLevel?: VerificationLevel;
  }
  interface GuildScheduledEventMetadata {
    location?: string;
  }
  interface GuildScheduledEventEditOptionsBase<T extends GuildScheduledEventEntityTypes = GuildScheduledEventEntityTypes> {
    channelID?: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? null : string;
    description?: string | null;
    entityMetadata?: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? Required<GuildScheduledEventMetadata> : GuildScheduledEventMetadata | null;
    entityType?: T;
    image?: string;
    name?: string;
    privacyLevel?: GuildScheduledEventPrivacyLevel;
    scheduledEndTime?: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? Date : Date | undefined;
    scheduledStartTime?: Date;
    status?: GuildScheduledEventStatus;
  }
  interface GuildScheduledEventEditOptionsDiscord extends GuildScheduledEventEditOptionsBase<Exclude<GuildScheduledEventEntityTypes, Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"]>> {
    channelID: string;
    entityMetadata: GuildScheduledEventMetadata;
  }
  interface GuildScheduledEventEditOptionsExternal extends GuildScheduledEventEditOptionsBase<Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"]> {
    channelID: null;
    enitityMetadata: Required<GuildScheduledEventMetadata>;
    scheduledEndTime: Date;
  }
  interface GuildScheduledEventOptionsBase<T extends GuildScheduledEventEntityTypes> extends Omit<GuildScheduledEventEditOptionsBase<T>, "entityMetadata" | "status"> {
    channelID: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? never : string;
    entityMetadata?: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? Required<GuildScheduledEventMetadata> : GuildScheduledEventMetadata | undefined;
    entityType: T;
    name: string;
    privacyLevel: GuildScheduledEventPrivacyLevel;
    scheduledStartTime: Date;
  }
  interface GuildScheduledEventOptionsDiscord extends GuildScheduledEventEditOptionsBase<Exclude<GuildScheduledEventEntityTypes, Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"]>> {
    channelID: string;
    entityMetadata: GuildScheduledEventMetadata;
  }
  interface GuildScheduledEventOptionsExternal extends GuildScheduledEventOptionsBase<Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"]> {
    channelID: never;
    enitityMetadata: Required<GuildScheduledEventMetadata>;
    scheduledEndTime: Date;
  }
  interface GuildScheduledEventUser {
    guildScheduledEventID: string;
    user: User;
    member?: Member;
  }
  interface GuildSoundboardSoundBase {
    emojiID?: string | null;
    emojiName?: string | null;
    name?: string;
    volume?: number | null;
  }
  interface GuildSoundboardSoundCreate extends GuildSoundboardSoundBase {
    name: string;
    sound: string;
  }
  interface GuildSoundboardSoundEdit extends GuildSoundboardSoundBase {
    reason?: string;
  }
  interface GuildSoundboardSoundSend {
    soundID: string;
    sourceGuildID?: string;
  }
  interface GuildTemplateOptions {
    name?: string;
    description?: string | null;
  }
  interface GuildVanity {
    code: string | null;
    uses: number;
  }
  interface PartialGuild {
    approximate_member_count?: number;
    approximate_presence_count?: number;
    description?: string | null;
    discovery_splash?: string | null;
    features?: GuildFeatures[];
    icon?: string | null;
    id: string;
    name?: string;
    splash?: string | null;
  }
  interface IntegrationApplication {
    bot?: User;
    description: string;
    icon: string | null;
    id: string;
    name: string;
  }
  interface IntegrationOptions {
    enableEmoticons?: string;
    expireBehavior?: string;
    expireGracePeriod?: string;
  }
  interface PruneMemberOptions extends GetPruneOptions {
    computePruneCount?: boolean;
    reason?: string;
  }
  interface VoiceRegion {
    custom: boolean;
    deprecated: boolean;
    id: string;
    name: string;
    optimal: boolean;
    vip: boolean;
  }
  interface WelcomeChannel {
    channelID: string;
    description: string;
    emojiID: string | null;
    emojiName: string | null;
  }
  interface WelcomeScreen {
    description: string;
    welcomeChannels: WelcomeChannel[];
  }
  interface WelcomeScreenOptions extends WelcomeScreen {
    enabled: boolean;
  }
  interface Widget {
    channel_id?: string;
    enabled: boolean;
  }
  interface WidgetChannel {
    id: string;
    name: string;
    position: number;
  }
  interface WidgetData {
    channels: WidgetChannel[];
    id: string;
    instant_invite: string;
    members: WidgetMember[];
    name: string;
    presence_count: number;
  }
  interface WidgetMember {
    avatar: string | null;
    avatar_url: string;
    discriminator: string;
    id: string;
    status: string;
    username: string;
  }

  // Interaction
  interface AutocompleteInteractionData {
    id: string;
    name: string;
    type: Constants["ApplicationCommandTypes"]["CHAT_INPUT"];
    target_id?: string;
    options: InteractionDataOptions[];
  }
  interface CommandInteractionData {
    id: string;
    name: string;
    type: ApplicationCommandTypes;
    target_id?: string;
    resolved?: CommandInteractionResolvedData;
    options?: InteractionDataOptions[];
  }
  interface CommandInteractionResolvedData extends InteractionResolvedData {
    attachments?: Collection<Attachment>;
    messages?: Collection<Message>;
  }

  interface ComponentInteractionButtonData {
    component_type: Constants["ComponentTypes"]["BUTTON"];
    custom_id: string;
  }

  interface ComponentInteractionSelectMenuData {
    component_type: SelectMenuTypes;
    custom_id: string;
    values: string[];
    resolved?: InteractionResolvedData;
  }
  interface InteractionCallbackResponse<T extends InteractionResponseTypes = InteractionResponseTypes> {
    interaction: {
      id: string;
      type: InteractionTypes;
      activity_instance_id?: string;
      response_message_id?: string;
      response_message_loading?: boolean;
      response_message_ephemeral?: boolean;
    };
    resource: T extends Constants["InteractionResponseTypes"]["CHANNEL_MESSAGE_WITH_SOURCE" | "UPDATE_MESSAGE" | "LAUNCH_ACTIVITY"]
      ? {
        type: T;
        activity_instance: T extends Constants["InteractionResponseTypes"]["LAUNCH_ACTIVITY"] ? ActivityInstance : never;
        message: T extends Constants["InteractionResponseTypes"]["CHANNEL_MESSAGE_WITH_SOURCE" | "UPDATE_MESSAGE"] ? {
          id: string;
          [key: string]: unknown;
        } : never;
      } : never;
  }
  interface InteractionDataOptionsBase<T extends ApplicationCommandOptionsTypes, V = unknown> {
    focused?: T extends ApplicationCommandOptionsTypesWithAutocomplete ? boolean : never;
    name: string;
    type: T;
    value: T extends Constants["ApplicationCommandOptionTypes"]["SUB_COMMAND" | "SUB_COMMAND_GROUP"] ? never : V;
  }
  interface InteractionDataOptionsSubCommand extends InteractionDataOptionsBase<Constants["ApplicationCommandOptionTypes"]["SUB_COMMAND"]> {
    options?: InteractionDataOptionsWithValue[];
  }
  interface InteractionDataOptionsSubCommandGroup extends InteractionDataOptionsBase<Constants["ApplicationCommandOptionTypes"]["SUB_COMMAND_GROUP"]> {
    // technically these can have zero options, but it will then not show in the client so it's effectively not possible
    options: (InteractionDataOptionsSubCommand | InteractionDataOptionsWithValue)[];
  }
  interface InteractionGuild {
    features: GuildFeatures[];
    id: string;
    locale: string;
  }
  interface InteractionModalContent {
    title: string;
    custom_id: string;
    components: ModalContentActionRow[];
  }
  interface InteractionResolvedData {
    channels?: Collection<AnyChannel>;
    members?: Collection<Member>;
    roles?: Collection<Role>;
    users?: Collection<User>;
  }
  interface InteractionResponseAutocomplete extends InteractionResponseBase {
    data: ApplicationCommandOptionsChoice[];
    type: Constants["InteractionResponseTypes"]["APPLICATION_COMMAND_AUTOCOMPLETE_RESULT"];
  }
  interface InteractionResponseBase {
    withResponse?: boolean;
  }
  interface InteractionResponseDeferred extends InteractionResponseBase {
    data?: {
      flags?: number;
    };
    type: Constants["InteractionResponseTypes"]["DEFERRED_UPDATE_MESSAGE" | "DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE"];
  }
  interface InteractionResponseLaunchActivity extends InteractionResponseBase {
    type: Constants["InteractionResponseTypes"]["LAUNCH_ACTIVITY"];
  }
  interface InteractionResponseMessage extends InteractionResponseBase {
    data: RawInteractionContent;
    type: Constants["InteractionResponseTypes"]["CHANNEL_MESSAGE_WITH_SOURCE" | "UPDATE_MESSAGE" | "PREMIUM_REQUIRED"];
  }
  interface InteractionResponseModal extends InteractionResponseBase {
    data: InteractionModalContent;
    type: Constants["InteractionResponseTypes"]["MODAL"];

  }
  interface InteractionResponsePong extends InteractionResponseBase {
    type: Constants["InteractionResponseTypes"]["PONG"];
  }
  /** @deprecated */
  interface InteractionResponsePremiumRequired extends InteractionResponseBase {
    type: Constants["InteractionResponseTypes"]["PREMIUM_REQUIRED"];
  }

  interface RawInteractionContent extends Pick<WebhookPayload, "content" | "embeds" | "tts" | "flags" | "components"> {
    allowed_mentions?: {
      parse?: ("roles" | "users" | "everyone")[];
      roles?: string[];
      users?: string[];
      replied_user?: boolean;
    };

    attachments?: (AdvancedMessageContentAttachmentBase & {
      id: string;
      filename?: string;
    })[];
  }
  // Invite
  interface CreateChannelInviteOptions extends CreateInviteOptions {
    targetApplicationID?: string;
    targetType?: InviteTargetTypes;
    targetUserID?: string;
  }
  interface CreateInviteOptions {
    maxAge?: number;
    maxUses?: number;
    temporary?: boolean;
    unique?: boolean;
  }
  interface GetInviteOptions<C extends boolean, E extends boolean, GSE extends string | undefined> {
    withCounts?: C;
    withExpiration?: E;
    guildScheduledEventID?: GSE;
  }
  interface Invitable {
    createInvite(options?: CreateInviteOptions, reason?: string): Promise<Invite>;
    getInvites(): Promise<Invite[]>;
  }
  interface InvitePartialChannel {
    icon?: string | null;
    id: string;
    name: string | null;
    recipients?: { username: string }[];
    type: Exclude<ChannelTypes, 1>;
  }
  interface InviteStageInstance {
    members: Member[];
    participantCount: number;
    speakerCount: number;
    topic: string;
  }

  // Member/User
  interface FetchMembersOptions {
    limit?: number;
    presences?: boolean;
    query?: string;
    timeout?: number;
    userIDs?: string[];
  }
  interface MemberOptions {
    channelID?: string | null;
    communicationDisabledUntil?: Date | null;
    deaf?: boolean;
    flags?: number;
    mute?: boolean;
    nick?: string | null;
    roles?: string[];
  }
  interface MemberPartial {
    id: string;
    user: User;
  }
  interface MemberRoles extends BaseData {
    roles: string[];
  }
  interface OldUser {
    avatar: string | null;
    avatarDecorationData?: AvatarDecorationData | null;
    discriminator: string;
    globalName: string | null;
    username: string;
  }
  interface AvatarDecorationData {
    sku_id: string;
    asset: string;
  }
  interface PartialUser {
    avatar: string | null;
    avatar_decoration_data?: AvatarDecorationData | null;
    discriminator: string;
    id: string;
    username: string;
    public_flags?: number;
  }
  interface RequestGuildSoundboardSoundsOptions {
    guildIDs: string[];
    timeout?: number;
  }

  // Message
  interface ActionRow {
    components: ActionRowComponents[];
    type: Constants["ComponentTypes"]["ACTION_ROW"];
  }
  interface ModalContentActionRow {
    components: TextInput[];
    type: Constants["ComponentTypes"]["ACTION_ROW"];
  }
  interface AdvancedMessageContent<T extends "hasNonce" | "" = ""> {
    allowedMentions?: AllowedMentions;
    attachments?: AdvancedMessageContentAttachment[];
    components?: Component[];
    content?: string;
    enforceNonce?: T extends "hasNonce" ? boolean : never;
    embeds?: EmbedOptions[];
    flags?: number;
    messageReference?: MessageReferenceSend;
    nonce?: T extends "hasNonce" ? (string | number) : never;
    poll?: NewPoll;
    stickerIDs?: string[];
    tts?: boolean;
  }
  type AdvancedMessageContentAttachment = AdvancedMessageContentAttachmentNew | AdvancedMessageContentAttachmentExisting;

  interface AdvancedMessageContentAttachmentBase {
    description?: string;
  }
  interface AdvancedMessageContentAttachmentExisting extends AdvancedMessageContentAttachmentBase {
    id: string;
    file?: never;
    filename?: never;
  }
  interface AdvancedMessageContentAttachmentNew extends AdvancedMessageContentAttachmentBase {
    filename: string;
    file: Buffer | string;
    id?: never;
  }
  interface AllowedMentions {
    everyone?: boolean;
    repliedUser?: boolean;
    roles?: boolean | string[];
    users?: boolean | string[];
  }
  interface ButtonBase {
    disabled?: boolean;
    type: Constants["ComponentTypes"]["BUTTON"];
  }
  interface ChannelSelectMenu extends SelectMenuBase {
    channel_types?: GuildChannelTypes[];
    default_values?: SelectMenuDefaultValue<"channel">[];
    type: Constants["ComponentTypes"]["CHANNEL_SELECT"];
  }
  interface CreateStickerOptions extends Required<Pick<EditStickerOptions, "name" | "tags" | "description">> {
    file: FileContent;
  }
  interface CrosspostedChannelMention {
    guildID: string;
    id: string;
    name: string;
    type: number;
  }
  interface EditStickerOptions {
    description?: string;
    name?: string;
    tags?: string;
  }
  interface MentionableSelectMenu extends SelectMenuBase {
    default_values?: SelectMenuDefaultValue<"any">[];
    type: Constants["ComponentTypes"]["MENTIONABLE_SELECT"];
  }
  interface RoleSelectMenu extends SelectMenuBase {
    default_values?: SelectMenuDefaultValue<"role">[];
    type: Constants["ComponentTypes"]["ROLE_SELECT"];
  }
  interface UserSelectMenu extends SelectMenuBase {
    default_values?: SelectMenuDefaultValue<"user">[];
    type: Constants["ComponentTypes"]["USER_SELECT"];
  }
  interface BaseSelectMenu extends SelectMenuBase {
    type: BaseSelectMenuTypes;
  }
  interface SelectMenuBase {
    custom_id: string;
    disabled?: boolean;
    max_values?: number;
    min_values?: number;
    placeholder?: string;
    type: SelectMenuTypes;
  }
  interface StringSelectMenu extends SelectMenuBase {
    options: SelectMenuOptions[];
    type: Constants["ComponentTypes"]["STRING_SELECT"];
  }
  interface SelectMenuDefaultValue<Type extends ("any" | "user" | "role" | "channel") = "any"> {
    id: string;
    type: Type extends "any" ? ("user" | "role" | "channel") : Type;
  }
  interface SelectMenuOptions {
    default?: boolean;
    description?: string;
    emoji?: Partial<PartialEmoji>;
    label: string;
    value: string;
  }
  interface TextInput {
    type: Constants["ComponentTypes"]["TEXT_INPUT"];
    custom_id: string;
    style: Constants["TextInputStyles"][keyof Constants["TextInputStyles"]];
    label: string;
    min_length?: number;
    max_length?: number;
    required?: boolean;
    value?: string;
    placeholder?: string;
  }
  interface GetMessageReactionOptions {
    after?: string;
    limit?: number;
    type?: ReactionTypes;
  }

  interface GetPollAnswerVotersOptions {
    after?: string;
    limit?: number;
  }

  interface InteractionButton extends ButtonBase {
    custom_id: string;
    emoji?: PartialEmoji;
    label?: string;
    style: ButtonStyleNormal;
  }
  interface MessageActivity {
    party_id?: string;
    type: MessageActivityTypes;
  }
  interface MessageApplication {
    cover_image?: string;
    description: string;
    icon: string | null;
    id: string;
    name: string;
  }
  interface MessageCall {
    participants: string[];
    endedTimestamp: number | null;
  }
  interface FileContent {
    fieldName?: string;
    file: Buffer | string;
    name: string;
  }
  interface MessageInteraction {
    id: string;
    member: Member | null;
    name: string;
    type: InteractionTypes;
    user: User;
  }
  interface MessageReference extends MessageReferenceBase {
    channelID: string;
  }
  interface MessageReferenceBase {
    channelID?: string;
    guildID?: string;
    messageID?: string;
    type?: MessageReferenceTypes;
  }
  interface MessageReferenceForward extends MessageReferenceBase {
    channelID: string;
    messageID: string;
    failIfNotExists?: boolean;
    type: Constants["MessageReferenceTypes"]["FORWARD"];
  }
  interface MessageReferenceReply extends MessageReferenceBase {
    messageID: string;
    failIfNotExists?: boolean;
    type?: Constants["MessageReferenceTypes"]["DEFAULT"];
  }
  interface MessageSnapshot {
    message: Message<TextableChannel, "isSnapshot">;
  }
  interface NewPoll {
    question: PollMedia;
    answers: (Omit<PollAnswer, "answer_id">)[];
    duration?: number;
    allow_multiselect?: boolean;
    layout_type?: PollLayoutTypes;
  }
  interface Poll {
    question: PollMedia;
    answers: PollAnswer[];
    expiry: string | null;
    allow_multiselect: boolean;
    layout_type: PollLayoutTypes;
    results?: PollResults;
  }
  interface PollAnswer {
    answer_id: number;
    poll_media: PollMedia;
  }
  interface PollAnswerCount {
    id: number;
    count: number;
    me_voted: boolean;
  }
  interface PollMedia {
    text?: string;
    emoji?: PartialEmoji;
  }
  interface PollResults {
    is_finalized: boolean;
    answer_counts: PollAnswerCount[];
  }
  interface PremiumButton extends ButtonBase {
    sku_id: string;
    style: Constants["ButtonStyles"]["PREMIUM"];

  }
  interface RoleSubscriptionData {
    isRenewal: boolean;
    roleSubscriptionListingID: string;
    tierName: string;
    totalMonthsSubscribed: number;
  }
  interface Sticker extends StickerItem {
    available?: boolean;
    description: string;
    guild_id?: string;
    pack_id?: string;
    sort_value?: number;
    tags: string;
    type: StickerTypes;
    user?: User;
  }
  interface StickerItem {
    format_type: StickerFormats;
    id: string;
    name: string;
  }
  interface StickerPack {
    banner_asset_id?: string;
    cover_sticker_id?: string;
    description: string;
    id: string;
    name: string;
    sku_id: string;
    stickers: Sticker[];
  }
  interface URLButton extends ButtonBase {
    style: Constants["ButtonStyles"]["LINK"];
    emoji?: PartialEmoji;
    label?: string;
    url: string;
  }

  // Presence
  interface Activity<T extends ActivityType = ActivityType> extends ActivityPartial<T> {
    application_id?: string;
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
      [key: string]: unknown;
    };
    buttons?: ActivityButton[];
    created_at: number;
    details?: string;
    emoji?: { animated?: boolean; id?: string; name: string };
    flags?: number;
    instance?: boolean;
    party?: { id?: string; size?: [currentSize: number, maxSize: number] };
    secrets?: { join?: string; spectate?: string; match?: string };
    timestamps?: { end?: number; start: number };
    type: T;
    // the stuff attached to this object apparently varies even more than documented, so...
    [key: string]: unknown;
  }
  interface ActivityButton {
    label: string;
    url: string;
  }
  interface ActivityPartial<T extends ActivityType = ActivityType> {
    name: string;
    state?: string;
    type?: T;
    url?: string;
  }
  interface ClientPresence {
    activities: Activity[] | null;
    afk: boolean;
    since: number | null;
    status: SelfStatus;
  }
  interface ClientStatus {
    desktop: UserStatus;
    mobile: UserStatus;
    web: UserStatus;
  }
  interface Presence {
    activities?: Activity[];
    clientStatus?: ClientStatus;
    status?: UserStatus;
  }

  // Role
  interface Overwrite {
    allow: bigint | number;
    deny: bigint | number;
    id: string;
    type: PermissionType;
  }
  interface PartialRole {
    color?: number;
    hoist?: boolean;
    id: string;
    mentionable?: boolean;
    name?: string;
    permissions?: number;
    position?: number;
  }
  interface RoleOptions {
    color?: number;
    hoist?: boolean;
    icon?: string;
    mentionable?: boolean;
    name?: string;
    permissions?: bigint | number | string | Permission;
    unicodeEmoji?: string;
  }
  interface RoleTags {
    bot_id?: string;
    guild_connections?: true;
    integration_id?: string;
    premium_subscriber?: true;
    subscription_listing_id?: string;
    available_for_purchase?: true;
  }

  // Thread
  interface CreateThreadOptions {
    autoArchiveDuration?: AutoArchiveDuration;
    name: string;
    rateLimitPerUser?: number | null;
  }
  interface CreateThreadWithoutMessageOptions<T = AnyThreadChannel["type"]> extends CreateThreadOptions {
    appliedTags?: T extends PublicThreadChannel["type"] ? string[] : never;
    invitable: T extends PrivateThreadChannel["type"] ? boolean : never;
    message?: T extends PublicThreadChannel["type"] ? Omit<AdvancedMessageContent, "messageReference" | "tts"> : never;
    type: T;
  }
  interface GetArchivedThreadsOptions {
    before?: Date;
    limit?: number;
  }
  interface ListedChannelThreads<T extends ThreadChannel = AnyThreadChannel> extends ListedGuildThreads<T> {
    hasMore: boolean;
  }
  interface ListedGuildThreads<T extends ThreadChannel = AnyThreadChannel> {
    members: ThreadMember[];
    threads: T[];
  }
  interface PrivateThreadMetadata extends ThreadMetadata {
    invitable: boolean;
  }
  interface ThreadMetadata {
    archiveTimestamp: number;
    archived: boolean;
    autoArchiveDuration: AutoArchiveDuration;
    createTimestamp: number | null;
    locked: boolean;
  }

  // Modals
  interface ModalSubmitInteractionDataComponents {
    components: ModalSubmitInteractionDataComponent[];
    type: Constants["ComponentTypes"]["ACTION_ROW"];
  }

  interface ModalSubmitInteractionDataTextInputComponent {
    custom_id: string;
    type: Constants["ComponentTypes"]["TEXT_INPUT"];
    value: string;
  }

  interface ModalSubmitInteractionData {
    custom_id: string;
    components: ModalSubmitInteractionDataComponents[];
  }

  // Voice
  interface CreateStageInstanceOptions extends StageInstanceOptions {
    guildScheduledEventID?: string;
    sendStartNotification?: boolean;
  }
  interface JoinVoiceChannelOptions {
    opusOnly?: boolean;
    selfDeaf?: boolean;
    selfMute?: boolean;
    shared?: boolean;
  }
  interface StageInstanceOptions {
    privacyLevel?: StageInstancePrivacyLevel;
    topic?: string;
  }
  interface UncachedMemberVoiceState {
    id: string;
    voiceState: OldVoiceState;
  }
  interface VoiceConnectData {
    channel_id: string;
    endpoint: string;
    session_id: string;
    token: string;
    user_id: string;
  }
  interface VoiceResourceOptions {
    encoderArgs?: string[];
    format?: string;
    frameDuration?: number;
    frameSize?: number;
    inlineVolume?: boolean;
    inputArgs?: string[];
    pcmSize?: number;
    samplingRate?: number;
    voiceDataTimeout?: number;
  }
  interface VoiceServerUpdateData extends Omit<VoiceConnectData, "channel_id"> {
    guild_id: string;
    shard: Shard;
  }
  interface VoiceStateOptions {
    channelID: string;
    requestToSpeakTimestamp?: Date | null;
    suppress?: boolean;
  }
  interface VoiceStreamCurrent {
    buffer: Buffer | null;
    bufferingTicks: number;
    options: VoiceResourceOptions;
    pausedTime?: number;
    pausedTimestamp?: number;
    playTime: number;
    startTime: number;
    timeout: NodeJS.Timeout | null;
  }

  // Webhook
  interface Webhook {
    application_id: string | null;
    avatar: string | null;
    channel_id: string | null;
    guild_id?: string | null;
    id: string;
    name: string;
    source_channel?: { id: string; name: string };
    source_guild?: { icon: string | null; id: string; name: string };
    token?: string;
    type: WebhookTypes;
    url?: string;
    user?: PartialUser;
  }
  interface WebhookOptions {
    avatar?: string | null;
    channelID?: string;
    name?: string;
  }
  interface WebhookPayload {
    allowedMentions?: AllowedMentions;
    appliedTags?: string[];
    auth?: boolean;
    attachments?: AdvancedMessageContentAttachment[];
    avatarURL?: string;
    components?: Component[];
    content?: string;
    embed?: EmbedOptions;
    embeds?: EmbedOptions[];
    flags?: number;
    poll?: NewPoll;
    threadID?: string;
    threadName?: string;
    tts?: boolean;
    username?: string;
    wait?: boolean;
  }

  // TODO: Does this have more stuff?
  interface BaseData {
    id: string;
    [key: string]: unknown;
  }
  interface OAuthApplicationInfo {
    approximate_guild_count?: number;
    approximate_user_install_count?: number;
    bot?: PartialUser;
    bot_public: boolean;
    bot_require_code_grant: boolean;
    cover_image?: string;
    custom_install_url?: string;
    description: string;
    flags?: number;
    guild_id?: string;
    guild?: PartialGuild;
    icon: string | null;
    id: string;
    install_params?: OAuthInstallParams;
    integration_types_config?: Record<ApplicationIntegrationTypes, {
      install_params?: OAuthInstallParams;
    }>;
    interactions_endpoint_url?: string;
    name: string;
    owner?: PartialUser;
    primary_sku_id?: string;
    privacy_policy_url?: string;
    redirect_uris?: string[];
    role_connections_verification_url?: string;
    rpc_origins?: string[];
    slug?: string;
    tags?: string[];
    team: OAuthTeamInfo | null;
    terms_of_service_url?: string;
    verify_key: string;
  }

  type EditApplicationOptions = Partial<Pick<OAuthApplicationInfo, |
  "cover_image" |
  "custom_install_url" |
  "description" |
  "flags" |
  "icon" |
  "install_params" |
  "interactions_endpoint_url" |
  "role_connections_verification_url" |
  "tags"
  >>;

  interface OAuthTeamInfo {
    icon: string | null;
    id: string;
    members: OAuthTeamMember[];
    name: string;
    owner_user_id: string;
  }
  interface OAuthTeamMember {
    membership_state: MembershipStates;
    permissions: ["*"];
    team_id: string;
    user: PartialUser;
  }
  interface OAuthInstallParams {
    scopes: string[];
    permissions: string;
  }

  // Activities
  interface ActivityInstance {
    id: string;
  }
  /* eslint-disable @stylistic/key-spacing, @stylistic/no-multi-spaces */
  interface Constants {
    GATEWAY_VERSION: 10;
    REST_VERSION: 10;
    VOICE_VERSION: 8;
    ActivityFlags: {
      INSTANCE:                    1;
      JOIN:                        2;
      SPECTATE:                    4;
      JOIN_REQUEST:                8;
      SYNC:                        16;
      PLAY:                        32;
      PARTY_PRIVACY_FRIENDS:       64;
      PARTY_PRIVACY_VOICE_CHANNEL: 128;
      EMBEDDED:                    256;
    };
    ActivityTypes: {
      GAME:      0;
      STREAMING: 1;
      LISTENING: 2;
      WATCHING:  3;
      CUSTOM:    4;
      COMPETING: 5;
    };
    ApplicationCommandEntryPointHandlerTypes: {
      APP_HANDLER:             1;
      DISCORD_LAUNCH_ACTIVITY: 2;
    };
    ApplicationCommandOptionTypes: {
      SUB_COMMAND:       1;
      SUB_COMMAND_GROUP: 2;
      STRING:            3;
      INTEGER:           4;
      BOOLEAN:           5;
      USER:              6;
      CHANNEL:           7;
      ROLE:              8;
      MENTIONABLE:       9;
      NUMBER:            10;
      ATTACHMENT:        11;
    };
    ApplicationCommandPermissionTypes: {
      ROLE:    1;
      USER:    2;
      CHANNEL: 3;
    };
    ApplicationCommandTypes: {
      CHAT_INPUT:          1;
      USER:                2;
      MESSAGE:             3;
      PRIMARY_ENTRY_POINT: 4;
    };
    ApplicationIntegrationTypes: {
      GUILD_INSTALL: 0;
      USER_INSTALL: 1;
    };
    ApplicationFlags: {
      APPLICATION_AUTO_MODERATION_RULE_CREATE_BADGE: 64;
      GATEWAY_PRESENCE:                              4096;
      GATEWAY_PRESENCE_LIMITED:                      8192;
      GATEWAY_GUILD_MEMBERS:                         16384;
      GATEWAY_GUILD_MEMBERS_LIMITED:                 32768;
      VERIFICATION_PENDING_GUILD_LIMIT:              65536;
      EMBEDDED:                                      131072;
      GATEWAY_MESSAGE_CONTENT:                       262144;
      GATEWAY_MESSAGE_CONTENT_LIMITED:               524288;
      APPLICATION_COMMAND_BADGE:                     8388608;
    };
    AttachmentFlags: {
      IS_REMIX: 4;
    };
    AuditLogActions: {
      GUILD_UPDATE: 1;

      CHANNEL_CREATE:           10;
      CHANNEL_UPDATE:           11;
      CHANNEL_DELETE:           12;
      CHANNEL_OVERWRITE_CREATE: 13;
      CHANNEL_OVERWRITE_UPDATE: 14;
      CHANNEL_OVERWRITE_DELETE: 15;

      MEMBER_KICK:        20;
      MEMBER_PRUNE:       21;
      MEMBER_BAN_ADD:     22;
      MEMBER_BAN_REMOVE:  23;
      MEMBER_UPDATE:      24;
      MEMBER_ROLE_UPDATE: 25;
      MEMBER_MOVE:        26;
      MEMBER_DISCONNECT:  27;
      BOT_ADD:            28;

      ROLE_CREATE: 30;
      ROLE_UPDATE: 31;
      ROLE_DELETE: 32;

      INVITE_CREATE: 40;
      INVITE_UPDATE: 41;
      INVITE_DELETE: 42;

      WEBHOOK_CREATE: 50;
      WEBHOOK_UPDATE: 51;
      WEBHOOK_DELETE: 52;

      EMOJI_CREATE: 60;
      EMOJI_UPDATE: 61;
      EMOJI_DELETE: 62;

      MESSAGE_DELETE:      72;
      MESSAGE_BULK_DELETE: 73;
      MESSAGE_PIN:         74;
      MESSAGE_UNPIN:       75;

      INTEGRATION_CREATE:    80;
      INTEGRATION_UPDATE:    81;
      INTEGRATION_DELETE:    82;
      STAGE_INSTANCE_CREATE: 83;
      STAGE_INSTANCE_UPDATE: 84;
      STAGE_INSTANCE_DELETE: 85;

      STICKER_CREATE: 90;
      STICKER_UPDATE: 91;
      STICKER_DELETE: 92;

      GUILD_SCHEDULED_EVENT_CREATE: 100;
      GUILD_SCHEDULED_EVENT_UPDATE: 101;
      GUILD_SCHEDULED_EVENT_DELETE: 102;

      THREAD_CREATE: 110;
      THREAD_UPDATE: 111;
      THREAD_DELETE: 112;

      APPLICATION_COMMAND_PERMISSION_UPDATE: 121;

      AUTO_MODERATION_RULE_CREATE:   140;
      AUTO_MODERATION_RULE_UPDATE:   141;
      AUTO_MODERATION_RULE_DELETE:   142;
      AUTO_MODERATION_BLOCK_MESSAGE: 143;
      AUTO_MODERATION_FLAG_TO_CHANNEL: 144;
      AUTO_MODERATION_USER_COMMUNICATION_DISABLED: 145;

      CREATOR_MONETIZATION_REQUEST_CREATED: 150;
      CREATOR_MONETIZATION_TERMS_ACCEPTED:  151;

      ROLE_PROMPT_CREATE: 160;
      ROLE_PROMPT_UPDATE: 161;
      ROLE_PROMPT_DELETE: 162;

      ONBOARDING_PROMPT_CREATE: 163;
      ONBOARDING_PROMPT_UPDATE: 164;
      ONBOARDING_PROMPT_DELETE: 165;

      ONBOARDING_CREATE: 166;
      ONBOARDING_UPDATE: 167;

      HOME_SETTINGS_CREATE: 190;
      HOME_SETTINGS_UPDATE: 191;
    };
    AutoModerationActionTypes: {
      BLOCK_MESSAGE:            1;
      SEND_ALERT_MESSAGE:       2;
      TIMEOUT:                  3;
      BLOCK_MEMBER_INTERACTION: 4;
    };
    AutoModerationEventTypes: {
      MESSAGE_SEND:  1;
      MEMBER_UPDATE: 2;
    };
    AutoModerationKeywordPresetTypes: {
      PROFANITY:      1;
      SEXUAL_CONTENT: 2;
      SLURS:          3;
    };
    AutoModerationTriggerTypes: {
      KEYWORD:        1;
      SPAM:           3;
      KEYWORD_PRESET: 4;
      MENTION_SPAM:   5;
      MEMBER_PROFILE: 6;
    };
    ButtonStyles: {
      PRIMARY:   1;
      SECONDARY: 2;
      SUCCESS:   3;
      DANGER:    4;
      LINK:      5;
      PREMIUM:   6;
    };
    ChannelTypes: {
      GUILD_TEXT:           0;
      DM:                   1;
      GUILD_VOICE:          2;
      GROUP_DM:             3;
      GUILD_CATEGORY:       4;
      GUILD_ANNOUNCEMENT:   5;
      // (undocumented types skipped)
      ANNOUNCEMENT_THREAD:  10;
      PUBLIC_THREAD:        11;
      PRIVATE_THREAD:       12;
      GUILD_STAGE_VOICE:    13;
      GUILD_DIRECTORY:      14;
      GUILD_FORUM:          15;
      GUILD_MEDIA:          16;
    };
    ChannelFlags: {
      PINNED:                      2;
      REQUIRE_TAG:                 16;
      HIDE_MEDIA_DOWNLOAD_OPTIONS: 32768;
    };
    ComponentTypes: {
      ACTION_ROW:         1;
      BUTTON:             2;
      STRING_SELECT:      3;
      TEXT_INPUT:         4;
      USER_SELECT:        5;
      ROLE_SELECT:        6;
      MENTIONABLE_SELECT: 7;
      CHANNEL_SELECT:     8;
    };
    ConnectionVisibilityTypes: {
      NONE:     0;
      EVERYONE: 1;
    };
    DefaultMessageNotificationLevels: {
      ALL_MESSAGES:  0;
      ONLY_MENTIONS: 1;
    };
    EntitlementOwnerTypes: {
      GUILD: 1;
      USER:  2;
    };
    EntitlementTypes: {
      PURCHASE:                 1;
      PREMIUM_SUBSCRIPTION:     2;
      DEVELOPER_GIFT:           3;
      TEST_MODE_PURCHASE:       4;
      FREE_PURCHASE:            5;
      USER_GIFT:                6;
      PREMIUM_PURCHASE:         7;
      APPLICATION_SUBSCRIPTION: 8;
    };
    ExplicitContentFilterLevels: {
      DISABLED:              0;
      MEMBERS_WITHOUT_ROLES: 1;
      ALL_MEMBERS:           2;
    };
    ForumLayoutTypes: {
      NOT_SET:      0;
      LIST_VIEW:    1;
      GALLERY_VIEW: 2;
    };
    GatewayOPCodes: {
      DISPATCH:                  0;
      HEARTBEAT:                 1;
      IDENTIFY:                  2;
      PRESENCE_UPDATE:           3;
      VOICE_STATE_UPDATE:        4;
      VOICE_SERVER_PING:         5;
      RESUME:                    6;
      RECONNECT:                 7;
      REQUEST_GUILD_MEMBERS:     8;
      INVALID_SESSION:           9;
      HELLO:                     10;
      HEARTBEAT_ACK:             11;
      // (undocumented op codes skipped)
      REQUEST_SOUNDBOARD_SOUNDS: 31;
    };
    GuildFeatures: [
      "ANIMATED_BANNER",
      "ANIMATED_ICON",
      "APPLICATION_COMMAND_PERMISSIONS_V2",
      "AUTO_MODERATION",
      "BANNER",
      "COMMUNITY",
      "CREATOR_MONETIZABLE_PROVISIONAL",
      "CREATOR_STORE_PAGE",
      "DEVELOPER_SUPPORT_SERVER",
      "DISCOVERABLE",
      "FEATURABLE",
      "INVITES_DISABLED",
      "INVITE_SPLASH",
      "MEMBER_VERIFICATION_GATE_ENABLED",
      "MORE_STICKERS",
      "NEWS",
      "PARTNERED",
      "PREVIEW_ENABLED",
      "RAID_ALERTS_DISABLED",
      "ROLE_ICONS",
      "ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE",
      "ROLE_SUBSCRIPTIONS_ENABLED",
      "TICKETED_EVENTS_ENABLED",
      "VANITY_URL",
      "VERIFIED",
      "VIP_REGIONS",
      "WELCOME_SCREEN_ENABLED"
    ];
    GuildIntegrationExpireBehavior: {
      REMOVE_ROLE: 0;
      KICK:        1;
    };
    GuildIntegrationTypes: [
      "twitch",
      "youtube",
      "discord",
      "guild_subscription"
    ];
    GuildNSFWLevels: {
      DEFAULT:        0;
      EXPLICIT:       1;
      SAFE:           2;
      AGE_RESTRICTED: 3;
    };
    ImageFormats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif"
    ];
    ImageSizeBoundaries: {
      MAXIMUM: 4096;
      MINIMUM: 16;
    };
    Intents: {
      guilds:                      1;
      guildMembers:                2;
      guildModeration:             4;
      guildExpressions:            8;
      /** @deprecated */
      guildEmojisAndStickers:      8;
      guildIntegrations:           16;
      guildWebhooks:               32;
      guildInvites:                64;
      guildVoiceStates:            128;
      guildPresences:              256;
      guildMessages:               512;
      guildMessageReactions:       1024;
      guildMessageTyping:          2048;
      directMessages:              4096;
      directMessageReactions:      8192;
      directMessageTyping:         16384;
      messageContent:              32768;
      guildScheduledEvents:        65536;
      autoModerationConfiguration: 1048576;
      autoModerationExecution:     2097152;
      guildMessagePolls:           16777216;
      directMessagePolls:          33554432;
      allNonPrivileged:            53575421;
      allPrivileged:               33026;
      all:                         53608447;
    };
    InteractionContextTypes: {
      GUILD:           0;
      BOT_DM:          1;
      PRIVATE_CHANNEL: 2;
    };
    InteractionResponseTypes: {
      PONG:                                    1;
      CHANNEL_MESSAGE_WITH_SOURCE:             4;
      DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE:    5;
      DEFERRED_UPDATE_MESSAGE:                 6;
      UPDATE_MESSAGE:                          7;
      APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8;
      MODAL:                                   9;
      /** @deprecated */
      PREMIUM_REQUIRED:                        10;
      LAUNCH_ACTIVITY:                         12;
    };
    InteractionTypes: {
      PING:                             1;
      APPLICATION_COMMAND:              2;
      MESSAGE_COMPONENT:                3;
      APPLICATION_COMMAND_AUTOCOMPLETE: 4;
      MODAL_SUBMIT:                     5;
    };
    InviteTargetTypes: {
      STREAM:               1;
      EMBEDDED_APPLICATION: 2;
    };
    InviteTypes: {
      GUILD:    0;
      GROUP_DM: 1;
      FRIEND:   2;
    };
    MFALevels: {
      NONE:     0;
      ELEVATED: 1;
    };
    MemberFlags: {
      DID_REJOIN:                      1;
      COMPLETED_ONBOARDING:            2;
      BYPASSES_VERIFICATION:           4;
      STARTED_ONBOARDING:              8;
      IS_GUEST:                        16;
      STARTED_HOME_ACTIONS:            32;
      COMPLETED_HOME_ACTIONS:          64;
      AUTOMOD_QUARANTINED_USERNAME:    128;
      DM_SETTINGS_UPSELL_ACKNOWLEDGED: 512;
    };
    MessageActivityTypes: {
      JOIN:         1;
      SPECTATE:     2;
      LISTEN:       3;
      JOIN_REQUEST: 5;
    };
    MessageFlags: {
      CROSSPOSTED:                            1;
      IS_CROSSPOST:                           2;
      SUPPRESS_EMBEDS:                        4;
      SOURCE_MESSAGE_DELETED:                 8;
      URGENT:                                 16;
      HAS_THREAD:                             32;
      EPHEMERAL:                              64;
      LOADING:                                128;
      FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 256;
      SUPPRESS_NOTIFICATIONS:                 4096;
      IS_VOICE_MESSAGE:                       8192;
    };
    MessageReferenceTypes: {
      DEFAULT: 0;
      FORWARD: 1;
    };
    MessageTypes: {
      DEFAULT:                                      0;
      RECIPIENT_ADD:                                1;
      RECIPIENT_REMOVE:                             2;
      CALL:                                         3;
      CHANNEL_NAME_CHANGE:                          4;
      CHANNEL_ICON_CHANGE:                          5;
      CHANNEL_PINNED_MESSAGE:                       6;
      USER_JOIN:                                    7;
      GUILD_BOOST:                                  8;
      GUILD_BOOST_TIER_1:                           9;
      GUILD_BOOST_TIER_2:                           10;
      GUILD_BOOST_TIER_3:                           11;
      CHANNEL_FOLLOW_ADD:                           12;
      GUILD_DISCOVERY_DISQUALIFIED:                 14;
      GUILD_DISCOVERY_REQUALIFIED:                  15;
      GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: 16;
      GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING:   17;
      THREAD_CREATED:                               18;
      REPLY:                                        19;
      CHAT_INPUT_COMMAND:                           20;
      THREAD_STARTER_MESSAGE:                       21;
      GUILD_INVITE_REMINDER:                        22;
      CONTEXT_MENU_COMMAND:                         23;
      AUTO_MODERATION_ACTION:                       24;
      ROLE_SUBSCRIPTION_PURCHASE:                   25;
      INTERACTION_PREMIUM_UPSELL:                   26;
      STAGE_START:                                  27;
      STAGE_END:                                    28;
      STAGE_SPEAKER:                                29;
      STAGE_TOPIC:                                  31;
      GUILD_APPLICATION_PREMIUM_SUBSCRIPTION:       32;
      GUILD_INCIDENT_ALERT_MODE_ENABLED:            36;
      GUILD_INCIDENT_ALERT_MODE_DISABLED:           37;
      GUILD_INCIDENT_REPORT_RAID:                   38;
      GUILD_INCIDENT_REPORT_FALSE_ALARM:            39;
      PURCHASE_NOTIFICATION:                        44;
      POLL_RESULT:                                  46;
    };
    MembershipState: {
      INVITED: 1;
      ACCEPTED: 2;
    };
    OnboardingModes: {
      ONBOARDING_DEFAULT:  0;
      ONBOARDING_ADVANCED: 1;
    };
    OnboardingPromptTypes: {
      MULTIPLE_CHOICE: 0;
      DROPDOWN:        1;
    };
    PermissionOverwriteTypes: {
      ROLE: 0;
      USER: 1;
    };
    Permissions: {
      createInstantInvite:              1n;
      kickMembers:                      2n;
      banMembers:                       4n;
      administrator:                    8n;
      manageChannels:                   16n;
      manageGuild:                      32n;
      addReactions:                     64n;
      viewAuditLog:                     128n;
      voicePrioritySpeaker:             256n;
      voiceStream:                      512n;
      viewChannel:                      1024n;
      sendMessages:                     2048n;
      sendTTSMessages:                  4096n;
      manageMessages:                   8192n;
      embedLinks:                       16384n;
      attachFiles:                      32768n;
      readMessageHistory:               65536n;
      mentionEveryone:                  131072n;
      useExternalEmojis:                262144n;
      viewGuildInsights:                524288n;
      voiceConnect:                     1048576n;
      voiceSpeak:                       2097152n;
      voiceMuteMembers:                 4194304n;
      voiceDeafenMembers:               8388608n;
      voiceMoveMembers:                 16777216n;
      voiceUseVAD:                      33554432n;
      changeNickname:                   67108864n;
      manageNicknames:                  134217728n;
      manageRoles:                      268435456n;
      manageWebhooks:                   536870912n;
      /** @deprecated */
      manageEmojisAndStickers:          1073741824n;
      manageGuildExpressions:           1073741824n;
      useApplicationCommands:           2147483648n;
      voiceRequestToSpeak:              4294967296n;
      manageEvents:                     8589934592n;
      manageThreads:                    17179869184n;
      createPublicThreads:              34359738368n;
      createPrivateThreads:             68719476736n;
      useExternalStickers:              137438953472n;
      sendMessagesInThreads:            274877906944n;
      startEmbeddedActivities:          549755813888n;
      moderateMembers:                  1099511627776n;
      viewCreatorMonetizationAnalytics: 2199023255552n;
      createGuildExpressions:           8796093022208n;
      createEvents:                     17592186044416n;
      useExternalSounds:                35184372088832n;
      useSoundboard:                    4398046511104n;
      sendVoiceMessages:                70368744177664n;
      sendPolls:                        562949953421312n;
      useExternalApps:                  1125899906842624n;
      allGuild:                         29697484783806n;
      allText:                          1759754133699665n;
      allVoice:                         40136803878673n;
      all:                              1829587348619263n;
    };
    PollLayoutTypes: {
      DEFAULT: 1;
    };
    PremiumTiers: {
      NONE:   0;
      TIER_1: 1;
      TIER_2: 2;
      TIER_3: 3;
    };
    PremiumTypes: {
      NONE:          0;
      NITRO_CLASSIC: 1;
      NITRO:         2;
    };
    ReactionTypes: {
      NORMAL: 0;
      BURST:  1;
    };
    RoleConnectionMetadataTypes: {
      INTEGER_LESS_THAN_OR_EQUAL:     1;
      INTEGER_GREATER_THAN_OR_EQUAL:  2;
      INTEGER_EQUAL:                  3;
      INTEGER_NOT_EQUAL:              4;
      DATETIME_LESS_THAN_OR_EQUAL:    5;
      DATETIME_GREATER_THAN_OR_EQUAL: 6;
      BOOLEAN_EQUAL:                  7;
      BOOLEAN_NOT_EQUAL:              8;
    };
    RoleFlags: {
      IN_PROMPT: 1;
    };
    SKUFlags: {
      AVAILABLE:          4;
      GUILD_SUBSCRIPTION: 128;
      USER_SUBSCRIPTION:  256;
    };
    SKUTypes: {
      DURABLE:            2;
      CONSUMABLE:         3;
      SUBSCRIPTION:       5;
      SUBSCRIPTION_GROUP: 6;
    };
    StageInstancePrivacyLevel: {
      /** @deprecated */
      PUBLIC: 1;
      GUILD_ONLY: 2;
    };
    StickerFormats: {
      PNG:    1;
      APNG:   2;
      LOTTIE: 3;
      GIF:    4;
    };
    StickerTypes: {
      STANDARD: 1;
      GUILD:    2;
    };
    SystemChannelFlags: {
      SUPPRESS_JOIN_NOTIFICATIONS:                              1;
      SUPPRESS_PREMIUM_SUBSCRIPTIONS:                           2;
      SUPPRESS_GUILD_REMINDER_NOTIFICATIONS:                    4;
      SUPPRESS_JOIN_NOTIFICATION_REPLIES:                       8;
      SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS:        16;
      SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES: 32;
    };
    SystemJoinMessages: [
      "%user% joined the party.",
      "%user% is here.",
      "Welcome, %user%. We hope you brought pizza.",
      "A wild %user% appeared.",
      "%user% just landed.",
      "%user% just slid into the server.",
      "%user% just showed up!",
      "Welcome %user%. Say hi!",
      "%user% hopped into the server.",
      "Everyone welcome %user%!",
      "Glad you're here, %user%.",
      "Good to see you, %user%.",
      "Yay you made it, %user%!"
    ];
    TextComponentStyle: {
      SMALL:     1;
      PARAGRAPH: 2;
    };
    ThreadMemberFlags: {
      HAS_INTERACTED: 1;
      ALL_MESSAGES:   2;
      ONLY_MENTIONS:  4;
      NO_MESSAGES:    8;
    };
    ThreadSortingOrders: {
      LATEST_ACTIVITY: 0;
      CREATION_DATE:   1;
    };
    TextInputStyles: {
      SHORT:     1;
      PARAGRAPH: 2;
    };
    UserFlags: {
      NONE:                         0;
      STAFF:                        1;
      PARTNER:                      2;
      PARTNERED_SERVER_OWNER:       2;
      HYPESQUAD:                    4;
      BUG_HUNTER_LEVEL_1:           8;
      HYPESQUAD_ONLINE_HOUSE_1:     64;
      HYPESQUAD_ONLINE_HOUSE_2:     128;
      HYPESQUAD_ONLINE_HOUSE_3:     256;
      PREMIUM_EARLY_SUPPORTER:      512;
      TEAM_PSEUDO_USER:             1024;
      SYSTEM:                       4096;
      BUG_HUNTER_LEVEL_2:           16384;
      VERIFIED_BOT:                 65536;
      VERIFIED_DEVELOPER:           131072;
      CERTIFIED_MODERATOR:          262144;
      BOT_HTTP_INTERACTIONS:        524288;
      SPAMMER:                      1048576;
      ACTIVE_DEVELOPER:             4194304;
    };
    VerificationLevels: {
      NONE:      0;
      LOW:       1;
      MEDIUM:    2;
      HIGH:      3;
      VERY_HIGH: 4;
    };
    VideoQualityModes: {
      AUTO: 1;
      FULL: 2;
    };
    VoiceChannelEffectAnimationTypes: {
      PREMIUM: 0;
      BASIC: 1;
    };
    VoiceOPCodes: {
      IDENTIFY:            0;
      SELECT_PROTOCOL:     1;
      READY:               2;
      HEARTBEAT:           3;
      SESSION_DESCRIPTION: 4;
      SPEAKING:            5;
      HEARTBEAT_ACK:       6;
      RESUME:              7;
      HELLO:               8;
      RESUMED:             9;
      CLIENTS_CONNECT:     11;
      CLIENT_DISCONNECT:   13;
    };
    GuildScheduledEventStatus: {
      SCHEDULED: 1;
      ACTIVE: 2;
      COMPLETED: 3;
      CANCELED: 4;
    };
    GuildScheduledEventEntityTypes: {
      STAGE_INSTANCE: 1;
      VOICE: 2;
      EXTERNAL: 3;
    };
    GuildScheduledEventPrivacyLevel: {
      GUILD_ONLY: 2;
    };
    WebhookTypes: {
      INCOMING:         1;
      CHANNEL_FOLLOWER: 2;
      APPLICATION:      3;
    };
  }
  /* eslint-enable @stylistic/key-spacing, @stylistic/no-multi-spaces */

  // Subscriptions
  interface CreateTestEntitlementOptions {
    skuID: string;
    ownerID: string;
    ownerType: EntitlementOwnerTypes;
  }

  interface GetEntitlementsOptions {
    after?: number;
    before?: number;
    excludeEnded?: boolean;
    guildID?: string;
    limit?: number;
    skuIDs?: string[];
    userID?: string;
  }

  interface SKU {
    id: string;
    application_id: string;
    type: SKUTypes;
    name: string;
    slug: string;
    flags: number;
  }

  // Classes
  export class AutocompleteInteraction extends Interaction {
    data: AutocompleteInteractionData;
    type: Constants["InteractionTypes"]["APPLICATION_COMMAND_AUTOCOMPLETE"];
    acknowledge(choices: ApplicationCommandOptionsChoice[]): Promise<void>;
    result(choices: ApplicationCommandOptionsChoice[]): Promise<void>;
  }
  export class AutoModerationRule extends Base {
    actions: AutoModerationAction[];
    creatorID: string;
    enabled: boolean;
    eventType: AutoModerationEventType;
    exemptChannels: string[];
    exemptRoles: string[];
    guildID: string;
    id: string;
    name: string;
    triggerMetadata: AutoModerationTriggerMetadata;
    triggerType: AutoModerationTriggerType;

    delete(): Promise<void>;
    edit(options: EditAutoModerationRuleOptions): Promise<AutoModerationRule>;
  }
  export class Attachment extends Base {
    contentType?: string;
    description?: string;
    durationSecs?: number;
    ephemeral?: boolean;
    filename: string;
    flags?: number;
    height?: number;
    id: string;
    proxyURL: string;
    size: number;
    title?: string;
    url: string;
    waveform?: string;
    width?: number;
    constructor(data: BaseData);
  }
  export class Base implements SimpleJSON {
    createdAt: number;
    id: string;
    constructor(id: string);
    static getCreatedAt(id: string): number;
    static getDiscordEpoch(id: string): number;
    inspect(): this;
    toString(): string;
    toJSON(props?: string[]): JSONCache;
  }

  export class BrowserWebSocket extends EventEmitter {
    static CONNECTING: 0;
    static OPEN: 1;
    static CLOSING: 2;
    static CLOSED: 3;
    readyState: number;
    constructor(url: string);
    close(code?: number, reason?: string): void;
    removeEventListener(event: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore: DOM
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    terminate(): void;
  }

  export class BrowserWebSocketError extends Error {
    // @ts-ignore: DOM
    event: Event;
    // @ts-ignore: DOM
    constructor(message: string, event: Event);
  }

  export class Bucket {
    interval: number;
    lastReset: number;
    lastSend: number;
    tokenLimit: number;
    tokens: number;
    constructor(tokenLimit: number, interval: number, options: { latencyRef: { latency: number }; reservedTokens: number });
    check(): void;
    queue(func: () => void, priority?: boolean): void;
  }
  export class CategoryChannel extends GuildChannel {
    channels: Collection<Exclude<AnyGuildChannel, CategoryChannel>>;
    permissionOverwrites: Collection<PermissionOverwrite>;
    position: number;
    type: Constants["ChannelTypes"]["GUILD_CATEGORY"];
    edit(options: Omit<CreateChannelOptions, "permissionOverwrites" | "reason">, reason?: string): Promise<this>;
  }

  export class Channel extends Base {
    /** @deprecated */
    client: Client;
    createdAt: number;
    id: string;
    mention: string;
    type: ChannelTypes;
    constructor(data: BaseData, client: Client);
    static from(data: BaseData, client: Client): AnyChannel;
  }

  export class Client extends EventEmitter {
    application?: { id: string; flags: number };
    bot: boolean;
    channelGuildMap: { [s: string]: string };
    gatewayURL?: string;
    guilds: Collection<Guild>;
    guildShardMap: { [s: string]: number };
    lastConnect: number;
    lastReconnectDelay: number;
    options: ClientOptions;
    presence: ClientPresence;
    privateChannelMap: { [s: string]: string };
    privateChannels: Collection<PrivateChannel>;
    ready: boolean;
    reconnectAttempts: number;
    requestHandler: RequestHandler;
    shards: ShardManager;
    startTime: number;
    threadGuildMap: { [s: string]: string };
    unavailableGuilds: Collection<UnavailableGuild>;
    uptime: number;
    user: ExtendedUser;
    users: Collection<User>;
    voiceConnections: VoiceConnectionManager;
    constructor(token: string, options?: ClientOptions);
    addGuildMember(guildID: string, userID: string, accessToken: string, options?: AddGuildMemberOptions): Promise<void>;
    addGuildMemberRole(guildID: string, memberID: string, roleID: string, reason?: string): Promise<void>;
    addMessageReaction(channelID: string, messageID: string, reaction: string): Promise<void>;
    banGuildMember(guildID: string, userID: string, options?: BanMemberOptions): Promise<void>;
    bulkBanGuildMembers(guildID: string, userIDs: string[], options?: BanMemberOptions): Promise<BulkGuildMemberBanResult>;
    bulkEditCommands(commands: ApplicationCommandStructure[]): Promise<AnyApplicationCommand<true>[]>;
    bulkEditGuildCommands(guildID: string, commands: ApplicationCommandStructure[]): Promise<AnyApplicationCommand<true>[]>;
    closeVoiceConnection(guildID: string): void;
    connect(): Promise<void>;
    consumeEntitlement(entitlementID: string): Promise<void>;
    createApplicationEmoji(options: EmojiOptions): Promise<Emoji>;
    createAutoModerationRule(guildID: string, rule: CreateAutoModerationRuleOptions): Promise<AutoModerationRule>;
    createChannel(guildID: string, name: string): Promise<TextChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_TEXT"],
      options?: CreateChannelOptions
    ): Promise<TextChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_VOICE"],
      options?: CreateChannelOptions
    ): Promise<TextVoiceChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_CATEGORY"],
      options?: CreateChannelOptions
    ): Promise<CategoryChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_ANNOUNCEMENT"],
      options?: CreateChannelOptions
    ): Promise<NewsChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_STAGE_VOICE"],
      options?: CreateChannelOptions
    ): Promise<StageChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_FORUM"],
      options?: CreateChannelOptions
    ): Promise<ForumChannel>;
    createChannel(
      guildID: string,
      name: string,
      type: Constants["ChannelTypes"]["GUILD_MEDIA"],
      options?: CreateChannelOptions
    ): Promise<MediaChannel>;
    createChannel(
      guildID: string,
      name: string,
      type?: number,
      options?: CreateChannelOptions
    ): Promise<unknown>;
    createChannelInvite(
      channelID: string,
      options?: CreateChannelInviteOptions,
      reason?: string
    ): Promise<Invite<"withoutCount">>;
    createChannelWebhook(
      channelID: string,
      options: { name: string; avatar?: string | null },
      reason?: string
    ): Promise<Webhook>;
    createCommand<T extends ApplicationCommandStructure>(command: T): Promise<ApplicationCommandStructureConversion<T, true>>;
    createGuild(name: string, options?: CreateGuildOptions): Promise<Guild>;
    createGuildCommand<T extends ApplicationCommandStructure>(guildID: string, command: T): Promise<ApplicationCommandStructureConversion<T, true>>;
    createGuildEmoji(guildID: string, options: EmojiOptions, reason?: string): Promise<Emoji>;
    createGuildFromTemplate(code: string, name: string, icon?: string): Promise<Guild>;
    createGuildScheduledEvent<T extends GuildScheduledEventEntityTypes>(guildID: string, event: GuildScheduledEventOptions<T>, reason?: string): Promise<GuildScheduledEvent<T>>;
    createGuildSoundboardSound(guildID: string, sound: GuildSoundboardSoundCreate, reason?: string): Promise<SoundboardSound>;
    createGuildSticker(guildID: string, options: CreateStickerOptions, reason?: string): Promise<Sticker>;
    createGuildTemplate(guildID: string, name: string, description?: string | null): Promise<GuildTemplate>;
    createInteractionResponse<T extends InteractionResponse>(interactionID: string, interactionToken: string, options: T, file?: FileContent | FileContent[]): Promise<T["withResponse"] extends true ? InteractionCallbackResponse<T["type"]> : void>;
    createMessage(channelID: string, content: MessageContent<"hasNonce">): Promise<Message>;
    createRole(guildID: string, options?: RoleOptions, reason?: string): Promise<Role>;
    createRole(guildID: string, options?: Role, reason?: string): Promise<Role>;
    createStageInstance(channelID: string, options: CreateStageInstanceOptions): Promise<StageInstance>;
    createTestEntitlement(options: CreateTestEntitlementOptions): Promise<Entitlement>;
    createThread(channelID: string, options: CreateThreadWithoutMessageOptions): Promise<ThreadChannel>;
    createThreadWithMessage(channelID: string, messageID: string, options: CreateThreadOptions): Promise<NewsThreadChannel | PublicThreadChannel>;
    crosspostMessage(channelID: string, messageID: string): Promise<Message>;
    deleteApplicationEmoji(emojiID: string): Promise<void>;
    deleteAutoModerationRule(guildID: string, ruleID: string, reason?: string): Promise<void>;
    deleteChannel(channelID: string, reason?: string): Promise<void>;
    deleteChannelPermission(channelID: string, overwriteID: string, reason?: string): Promise<void>;
    deleteCommand(commandID: string): Promise<void>;
    deleteGuild(guildID: string): Promise<void>;
    deleteGuildCommand(guildID: string, commandID: string): Promise<void>;
    deleteGuildEmoji(guildID: string, emojiID: string, reason?: string): Promise<void>;
    deleteGuildIntegration(guildID: string, integrationID: string): Promise<void>;
    deleteGuildScheduledEvent(guildID: string, eventID: string): Promise<void>;
    deleteGuildSoundboardSound(guildID: string, soundID: string, reason?: string): Promise<void>;
    deleteGuildSticker(guildID: string, stickerID: string, reason?: string): Promise<void>;
    deleteGuildTemplate(guildID: string, code: string): Promise<GuildTemplate>;
    deleteInvite(inviteID: string, reason?: string): Promise<void>;
    deleteMessage(channelID: string, messageID: string, reason?: string): Promise<void>;
    deleteMessages(channelID: string, messageIDs: string[], reason?: string): Promise<void>;
    deleteRole(guildID: string, roleID: string, reason?: string): Promise<void>;
    deleteStageInstance(channelID: string): Promise<void>;
    deleteTestEntitlement(entitlementID: string): Promise<void>;
    deleteWebhook(webhookID: string, token?: string, reason?: string): Promise<void>;
    deleteWebhookMessage(webhookID: string, token: string, messageID: string, threadID?: string): Promise<void>;
    disconnect(options: { reconnect?: boolean | "auto" }): void;
    editAFK(afk: boolean): void;
    editApplication(options: EditApplicationOptions): Promise<OAuthApplicationInfo>;
    editApplicationEmoji(emojiID: string, options: { name?: string }): Promise<Emoji>;
    editAutoModerationRule(guildID: string, ruleID: string, options: EditAutoModerationRuleOptions): Promise<AutoModerationRule>;
    editChannel(
      channelID: string,
      options: EditChannelOptions,
      reason?: string
    ): Promise<AnyGuildChannel>;
    editChannelPermission(
      channelID: string,
      overwriteID: string,
      allow: bigint | number,
      deny: bigint | number,
      type: PermissionType,
      reason?: string
    ): Promise<void>;
    editChannelPosition(channelID: string, position: number, options?: EditChannelPositionOptions): Promise<void>;
    editChannelPositions(guildID: string, channelPositions: ChannelPosition[]): Promise<void>;
    editCommand<T extends ApplicationCommandStructure>(commandID: string, command: Omit<ApplicationCommandStructure, "type">): Promise<ApplicationCommandStructureConversion<T, true>>;
    editCommandPermissions(guildID: string, commandID: string, permissions: ApplicationCommandPermissions[]): Promise<GuildApplicationCommandPermissions>;
    editGuild(guildID: string, options: GuildOptions, reason?: string): Promise<Guild>;
    editGuildCommand<T extends ApplicationCommandStructure>(guildID: string, commandID: string, command: Omit<T, "type">): Promise<ApplicationCommandStructureConversion<T, true>>;
    editGuildEmoji(
      guildID: string,
      emojiID: string,
      options: { name?: string; roles?: string[] },
      reason?: string
    ): Promise<Emoji>;
    editGuildIntegration(guildID: string, integrationID: string, options: IntegrationOptions): Promise<void>;
    editGuildMember(guildID: string, memberID: string, options: MemberOptions, reason?: string): Promise<Member>;
    editGuildMFALevel(guildID: string, options: EditGuildMFALevelOptions): Promise<MFALevel>;
    editGuildOnboarding(guildID: string, options: EditGuildOnboardingOptions): Promise<GuildOnboarding>;
    editGuildScheduledEvent<T extends GuildScheduledEventEntityTypes>(guildID: string, eventID: string, event: GuildScheduledEventEditOptions<T>, reason?: string): Promise<GuildScheduledEvent<T>>;
    editGuildSoundboardSound(guildID: string, soundID: string, options: GuildSoundboardSoundEdit): Promise<SoundboardSound>;
    editGuildSticker(guildID: string, stickerID: string, options?: EditStickerOptions, reason?: string): Promise<Sticker>;
    editGuildTemplate(guildID: string, code: string, options: GuildTemplateOptions): Promise<GuildTemplate>;
    editGuildVoiceState(guildID: string, options: VoiceStateOptions, userID?: string): Promise<void>;
    editGuildWelcomeScreen(guildID: string, options: WelcomeScreenOptions): Promise<WelcomeScreen>;
    editGuildWidget(guildID: string, options: Partial<Widget> & { reason?: string }): Promise<Widget>;
    editMessage(channelID: string, messageID: string, content: MessageContent): Promise<Message>;
    editRole(guildID: string, roleID: string, options: RoleOptions, reason?: string): Promise<Role>; // TODO not all options are available?
    editRoleConnectionMetadata(metadata: ApplicationRoleConnectionMetadata[]): Promise<ApplicationRoleConnectionMetadata[]>;
    editRolePosition(guildID: string, roleID: string, position: number): Promise<void>;
    editSelf(options: EditSelfOptions): Promise<ExtendedUser>;
    editStageInstance(channelID: string, options: StageInstanceOptions): Promise<StageInstance>;
    editStatus(status: SelfStatus, activities?: ActivityPartial<ActivityType>[] | ActivityPartial<ActivityType>): void;
    editStatus(activities?: ActivityPartial<ActivityType>[] | ActivityPartial<ActivityType>): void;
    editWebhook(
      webhookID: string,
      options: WebhookOptions,
      token?: string,
      reason?: string
    ): Promise<Webhook>;
    editWebhookMessage(
      webhookID: string,
      token: string,
      messageID: string,
      options: MessageWebhookContent
    ): Promise<Message<GuildTextableChannel>>;
    emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
    emit(event: string, ...args: any[]): boolean;
    endPoll(channelID: string, messageID: string): Promise<Message>;
    executeSlackWebhook(webhookID: string, token: string, options: Record<string, unknown> & { auth?: boolean; threadID?: string }): Promise<void>;
    executeSlackWebhook(webhookID: string, token: string, options: Record<string, unknown> & { auth?: boolean; threadID?: string; wait: true }): Promise<Message<GuildTextableChannel>>;
    executeWebhook(webhookID: string, token: string, options: WebhookPayload & { wait: true }): Promise<Message<GuildTextableChannel>>;
    executeWebhook(webhookID: string, token: string, options: WebhookPayload): Promise<void>;
    followChannel(channelID: string, webhookChannelID: string, reason?: string): Promise<ChannelFollow>;
    getActiveGuildThreads(guildID: string): Promise<ListedGuildThreads>;
    getApplication(): Promise<OAuthApplicationInfo>;
    getApplicationEmoji(emojiID: string): Promise<Emoji>;
    getApplicationEmojis(): Promise<Emoji[]>;
    getArchivedThreads(channelID: string, type: "private", options?: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PrivateThreadChannel>>;
    getArchivedThreads(channelID: string, type: "public", options?: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PublicThreadChannel>>;
    getAutoModerationRule(guildID: string, ruleID: string): Promise<AutoModerationRule>;
    getAutoModerationRules(guildID: string): Promise<AutoModerationRule[]>;
    getBotGateway(): Promise<{ session_start_limit: { max_concurrency: number; remaining: number; reset_after: number; total: number }; shards: number; url: string }>;
    getChannel(channelID: string): AnyChannel;
    getChannelInvites(channelID: string): Promise<Invite[]>;
    getChannelWebhooks(channelID: string): Promise<Webhook[]>;
    getCommand<W extends boolean = false, T extends AnyApplicationCommand<W> = AnyApplicationCommand<W>>(commandID: string, withLocalizations?: W): Promise<T>;
    getCommandPermissions(guildID: string, commandID: string): Promise<GuildApplicationCommandPermissions>;
    getCommands<W extends boolean = false>(withLocalizations?: W): Promise<AnyApplicationCommand<W>[]>;
    getDMChannel(userID: string): Promise<PrivateChannel>;
    getEntitlements(options?: GetEntitlementsOptions): Promise<Entitlement[]>;
    getGateway(): Promise<{ url: string }>;
    getGuildAuditLog(guildID: string, options?: GetGuildAuditLogOptions): Promise<GuildAuditLog>;
    getGuildBan(guildID: string, userID: string): Promise<GuildBan>;
    getGuildBans(guildID: string, options?: GetGuildBansOptions): Promise<GuildBan[]>;
    getGuildCommand<W extends boolean = false, T extends AnyApplicationCommand<W> = AnyApplicationCommand<W>>(guildID: string, commandID: string, withLocalizations?: W): Promise<T>;
    getGuildCommandPermissions(guildID: string): Promise<GuildApplicationCommandPermissions[]>;
    getGuildCommands<W extends boolean = false>(guildID: string, withLocalizations?: W): Promise<AnyApplicationCommand<W>[]>;
    getGuildIntegrations(guildID: string): Promise<GuildIntegration[]>;
    getGuildInvites(guildID: string): Promise<Invite[]>;
    getGuildOnboarding(guildID: string): Promise<GuildOnboarding>;
    getGuildPreview(guildID: string): Promise<GuildPreview>;
    getGuildScheduledEvents(guildID: string, options?: GetGuildScheduledEventOptions): Promise<GuildScheduledEvent[]>;
    getGuildScheduledEventUsers(guildID: string, eventID: string, options?: GetGuildScheduledEventUsersOptions): Promise<GuildScheduledEventUser[]>;
    getGuildSoundboardSound(guildID: string, soundID: string): Promise<SoundboardSound>;
    getGuildSoundboardSounds(guildID: string): Promise<SoundboardSound[]>;
    getGuildTemplate(code: string): Promise<GuildTemplate>;
    getGuildTemplates(guildID: string): Promise<GuildTemplate[]>;
    getGuildVanity(guildID: string): Promise<GuildVanity>;
    getGuildWebhooks(guildID: string): Promise<Webhook[]>;
    getGuildWelcomeScreen(guildID: string): Promise<WelcomeScreen>;
    getGuildWidget(guildID: string): Promise<WidgetData>;
    getGuildWidgetSettings(guildID: string): Promise<Widget>;
    getInvite<C extends boolean = false, E extends boolean = false, GSE extends string | undefined = undefined>(inviteID: string, options?: GetInviteOptions<C, E, GSE>): Promise<Invite<(C extends true ? "withCount" : "withoutCount") | (E extends true ? "withExpiration" : "withoutExpiration") | (GSE extends string ? "withGuildScheduledEvent" : never)>>;
    getJoinedPrivateArchivedThreads(channelID: string, options?: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PrivateThreadChannel>>;
    getMessage(channelID: string, messageID: string): Promise<Message>;
    getMessageReaction(channelID: string, messageID: string, reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    getMessages(channelID: string, options?: GetMessagesOptions): Promise<Message[]>;
    /** @deprecated */
    getNitroStickerPacks(): Promise<{ sticker_packs: StickerPack[] }>;
    getOAuthApplication(): Promise<OAuthApplicationInfo>;
    getPins(channelID: string): Promise<Message[]>;
    getPollAnswerVoters(channelID: string, messageID: string, answerID: number, options?: GetPollAnswerVotersOptions): Promise<User[]>;
    getPruneCount(guildID: string, options?: GetPruneOptions): Promise<number>;
    getRESTChannel(channelID: string): Promise<AnyChannel>;
    getRESTGuild(guildID: string, withCounts?: boolean): Promise<Guild>;
    getRESTGuildChannels(guildID: string): Promise<AnyGuildChannel[]>;
    getRESTGuildEmoji(guildID: string, emojiID: string): Promise<Emoji>;
    getRESTGuildEmojis(guildID: string): Promise<Emoji[]>;
    getRESTGuildMember(guildID: string, memberID: string): Promise<Member>;
    getRESTGuildMembers(guildID: string, options?: GetRESTGuildMembersOptions): Promise<Member[]>;
    getRESTGuildRole(guildID: string, roleID: string): Promise<Role>;
    getRESTGuildRoles(guildID: string): Promise<Role[]>;
    getRESTGuilds(options?: GetRESTGuildsOptions): Promise<Guild[]>;
    getRESTGuildScheduledEvent(guildID: string, eventID: string, options?: GetGuildScheduledEventOptions): Promise<GuildScheduledEvent>;
    getRESTGuildSticker(guildID: string, stickerID: string): Promise<Sticker>;
    getRESTGuildStickers(guildID: string): Promise<Sticker[]>;
    getRESTGuildVoiceState(guildID: string, userID?: string): Promise<VoiceState>;
    getRESTSticker(stickerID: string): Promise<Sticker>;
    getRESTUser(userID: string): Promise<User>;
    getRoleConnectionMetadata(): Promise<ApplicationRoleConnectionMetadata[]>;
    getSelf(): Promise<ExtendedUser>;
    getSKUs(): Promise<SKU[]>;
    getSoundboardSounds(): Promise<SoundboardSound<false>[]>;
    getStageInstance(channelID: string): Promise<StageInstance>;
    getStickerPack(packID: string): Promise<StickerPack>;
    getStickerPacks(): Promise<{ sticker_packs: StickerPack[] }>;
    getThreadMember(channelID: string, memberID: string, options: GetThreadMemberOptions): Promise<ThreadMember>;
    getThreadMembers(channelID: string, options: GetThreadMembersOptions): Promise<ThreadMember[]>;
    getVoiceRegions(guildID?: string): Promise<VoiceRegion[]>;
    getWebhook(webhookID: string, token?: string): Promise<Webhook>;
    getWebhookMessage(webhookID: string, token: string, messageID: string): Promise<Message<GuildTextableChannel>>;
    joinThread(channelID: string, userID?: string): Promise<void>;
    joinVoiceChannel(channelID: string, options?: JoinVoiceChannelOptions): Promise<VoiceConnection>;
    kickGuildMember(guildID: string, userID: string, reason?: string): Promise<void>;
    leaveGuild(guildID: string): Promise<void>;
    leaveThread(channelID: string, userID?: string): Promise<void>;
    leaveVoiceChannel(channelID: string): void;
    off<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    pinMessage(channelID: string, messageID: string): Promise<void>;
    pruneMembers(guildID: string, options?: PruneMemberOptions): Promise<number>;
    purgeChannel(channelID: string, options: PurgeChannelOptions): Promise<number>;
    removeGuildMemberRole(guildID: string, memberID: string, roleID: string, reason?: string): Promise<void>;
    removeMessageReaction(channelID: string, messageID: string, reaction: string, userID?: string): Promise<void>;
    removeMessageReactionEmoji(channelID: string, messageID: string, reaction: string): Promise<void>;
    removeMessageReactions(channelID: string, messageID: string): Promise<void>;
    searchGuildMembers(guildID: string, query: string, limit?: number): Promise<Member[]>;
    sendChannelTyping(channelID: string): Promise<void>;
    sendSoundboardSound(channelID: string, options: GuildSoundboardSoundSend): Promise<void>;
    syncGuildIntegration(guildID: string, integrationID: string): Promise<void>;
    syncGuildTemplate(guildID: string, code: string): Promise<GuildTemplate>;
    unbanGuildMember(guildID: string, userID: string, reason?: string): Promise<void>;
    unpinMessage(channelID: string, messageID: string): Promise<void>;
    validateDiscoverySearchTerm(term: string): Promise<{ valid: boolean }>;
    on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    toString(): string;
  }

  export class Collection<T extends { id: string | number }> extends Map<string | number, T> {
    baseObject: new (...args: any[]) => T;
    limit?: number;
    constructor(baseObject: new (...args: any[]) => T, limit?: number);
    add(obj: T, extra?: unknown, replace?: boolean): T;
    every(func: (i: T) => boolean): boolean;
    filter(func: (i: T) => boolean): T[];
    find(func: (i: T) => boolean): T | undefined;
    map<R>(func: (i: T) => R): R[];
    random(): T | undefined;
    reduce<U>(func: (accumulator: U, val: T) => U, initialValue?: U): U;
    remove(obj: T | Uncached): T | null;
    some(func: (i: T) => boolean): boolean;
    update(obj: T, extra?: unknown, replace?: boolean): T;
  }

  export class CommandInteraction extends Interaction {
    data: CommandInteractionData;
    type: Constants["InteractionTypes"]["APPLICATION_COMMAND"];
    acknowledge(flags?: number): Promise<void>;
    createFollowup(content: string | InteractionContent): Promise<Message>;
    createMessage(content: string | InteractionContent): Promise<Message>;
    createModal(content: InteractionModalContent): Promise<void>;
    defer(flags?: number): Promise<void>;
    deleteMessage(messageID: string): Promise<void>;
    deleteOriginalMessage(): Promise<void>;
    editMessage(messageID: string, content: string | InteractionContentEdit): Promise<Message>;
    editOriginalMessage(content: string | InteractionContentEdit): Promise<Message>;
    getOriginalMessage(): Promise<Message>;
    launchActivity(): Promise<ActivityInstance>;
    /** @deprecated */
    requirePremium(): Promise<void>;
  }

  export class ComponentInteraction extends Interaction {
    data: ComponentInteractionButtonData | ComponentInteractionSelectMenuData;
    message: Message;
    type: Constants["InteractionTypes"]["MESSAGE_COMPONENT"];
    acknowledge(): Promise<void>;
    createFollowup(content: string | InteractionContent): Promise<Message>;
    createMessage(content: string | InteractionContent): Promise<Message>;
    createModal(content: InteractionModalContent): Promise<void>;
    defer(flags?: number): Promise<void>;
    deferUpdate(): Promise<void>;
    deleteMessage(messageID: string): Promise<void>;
    deleteOriginalMessage(): Promise<void>;
    editMessage(messageID: string, content: string | InteractionContentEdit): Promise<Message>;
    editOriginalMessage(content: string | InteractionContentEdit): Promise<Message>;
    editParent(content: InteractionContentEdit): Promise<Message>;
    getOriginalMessage(): Promise<Message>;
    launchActivity(): Promise<ActivityInstance>;
    /** @deprecated */
    requirePremium(): Promise<void>;
  }

  export class DiscordHTTPError extends Error {
    code: number;
    headers: IncomingHttpHeaders;
    name: "DiscordHTTPError";
    req: ClientRequest;
    res: IncomingMessage;
    response: HTTPResponse;
    constructor(req: ClientRequest, res: IncomingMessage, response: HTTPResponse, stack: string);
    flattenErrors(errors: HTTPResponse, keyPrefix?: string): string[];
  }

  export class DiscordRESTError extends Error {
    code: number;
    headers: IncomingHttpHeaders;
    name: string;
    req: ClientRequest;
    res: IncomingMessage;
    response: HTTPResponse;
    constructor(req: ClientRequest, res: IncomingMessage, response: HTTPResponse, stack: string);
    flattenErrors(errors: HTTPResponse, keyPrefix?: string): string[];
  }

  export class Entitlement extends Base {
    applicationID: string;
    consumed: boolean;
    deleted: boolean;
    endsAt: number | null;
    guildID?: string;
    skuID: string;
    startsAt: number | null;
    type: EntitlementTypes;
    userID?: string;
    consume(): Promise<void>;
  }

  export class ExtendedUser extends User {
    email?: string | null;
    mfaEnabled?: boolean;
    premiumType?: PremiumTypes;
    verified?: boolean;
  }
  export class ForumChannel extends GuildChannel {
    availableTags: ForumTag[];
    defaultAutoArchiveDuration: number;
    defaultForumLayout: ForumLayoutTypes;
    defaultReactionEmoji: ForumDefaultReactionEmoji | null;
    defaultSortOrder: ThreadSortingOrders | null;
    defaultThreadRateLimitPerUser: number;
    lastThreadID?: string;
    permissionOverwrites: Collection<PermissionOverwrite>;
    rateLimitPerUser: number;
    topic?: string | null;
    type: GuildThreadOnlyChannelTypes;
    createInvite(options?: CreateInviteOptions, reason?: string): Promise<Invite<"withMetadata", this>>;
    createThread(options: CreateThreadWithoutMessageOptions): Promise<PublicThreadChannel>;
    createWebhook(options: Omit<WebhookOptions, "channelID">, reason?: string): Promise<Webhook>;
    getArchivedThreads(type: "public", options?: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PublicThreadChannel>>;
    getInvites(): Promise<(Invite<"withMetadata", this>)[]>;
    getWebhooks(): Promise<Webhook[]>;
  }

  export class GroupChannel extends PrivateChannel {
    icon: string | null;
    iconURL: string | null;
    name: string;
    ownerID: string;
    recipients: Collection<User>;
    type: Constants["ChannelTypes"]["GROUP_DM"];
    dynamicIconURL(format?: ImageFormat, size?: number): string | null;
  }

  export class Guild extends Base {
    afkChannelID: string | null;
    afkTimeout: number;
    applicationID: string | null;
    approximateMemberCount?: number;
    approximatePresenceCount?: number;
    banner: string | null;
    bannerURL: string | null;
    channels: Collection<AnyGuildChannel>;
    createdAt: number;
    defaultNotifications: DefaultNotifications;
    description: string | null;
    discoverySplash: string | null;
    discoverySplashURL: string | null;
    emojis: Emoji[];
    events: Collection<GuildScheduledEvent>;
    explicitContentFilter: ExplicitContentFilter;
    features: GuildFeatures[];
    icon: string | null;
    iconURL: string | null;
    id: string;
    joinedAt: number;
    large: boolean;
    maxMembers: number;
    maxPresences?: number | null;
    maxStageVideoChannelUsers?: number;
    maxVideoChannelUsers?: number;
    memberCount: number;
    members: Collection<Member>;
    mfaLevel: MFALevel;
    name: string;
    nsfwLevel: NSFWLevel;
    ownerID: string;
    preferredLocale: string;
    premiumProgressBarEnabled: boolean;
    premiumSubscriptionCount?: number;
    premiumTier: PremiumTier;
    publicUpdatesChannelID: string | null;
    roles: Collection<Role>;
    rulesChannelID: string | null;
    safetyAlertsChannelID: string | null;
    shard: Shard;
    soundboardSounds: Collection<SoundboardSound>;
    splash: string | null;
    splashURL: string | null;
    stageInstances: Collection<StageInstance>;
    stickers?: Sticker[];
    systemChannelFlags: number;
    systemChannelID: string | null;
    threads: Collection<ThreadChannel>;
    unavailable: boolean;
    vanityURL: string | null;
    verificationLevel: VerificationLevel;
    voiceStates: Collection<VoiceState>;
    welcomeScreen?: WelcomeScreen;
    widgetChannelID?: string | null;
    widgetEnabled?: boolean;
    constructor(data: BaseData, client: Client);
    addMember(userID: string, accessToken: string, options?: AddGuildMemberOptions): Promise<void>;
    addMemberRole(memberID: string, roleID: string, reason?: string): Promise<void>;
    banMember(userID: string, options?: BanMemberOptions): Promise<void>;
    bulkBanMembers(guildID: string, userIDs: string[], options?: BanMemberOptions): Promise<BulkGuildMemberBanResult>;
    bulkEditCommands(commands: ApplicationCommandStructure[]): Promise<AnyApplicationCommand[]>;
    createAutoModerationRule(rule: CreateAutoModerationRuleOptions): Promise<AutoModerationRule>;
    createChannel(name: string): Promise<TextChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_TEXT"], options?: CreateChannelOptions): Promise<TextChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_VOICE"], options?: CreateChannelOptions): Promise<TextVoiceChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_CATEGORY"], options?: CreateChannelOptions): Promise<CategoryChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_ANNOUNCEMENT"], options?: CreateChannelOptions): Promise<NewsChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_STAGE_VOICE"], options?: CreateChannelOptions): Promise<StageChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_FORUM"], options: CreateChannelOptions): Promise<ForumChannel>;
    createChannel(name: string, type: Constants["ChannelTypes"]["GUILD_MEDIA"], options: CreateChannelOptions): Promise<MediaChannel>;
    createChannel(name: string, type?: number, options?: CreateChannelOptions): Promise<unknown>;
    createCommand<T extends ApplicationCommandStructure>(command: T): Promise<ApplicationCommandStructureConversion<T, true>>;
    createEmoji(options: { image: string; name: string; roles?: string[] }, reason?: string): Promise<Emoji>;
    createRole(options: RoleOptions, reason?: string): Promise<Role>;
    createRole(options: Role, reason?: string): Promise<Role>;
    createScheduledEvent<T extends GuildScheduledEventEntityTypes>(event: GuildScheduledEventOptions<T>, reason?: string): Promise<GuildScheduledEvent<T>>;
    createSoundboardSound(sound: GuildSoundboardSoundCreate, reason?: string): Promise<SoundboardSound>;
    createSticker(options: CreateStickerOptions, reason?: string): Promise<Sticker>;
    createTemplate(name: string, description?: string | null): Promise<GuildTemplate>;
    delete(): Promise<void>;
    deleteAutoModerationRule(ruleID: string, reason?: string): Promise<void>;
    deleteCommand(commandID: string): Promise<void>;
    deleteEmoji(emojiID: string, reason?: string): Promise<void>;
    deleteIntegration(integrationID: string): Promise<void>;
    deleteRole(roleID: string): Promise<void>;
    deleteScheduledEvent(eventID: string): Promise<void>;
    deleteSoundboardSound(soundID: string, reason?: string): Promise<void>;
    deleteSticker(stickerID: string, reason?: string): Promise<void>;
    deleteTemplate(code: string): Promise<GuildTemplate>;
    dynamicBannerURL(format?: ImageFormat, size?: number): string | null;
    dynamicDiscoverySplashURL(format?: ImageFormat, size?: number): string | null;
    dynamicIconURL(format?: ImageFormat, size?: number): string | null;
    dynamicSplashURL(format?: ImageFormat, size?: number): string | null;
    edit(options: GuildOptions, reason?: string): Promise<Guild>;
    editAutoModerationRule(ruleID: string, options: EditAutoModerationRuleOptions): Promise<AutoModerationRule>;
    editChannelPositions(channelPositions: ChannelPosition[]): Promise<void>;
    editCommand<T extends ApplicationCommandStructure>(commandID: string, command: Omit<T, "type">): Promise<ApplicationCommandStructureConversion<T, true>>;
    editCommandPermissions(permissions: ApplicationCommandPermissions[]): Promise<GuildApplicationCommandPermissions[]>;
    editEmoji(emojiID: string, options: { name: string; roles?: string[] }, reason?: string): Promise<Emoji>;
    editIntegration(integrationID: string, options: IntegrationOptions): Promise<void>;
    editMember(memberID: string, options: MemberOptions, reason?: string): Promise<Member>;
    editMFALevel(options: EditGuildMFALevelOptions): Promise<MFALevel>;
    editOnboarding(options: EditGuildOnboardingOptions): Promise<GuildOnboarding>;
    editRole(roleID: string, options: RoleOptions): Promise<Role>;
    editScheduledEvent<T extends GuildScheduledEventEntityTypes>(eventID: string, event: GuildScheduledEventEditOptions<T>, reason?: string): Promise<GuildScheduledEvent<T>>;
    editSticker(stickerID: string, options?: EditStickerOptions, reason?: string): Promise<Sticker>;
    editTemplate(code: string, options: GuildTemplateOptions): Promise<GuildTemplate>;
    editVoiceState(options: VoiceStateOptions, userID?: string): Promise<void>;
    editWelcomeScreen(options: WelcomeScreenOptions): Promise<WelcomeScreen>;
    editWidget(options: Partial<Widget> & { reason?: string }): Promise<Widget>;
    fetchMembers(options?: FetchMembersOptions): Promise<Member[]>;
    fetchSoundboardSounds(options?: Omit<RequestGuildSoundboardSoundsOptions, "guildIDs">): Promise<SoundboardSound[]>;
    getActiveThreads(): Promise<ListedGuildThreads>;
    getAuditLog(options?: GetGuildAuditLogOptions): Promise<GuildAuditLog>;
    getAutoModerationRule(guildID: string, ruleID: string): Promise<AutoModerationRule>;
    getAutoModerationRules(guildID: string): Promise<AutoModerationRule[]>;
    getBan(userID: string): Promise<GuildBan>;
    getBans(options?: GetGuildBansOptions): Promise<GuildBan[]>;
    getCommand<W extends boolean = false, T extends AnyApplicationCommand<W> = AnyApplicationCommand<W>>(commandID: string, withLocalizations?: W): Promise<T>;
    getCommandPermissions(): Promise<GuildApplicationCommandPermissions[]>;
    getCommands<W extends boolean = false>(): Promise<AnyApplicationCommand<W>[]>;
    getIntegrations(): Promise<GuildIntegration>;
    getInvites(): Promise<Invite[]>;
    getOnboarding(): Promise<GuildOnboarding>;
    getPruneCount(options?: GetPruneOptions): Promise<number>;
    getRESTChannels(): Promise<AnyGuildChannel[]>;
    getRESTEmoji(emojiID: string): Promise<Emoji>;
    getRESTEmojis(): Promise<Emoji[]>;
    getRESTMember(memberID: string): Promise<Member>;
    getRESTMembers(options?: GetRESTGuildMembersOptions): Promise<Member[]>;
    getRESTRole(roleID: string): Promise<Role>;
    getRESTRoles(): Promise<Role[]>;
    getRESTScheduledEvent(eventID: string): Promise<GuildScheduledEvent>;
    getRESTSticker(stickerID: string): Promise<Sticker>;
    getRESTStickers(): Promise<Sticker[]>;
    getRESTVoiceState(userID?: string): Promise<VoiceState>;
    getScheduledEvents(options?: GetGuildScheduledEventOptions): Promise<GuildScheduledEvent[]>;
    getScheduledEventUsers(eventID: string, options?: GetGuildScheduledEventUsersOptions): Promise<GuildScheduledEventUser[]>;
    getSoundboardSound(soundID: string): Promise<SoundboardSound>;
    getSoundboardSounds(): Promise<SoundboardSound[]>;
    getTemplates(): Promise<GuildTemplate[]>;
    getVanity(): Promise<GuildVanity>;
    getVoiceRegions(): Promise<VoiceRegion[]>;
    getWebhooks(): Promise<Webhook[]>;
    getWelcomeScreen(): Promise<WelcomeScreen>;
    getWidget(): Promise<WidgetData>;
    getWidgetSettings(): Promise<Widget>;
    kickMember(userID: string, reason?: string): Promise<void>;
    leave(): Promise<void>;
    leaveVoiceChannel(): void;
    permissionsOf(memberID: string | Member | MemberRoles): Permission;
    pruneMembers(options?: PruneMemberOptions): Promise<number>;
    removeMemberRole(memberID: string, roleID: string, reason?: string): Promise<void>;
    searchMembers(query: string, limit?: number): Promise<Member[]>;
    syncIntegration(integrationID: string): Promise<void>;
    syncTemplate(code: string): Promise<GuildTemplate>;
    unbanMember(userID: string, reason?: string): Promise<void>;
  }

  export class GuildAuditLogEntry extends Base {
    actionType: number;
    after: { [key: string]: unknown } | null;
    applicationID?: string;
    autoModerationRuleName?: string;
    autoModerationRuleTriggerType?: string;
    before: { [key: string]: unknown } | null;
    channel?: AnyGuildChannel | AnyThreadChannel;
    count?: number;
    deleteMemberDays?: number;
    guild: Guild;
    id: string;
    integrationType?: string;
    member?: Member | Uncached;
    membersRemoved?: number;
    message?: Message<GuildTextableChannel>;
    reason: string | null;
    role?: Role | { id: string; name: string };
    target?: Guild | AnyGuildChannel | AnyThreadChannel | Member | Role | Invite | Emoji | Sticker | StageInstance | User | GuildScheduledEvent | null;
    targetID: string;
    user: User | Uncached;
    constructor(data: BaseData, guild: Guild);
  }

  export class GuildChannel extends Channel {
    flags?: number;
    guild: Guild;
    name: string;
    nsfw: boolean;
    parentID: string | null;
    permissions?: Permission;
    type: GuildChannelTypes;
    constructor(data: BaseData, client: Client);
    delete(reason?: string): Promise<void>;
    deletePermission(overwriteID: string, reason?: string): Promise<void>;
    edit(options: Omit<EditChannelOptions, "icon" | "ownerID">, reason?: string): Promise<this>;
    editPermission(
      overwriteID: string,
      allow: bigint | number,
      deny: bigint | number,
      type: PermissionType,
      reason?: string
    ): Promise<PermissionOverwrite>;
    editPosition(position: number, options?: EditChannelPositionOptions): Promise<void>;
    getInvites(): Promise<Invite[]>;
    permissionsOf(memberID: string | Member | MemberRoles): Permission;
  }

  export class GuildScheduledEvent<T extends GuildScheduledEventEntityTypes = GuildScheduledEventEntityTypes> extends Base {
    channelID: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? null : PossiblyUncachedSpeakableChannel;
    creator?: User;
    description?: string;
    entityID: string | null;
    entityMetadata: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? Required<GuildScheduledEventMetadata> : null;
    entityType: T;
    guild: PossiblyUncachedGuild;
    id: string;
    image?: string;
    name: string;
    privacyLevel: GuildScheduledEventPrivacyLevel;
    scheduledEndTime: T extends Constants["GuildScheduledEventEntityTypes"]["EXTERNAL"] ? number : number | null;
    scheduledStartTime: number;
    status: GuildScheduledEventStatus;
    userCount?: number;
    delete(): Promise<void>;
    edit<U extends GuildScheduledEventEntityTypes>(event: GuildScheduledEventEditOptions<U>, reason?: string): Promise<GuildScheduledEvent<U>>;
    getUsers(options?: GetGuildScheduledEventUsersOptions): Promise<GuildScheduledEventUser[]>;
  }

  export class GuildIntegration extends Base {
    account: { id: string; name: string };
    application?: IntegrationApplication;
    createdAt: number;
    enabled: boolean;
    enableEmoticons?: boolean;
    expireBehavior?: GuildIntegrationExpireBehavior;
    expireGracePeriod?: number;
    guild: Guild;
    id: string;
    name: string;
    revoked?: boolean;
    roleID?: string;
    scopes?: string[];
    subscriberCount?: number;
    syncedAt?: number;
    syncing?: boolean;
    type: GuildIntegrationTypes;
    user?: User;
    constructor(data: BaseData, guild: Guild);
    delete(): Promise<void>;
    edit(options: IntegrationOptions): Promise<void>;
    sync(): Promise<void>;
  }

  export class GuildPreview extends Base {
    approximateMemberCount: number;
    approximatePresenceCount: number;
    description: string | null;
    discoverySplash: string | null;
    discoverySplashURL: string | null;
    emojis: Emoji[];
    features: GuildFeatures[];
    icon: string | null;
    iconURL: string | null;
    id: string;
    name: string;
    splash: string | null;
    splashURL: string | null;
    stickers: Sticker[];
    constructor(data: BaseData, client: Client);
    dynamicDiscoverySplashURL(format?: ImageFormat, size?: number): string | null;
    dynamicIconURL(format?: ImageFormat, size?: number): string | null;
    dynamicSplashURL(format?: ImageFormat, size?: number): string | null;
  }

  export class GuildTemplate {
    code: string;
    createdAt: number;
    creator: User;
    description: string | null;
    isDirty: string | null;
    name: string;
    serializedSourceGuild: Guild;
    sourceGuild: PossiblyUncachedGuild;
    updatedAt: number;
    usageCount: number;
    constructor(data: BaseData, client: Client);
    createGuild(name: string, icon?: string): Promise<Guild>;
    delete(): Promise<GuildTemplate>;
    edit(options: GuildTemplateOptions): Promise<GuildTemplate>;
    sync(): Promise<GuildTemplate>;
    toJSON(props?: string[]): JSONCache;
  }

  export class ApplicationCommand<T extends keyof Constants["ApplicationCommandTypes"] = keyof Constants["ApplicationCommandTypes"], W extends boolean = false> extends Base {
    applicationID: string;
    contexts?: InteractionContextTypes[] | null;
    defaultMemberPermissions?: string | null;
    description: T extends "CHAT_INPUT" ? string : "";
    // despite descriptions not being allowed for user & message, localizations are allowed
    descriptionLocalizations: W extends true ? Record<string, string> | null : Record<string, string> | null | undefined;
    /** @deprecated */
    dmPermission?: boolean;
    handler?: T extends "PRIMARY_ENTRY_POINT" ? ApplicationCommandEntryPointHandlerTypes : never;
    id: string;
    integrationTypes?: ApplicationIntegrationTypes[];
    name: string;
    nameLocalizations: W extends true ? Record<string, string> | null : Record<string, string> | null | undefined;
    nsfw?: boolean;
    options?: ApplicationCommandOptions[];
    type: Constants["ApplicationCommandTypes"][T];
    version: string;
    delete(): Promise<void>;
    edit(options: Omit<T extends "CHAT_INPUT" ?
      ChatInputApplicationCommandStructure : T extends "USER" ?
        UserApplicationCommandStructure : T extends "MESSAGE" ?
          MessageApplicationCommandStructure : T extends "PRIMARY_ENTRY_POINT" ?
            PrimaryEntryPointApplicationCommandStructure : never, "type">): Promise<this>;
  }
  export class Interaction extends Base {
    acknowledged: boolean;
    applicationID: string;
    appPermissions?: Permission;
    authorizingIntegrationOwners: Record<ApplicationIntegrationTypes, string>;
    channel?: PossiblyUncachedInteractionChannel;
    context?: InteractionContextTypes;
    data?: unknown;
    entitlements: Entitlement[];
    guild?: PossiblyUncachedInteractionGuild;
    /** @deprecated */
    guildID?: string;
    /** @deprecated */
    guildLocale?: string;
    id: string;
    locale: string;
    member?: Member;
    token: string;
    type: number;
    user?: User;
    version: number;
    static from(data: BaseData): AnyInteraction;
  }

  export class InteractionMetadata extends Base {
    authorizingIntegrationOwners: Record<ApplicationIntegrationTypes, string>;
    interactedMessageID?: string;
    originalResponseMessageID?: string;
    triggeringInteractionMetadata?: InteractionMetadata;
    type: InteractionTypes;
    user: User;
  }

  // If CT (count) is "withMetadata", it will not have count properties
  export class Invite<CT extends "withMetadata" | "withCount" | "withoutCount" | "withExpiration" | "withoutExpiration" | "withGuildScheduledEvent" = "withMetadata", CH extends InviteChannel = InviteChannel> extends Base {
    channel: CH | null;
    code: string;
    // @ts-ignore: Property is only not null when invite metadata is supplied
    createdAt: CT extends "withMetadata" ? number : null;
    expiresAt?: CT extends "withMetadata" | "withoutExpiration" ? never : number;
    guild: CT extends "withMetadata"
      ? Guild // Invite with Metadata always has guild prop
      : CH extends Exclude<InviteChannel, InvitePartialChannel> // Invite without Metadata
        ? Guild // If the invite channel is not partial
        : Guild | undefined; // If the invite channel is partial

    // The event might not get included if not valid
    guildScheduledEvent: CT extends "withGuildScheduledEvent" ? GuildScheduledEvent | undefined : never;
    inviter?: User;
    maxAge: CT extends "withMetadata" ? number : null;
    maxUses: CT extends "withMetadata" ? number : null;
    memberCount: CT extends "withMetadata" | "withoutCount" ? null : number;
    presenceCount: CT extends "withMetadata" | "withoutCount" ? null : number;
    /** @deprecated */
    stageInstance: CH extends StageChannel ? InviteStageInstance : null;
    targetApplication?: OAuthApplicationInfo;
    targetType?: InviteTargetTypes;
    targetUser?: User;
    temporary: CT extends "withMetadata" ? boolean : null;
    type: InviteTypes;
    uses: CT extends "withMetadata" ? number : null;
    constructor(data: BaseData, client: Client);
    delete(reason?: string): Promise<void>;
  }

  export class Member extends Base implements Presence {
    accentColor?: number | null;
    activities?: Activity[];
    avatar: string | null;
    avatarDecorationData?: AvatarDecorationData | null;
    avatarDecorationURL: string | null;
    avatarURL: string;
    banner?: string | null;
    bannerURL: string | null;
    bot: boolean;
    clientStatus?: ClientStatus;
    communicationDisabledUntil: number | null;
    createdAt: number;
    defaultAvatar: string;
    defaultAvatarURL: string;
    discriminator: string;
    flags: number;
    game: Activity | null;
    guild: Guild;
    id: string;
    joinedAt: number | null;
    mention: string;
    nick: string | null;
    pending?: boolean;
    permissions: Permission;
    premiumSince?: number | null;
    roles: string[];
    staticAvatarURL: string;
    status?: Status;
    user: User;
    username: string;
    voiceState: VoiceState;
    constructor(data: BaseData, guild?: Guild, client?: Client);
    addRole(roleID: string, reason?: string): Promise<void>;
    ban(options?: BanMemberOptions): Promise<void>;
    dynamicAvatarURL(format?: ImageFormat, size?: number): string;
    dynamicBannerURL(format?: ImageFormat, size?: number): string | null;
    edit(options: MemberOptions, reason?: string): Promise<void>;
    kick(reason?: string): Promise<void>;
    removeRole(roleID: string, reason?: string): Promise<void>;
    unban(reason?: string): Promise<void>;
  }

  export class MediaChannel extends ForumChannel {
    type: Constants["ChannelTypes"]["GUILD_MEDIA"];
  }

  export class Message<T extends PossiblyUncachedTextable = TextableChannel, U extends "isSnapshot" | "" = ""> extends Base {
    activity?: MessageActivity;
    application?: MessageApplication;
    applicationID?: string;
    attachments: Collection<Attachment>;
    author: U extends "isSnapshot" ? (User | undefined) : User;
    call?: MessageCall;
    channel: T;
    channelMentions: string[];
    /** @deprecated */
    cleanContent: string;
    components?: Component[];
    content: string;
    createdAt: number;
    crosspostedChannelMentions?: CrosspostedChannelMention[];
    editedTimestamp?: number;
    embeds: Embed[];
    flags: number;
    guildID: T extends GuildTextableWithThreads ? string : undefined;
    id: string;
    /** @deprecated */
    interaction: MessageInteraction | null;
    interactionMetadata?: InteractionMetadata;
    jumpLink: string;
    member: T extends GuildTextableWithThreads ? Member : null;
    mentionEveryone: boolean;
    mentions: User[];
    messageReference: MessageReference | null;
    messageSnapshots?: MessageSnapshot[];
    nonce?: string | number;
    pinned: boolean;
    poll?: Poll;
    position?: number;
    reactions: { [s: string]: { burstColors: string[]; count: number; countDetails: { burst: number; normal: number }; me: boolean; meBurst: boolean } };
    referencedMessage?: Message | null;
    roleMentions: string[];
    roleSubscriptionData?: RoleSubscriptionData;
    stickerItems?: StickerItem[];
    thread?: AnyThreadChannel;
    timestamp: number;
    tts: boolean;
    type: number;
    webhookID: T extends GuildTextableWithThreads ? string | undefined : undefined;
    constructor(data: BaseData, client: Client);
    addReaction(reaction: string): Promise<void>;
    createThreadWithMessage(options: CreateThreadOptions): Promise<NewsThreadChannel | PublicThreadChannel>;
    crosspost(): Promise<T extends NewsChannel ? Message<NewsChannel> : never>;
    delete(reason?: string): Promise<void>;
    deleteWebhook(token: string): Promise<void>;
    edit(content: MessageContent): Promise<Message<T>>;
    editWebhook(token: string, options: MessageWebhookContent): Promise<Message<T>>;
    endPoll(): Promise<Message<T>>;
    getPollAnswerVoters(answerID: number, options?: GetPollAnswerVotersOptions): Promise<User[]>;
    getReaction(reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    pin(): Promise<void>;
    removeReaction(reaction: string, userID?: string): Promise<void>;
    removeReactionEmoji(reaction: string): Promise<void>;
    removeReactions(): Promise<void>;
    unpin(): Promise<void>;
  }

  export class ModalSubmitInteraction extends Interaction {
    data: ModalSubmitInteractionData;
    type: Constants["InteractionTypes"]["MODAL_SUBMIT"];
    acknowledge(): Promise<void>;
    createFollowup(content: string | InteractionContent): Promise<Message>;
    createMessage(content: string | InteractionContent): Promise<Message>;
    defer(flags?: number): Promise<void>;
    deferUpdate(): Promise<void>;
    deleteMessage(messageID: string): Promise<void>;
    deleteOriginalMessage(): Promise<void>;
    editMessage(messageID: string, content: string | InteractionContentEdit): Promise<Message>;
    editOriginalMessage(content: string | InteractionContentEdit): Promise<Message>;
    editParent(content: InteractionContentEdit): Promise<Message>;
    getOriginalMessage(): Promise<Message>;
    launchActivity(): Promise<ActivityInstance>;
    /** @deprecated */
    requirePremium(): Promise<void>;
  }

  // News channel rate limit is always 0
  export class NewsChannel extends TextChannel implements GuildPinnable {
    rateLimitPerUser: 0;
    type: Constants["ChannelTypes"]["GUILD_ANNOUNCEMENT"];
    createInvite(options?: CreateInviteOptions, reason?: string): Promise<Invite<"withMetadata", this>>;
    createMessage(content: MessageContent<"hasNonce">): Promise<Message<this>>;
    createThreadWithMessage(messageID: string, options: CreateThreadOptions): Promise<NewsThreadChannel>;
    crosspostMessage(messageID: string): Promise<Message<this>>;
    editMessage(messageID: string, content: MessageContent): Promise<Message<this>>;
    follow(webhookChannelID: string, reason?: string): Promise<ChannelFollow>;
    getInvites(): Promise<(Invite<"withMetadata", this>)[]>;
    getMessage(messageID: string): Promise<Message<this>>;
    getMessages(options?: GetMessagesOptions): Promise<Message<this>[]>;
    getPins(): Promise<Message<this>[]>;
  }

  export class NewsThreadChannel extends ThreadChannel {
    type: Constants["ChannelTypes"]["ANNOUNCEMENT_THREAD"];
  }

  export class Permission extends Base {
    allow: bigint;
    deny: bigint;
    json: Record<keyof Constants["Permissions"], boolean>;
    constructor(allow: number | string | bigint, deny?: number | string | bigint);
    has(permission: keyof Constants["Permissions"] | bigint): boolean;
  }

  export class PermissionOverwrite extends Permission {
    id: string;
    type: PermissionType;
    constructor(data: Overwrite);
  }

  export class PingInteraction extends Interaction {
    type: Constants["InteractionTypes"]["PING"];
    acknowledge(): Promise<void>;
    pong(): Promise<void>;
  }

  export class Piper extends EventEmitter {
    converterCommand: ConverterCommand;
    dataPacketCount: number;
    encoding: boolean;
    libopus: boolean;
    opus: OpusScript | null;
    opusFactory: () => OpusScript;
    volumeLevel: number;
    constructor(converterCommand: string, opusFactory: OpusScript);
    addDataPacket(packet: unknown): void;
    encode(source: string | Stream, options: VoiceResourceOptions): boolean;
    getDataPacket(): Buffer;
    reset(): void;
    resetPackets(): void;
    setVolume(volume: number): void;
    stop(e: Error, source: Duplex): void;
  }

  export class PrivateChannel extends Channel implements Textable, Pinnable {
    lastMessageID: string;
    messages: Collection<Message<this>>;
    recipient: User;
    type: PrivateChannelTypes;
    addMessageReaction(messageID: string, reaction: string): Promise<void>;
    createMessage(content: MessageContent<"hasNonce">): Promise<Message<this>>;
    deleteMessage(messageID: string, reason?: string): Promise<void>;
    editMessage(messageID: string, content: MessageContent): Promise<Message<this>>;
    getMessage(messageID: string): Promise<Message<this>>;
    getMessageReaction(messageID: string, reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    getMessages(options?: GetMessagesOptions): Promise<Message<this>[]>;
    getPins(): Promise<Message<this>[]>;
    leave(): Promise<void>;
    pinMessage(messageID: string): Promise<void>;
    removeMessageReaction(messageID: string, reaction: string): Promise<void>;
    sendTyping(): Promise<void>;
    unpinMessage(messageID: string): Promise<void>;
    unsendMessage(messageID: string): Promise<void>;
  }

  export class PrivateThreadChannel extends ThreadChannel {
    threadMetadata: PrivateThreadMetadata;
    type: Constants["ChannelTypes"]["PRIVATE_THREAD"];
  }

  export class PublicThreadChannel extends ThreadChannel {
    type: GuildPublicThreadChannelTypes;
    edit(options: Pick<EditChannelOptions, "archived" | "autoArchiveDuration" | "locked" | "name" | "rateLimitPerUser">, reason?: string): Promise<this>;
  }

  export class RequestHandler implements SimpleJSON {
    globalBlock: boolean;
    latencyRef: LatencyRef;
    options: RequestHandlerOptions;
    ratelimits: { [route: string]: SequentialBucket };
    readyQueue: (() => void)[];
    userAgent: string;
    constructor(client: Client, options?: RequestHandlerOptions);
    globalUnblock(): void;
    request(method: RequestMethod, url: string, auth?: boolean, body?: { [s: string]: unknown }, file?: FileContent, _route?: string, short?: boolean): Promise<unknown>;
    routefy(url: string, method: RequestMethod): string;
    toString(): string;
    toJSON(props?: string[]): JSONCache;
  }

  export class Role extends Base {
    color: number;
    createdAt: number;
    flags: number;
    guild: Guild;
    hoist: boolean;
    icon: string | null;
    iconURL: string | null;
    id: string;
    json: Partial<Record<Exclude<keyof Constants["Permissions"], "all" | "allGuild" | "allText" | "allVoice">, boolean>>;
    managed: boolean;
    mention: string;
    mentionable: boolean;
    name: string;
    permissions: Permission;
    position: number;
    tags?: RoleTags;
    unicodeEmoji: string | null;
    constructor(data: BaseData, guild: Guild);
    delete(reason?: string): Promise<void>;
    edit(options: RoleOptions, reason?: string): Promise<Role>;
    editPosition(position: number): Promise<void>;
  }

  export class SequentialBucket {
    latencyRef: LatencyRef;
    limit: number;
    processing: boolean;
    remaining: number;
    reset: number;
    constructor(limit: number, latencyRef?: LatencyRef);
    check(override?: boolean): void;
    queue(func: (cb: () => void) => void, short?: boolean): void;
  }

  export class Shard extends EventEmitter implements SimpleJSON {
    client: Client;
    connectAttempts: number;
    connecting: boolean;
    connectTimeout: NodeJS.Timeout | null;
    discordServerTrace?: string[];
    getAllUsersCount: { [guildID: string]: boolean };
    globalBucket: Bucket;
    guildCreateTimeout: NodeJS.Timeout | null;
    heartbeatInterval: NodeJS.Timeout | null;
    id: number;
    lastHeartbeatAck: boolean;
    lastHeartbeatReceived: number | null;
    lastHeartbeatSent: number | null;
    latency: number;
    preReady: boolean;
    presence: ClientPresence;
    presenceUpdateBucket: Bucket;
    ready: boolean;
    reconnectInterval: number;
    requestMembersPromise: Record<string, RequestMembersPromise>;
    requestSoundboardSoundsPromise: Record<string, RequestSoundboardSoundsPromise>;
    resumeURL: string | null;
    seq: number;
    sessionID: string | null;
    status: "connecting" | "disconnected" | "handshaking" | "identifying" | "ready" | "resuming";
    ws: WebSocket | BrowserWebSocket | null;
    constructor(id: number, client: Client);
    checkReady(): void;
    connect(): void;
    createGuild(_guild: Guild): Guild;
    disconnect(options?: { reconnect?: boolean | "auto" }, error?: Error): void;
    editAFK(afk: boolean): void;
    editStatus(status: SelfStatus, activities?: ActivityPartial<ActivityType>[] | ActivityPartial<ActivityType>): void;
    editStatus(activities?: ActivityPartial<ActivityType>[] | ActivityPartial<ActivityType>): void;
    // @ts-ignore: Method override
    emit(event: string, ...args: any[]): void;
    emit<K extends keyof ShardEvents>(event: K, ...args: ShardEvents[K]): boolean;
    emit(event: string, ...args: any[]): boolean;
    hardReset(): void;
    heartbeat(normal?: boolean): void;
    identify(): void;
    initializeWS(): void;
    off<K extends keyof ShardEvents>(event: K, listener: (...args: ShardEvents[K]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    once<K extends keyof ShardEvents>(event: K, listener: (...args: ShardEvents[K]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    onPacket(packet: RawPacket): void;
    requestGuildMembers(guildID: string, options?: FetchMembersOptions): Promise<Member[]>;
    requestGuildSoundboardSounds(options: RequestGuildSoundboardSoundsOptions): Promise<Record<string, SoundboardSound[]>>;
    reset(): void;
    restartGuildCreateTimeout(): void;
    resume(): void;
    sendStatusUpdate(): void;
    sendWS(op: number, _data: Record<string, unknown>, priority?: boolean): void;
    wsEvent(packet: Required<RawPacket>): void;
    on<K extends keyof ShardEvents>(event: K, listener: (...args: ShardEvents[K]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    toJSON(props?: string[]): JSONCache;
  }

  export class ShardManager extends Collection<Shard> implements SimpleJSON {
    buckets: Map<number, number>;
    connectQueue: Shard[];
    connectTimeout: NodeJS.Timer | null;
    lastConnect: number;
    options: GatewayOptions;
    constructor(client: Client, options?: GatewayOptions);
    connect(shard: Shard): void;
    spawn(id: number): void;
    tryConnect(): void;
    toString(): string;
    toJSON(props?: string[]): JSONCache;
  }

  export class SharedStream extends EventEmitter {
    bitrate: number;
    channels: number;
    current?: VoiceStreamCurrent;
    ended: boolean;
    frameDuration: number;
    piper: Piper;
    playing: boolean;
    samplingRate: number;
    speaking: boolean;
    voiceConnections: Collection<VoiceConnection>;
    volume: number;
    add(connection: VoiceConnection): void;
    emit<K extends keyof StreamEvents>(event: K, ...args: StreamEvents[K]): boolean;
    emit(event: string, ...args: any[]): boolean;
    off<K extends keyof StreamEvents>(event: K, listener: (...args: StreamEvents[K]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    once<K extends keyof StreamEvents>(event: K, listener: (...args: StreamEvents[K]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    play(resource: ReadableStream | string, options?: VoiceResourceOptions): void;
    remove(connection: VoiceConnection): void;
    setSpeaking(value: boolean): void;
    setVolume(volume: number): void;
    stopPlaying(): void;
    on<K extends keyof StreamEvents>(event: K, listener: (...args: StreamEvents[K]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export class SoundboardSound<G = true> extends Base {
    available: G extends false ? true : boolean;
    emojiID: G extends false ? null : string | null;
    emojiName: G extends false ? string : string | null;
    guild: G extends false ? never : PossiblyUncachedGuild;
    name: string;
    user: G extends false ? never : User | undefined;
    volume: number;
    constructor(data: BaseData, client: Client);
    delete(reason?: string): Promise<void>;
    edit(options: GuildSoundboardSoundEdit): Promise<SoundboardSound>;
    send(channelID: string): Promise<void>;
  }

  export class StageChannel extends TextVoiceChannel {
    topic?: string;
    type: Constants["ChannelTypes"]["GUILD_STAGE_VOICE"];
    createInstance(options: CreateStageInstanceOptions): Promise<StageInstance>;
    deleteInstance(): Promise<void>;
    editInstance(options: StageInstanceOptions): Promise<StageInstance>;
    getInstance(): Promise<StageInstance>;
  }

  export class StageInstance extends Base {
    channel: StageChannel | Uncached;
    client: Client;
    /** @deprecated */
    discoverableDisabled: boolean;
    guild: PossiblyUncachedGuild;
    guildScheduledEvent: PossiblyUncachedGuildScheduledEvent;
    privacyLevel: StageInstancePrivacyLevel;
    topic: string;
    constructor(data: BaseData, client: Client);
    delete(): Promise<void>;
    edit(options: StageInstanceOptions): Promise<StageInstance>;
    update(data: BaseData): void;
  }

  export class TextChannel extends GuildChannel implements GuildTextable, Invitable, GuildPinnable {
    defaultAutoArchiveDuration: AutoArchiveDuration;
    lastMessageID: string;
    lastPinTimestamp: number | null;
    messages: Collection<Message<this>>;
    permissionOverwrites: Collection<PermissionOverwrite>;
    position: number;
    rateLimitPerUser: number;
    topic?: string | null;
    type: GuildTextChannelTypes;
    constructor(data: BaseData, client: Client, messageLimit: number);
    addMessageReaction(messageID: string, reaction: string): Promise<void>;
    createInvite(options?: CreateInviteOptions, reason?: string): Promise<Invite<"withMetadata", this>>;
    createMessage(content: MessageContent<"hasNonce">): Promise<Message<this>>;
    createThread(options: CreateThreadWithoutMessageOptions): Promise<ThreadChannel>;
    createThreadWithMessage(messageID: string, options: CreateThreadOptions): Promise<PublicThreadChannel>;
    createWebhook(options: Omit<WebhookOptions, "channelID">, reason?: string): Promise<Webhook>;
    deleteMessage(messageID: string, reason?: string): Promise<void>;
    deleteMessages(messageIDs: string[], reason?: string): Promise<void>;
    edit(options: Omit<EditChannelOptions, "icon" | "ownerID">, reason?: string): Promise<this>;
    editMessage(messageID: string, content: MessageContent): Promise<Message<this>>;
    getArchivedThreads(type: "private", options?: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PrivateThreadChannel>>;
    getArchivedThreads(type: "public", options?: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PublicThreadChannel>>;
    getInvites(): Promise<(Invite<"withMetadata", this>)[]>;
    getJoinedPrivateArchivedThreads(options: GetArchivedThreadsOptions): Promise<ListedChannelThreads<PrivateThreadChannel>>;
    getMessage(messageID: string): Promise<Message<this>>;
    getMessageReaction(messageID: string, reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    getMessages(options?: GetMessagesOptions): Promise<Message<this>[]>;
    getPins(): Promise<Message<this>[]>;
    getWebhooks(): Promise<Webhook[]>;
    pinMessage(messageID: string): Promise<void>;
    purge(options: PurgeChannelOptions): Promise<number>;
    removeMessageReaction(messageID: string, reaction: string, userID?: string): Promise<void>;
    removeMessageReactionEmoji(messageID: string, reaction: string): Promise<void>;
    removeMessageReactions(messageID: string): Promise<void>;
    sendTyping(): Promise<void>;
    unpinMessage(messageID: string): Promise<void>;
    unsendMessage(messageID: string): Promise<void>;
  }

  export class TextVoiceChannel extends VoiceChannel implements GuildTextable {
    lastMessageID: string;
    messages: Collection<Message<this>>;
    rateLimitPerUser: number;
    addMessageReaction(messageID: string, reaction: string): Promise<void>;
    createMessage(content: MessageContent<"hasNonce">): Promise<Message<this>>;
    createWebhook(options: { name: string; avatar?: string | null }, reason?: string): Promise<Webhook>;
    deleteMessage(messageID: string, reason?: string): Promise<void>;
    deleteMessages(messageIDs: string[], reason?: string): Promise<void>;
    editMessage(messageID: string, content: MessageContent): Promise<Message<this>>;
    getMessage(messageID: string): Promise<Message<this>>;
    getMessageReaction(messageID: string, reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    getMessages(options?: GetMessagesOptions): Promise<Message<this>[]>;
    getWebhooks(): Promise<Webhook[]>;
    purge(options: PurgeChannelOptions): Promise<number>;
    removeMessageReaction(messageID: string, reaction: string, userID?: string): Promise<void>;
    removeMessageReactionEmoji(messageID: string, reaction: string): Promise<void>;
    removeMessageReactions(messageID: string): Promise<void>;
    sendTyping(): Promise<void>;
    unsendMessage(messageID: string): Promise<void>;
  }

  export class ThreadChannel extends GuildChannel implements ThreadTextable {
    lastMessageID: string;
    lastPinTimestamp?: number;
    member?: ThreadMember;
    memberCount: number;
    members: Collection<ThreadMember>;
    messageCount: number;
    messages: Collection<Message<this>>;
    ownerID: string;
    rateLimitPerUser: number;
    threadMetadata: ThreadMetadata;
    totalMessageSent: number;
    type: GuildThreadChannelTypes;
    constructor(data: BaseData, client: Client, messageLimit?: number);
    addMessageReaction(messageID: string, reaction: string): Promise<void>;
    createMessage(content: MessageContent<"hasNonce">): Promise<Message<this>>;
    deleteMessage(messageID: string, reason?: string): Promise<void>;
    deleteMessages(messageIDs: string[], reason?: string): Promise<void>;
    edit(options: Pick<EditChannelOptions, "archived" | "autoArchiveDuration" | "invitable" | "locked" | "name" | "rateLimitPerUser">, reason?: string): Promise<this>;
    editMessage(messageID: string, content: MessageContent): Promise<Message<this>>;
    getMember(options: GetThreadMemberOptions): Promise<ThreadMember>;
    getMembers(options: GetThreadMembersOptions): Promise<ThreadMember[]>;
    getMessage(messageID: string): Promise<Message<this>>;
    getMessageReaction(messageID: string, reaction: string, options?: GetMessageReactionOptions): Promise<User[]>;
    getMessages(options?: GetMessagesOptions): Promise<Message<this>[]>;
    getPins(): Promise<Message<this>[]>;
    join(userID?: string): Promise<void>;
    leave(userID?: string): Promise<void>;
    pinMessage(messageID: string): Promise<void>;
    purge(options: PurgeChannelOptions): Promise<number>;
    removeMessageReaction(messageID: string, reaction: string, userID?: string): Promise<void>;
    removeMessageReactionEmoji(messageID: string, reaction: string): Promise<void>;
    removeMessageReactions(messageID: string): Promise<void>;
    sendTyping(): Promise<void>;
    unpinMessage(messageID: string): Promise<void>;
    unsendMessage(messageID: string): Promise<void>;
  }

  export class ThreadMember extends Base {
    flags: number;
    guildMember?: Member;
    joinTimestamp: number;
    threadID: string;
    constructor(data: BaseData, client: Client);
    leave(): Promise<void>;
    update(data: BaseData): void;
  }

  export class UnavailableGuild extends Base {
    createdAt: number;
    id: string;
    shard: Shard;
    unavailable: boolean;
    constructor(data: BaseData, client: Client);
  }

  export class User extends Base {
    accentColor?: number | null;
    avatar: string | null;
    avatarDecorationData?: AvatarDecorationData | null;
    avatarDecorationURL: string | null;
    avatarURL: string;
    banner?: string | null;
    bannerURL: string | null;
    bot: boolean;
    createdAt: number;
    defaultAvatar: string;
    defaultAvatarURL: string;
    discriminator: string;
    globalName: string | null;
    id: string;
    mention: string;
    publicFlags?: number;
    staticAvatarURL: string;
    system: boolean;
    username: string;
    constructor(data: BaseData, client: Client);
    dynamicAvatarURL(format?: ImageFormat, size?: number): string;
    dynamicBannerURL(format?: ImageFormat, size?: number): string | null;
    getDMChannel(): Promise<PrivateChannel>;
  }

  export class VoiceChannel extends GuildChannel implements Invitable {
    bitrate: number;
    permissionOverwrites: Collection<PermissionOverwrite>;
    position: number;
    rtcRegion: string | null;
    type: GuildVoiceChannelTypes;
    userLimit: number;
    videoQualityMode: VideoQualityMode;
    voiceMembers: Collection<Member>;
    createInvite(options?: CreateInviteOptions, reason?: string): Promise<Invite<"withMetadata", VoiceChannel>>;
    getInvites(): Promise<(Invite<"withMetadata", VoiceChannel>)[]>;
    join(options?: JoinVoiceChannelOptions): Promise<VoiceConnection>;
    leave(): void;
    sendSoundboardSound(options: GuildSoundboardSoundSend): Promise<void>;
  }

  export class VoiceConnection extends EventEmitter implements SimpleJSON {
    bitrate: number;
    channelID: string | null;
    channels: number;
    connecting: boolean;
    connectionTimeout: NodeJS.Timeout | null;
    current?: VoiceStreamCurrent | null;
    ended?: boolean;
    endpoint: URL;
    frameDuration: number;
    frameSize: number;
    heartbeatInterval: NodeJS.Timeout | null;
    id: string;
    mode?: string;
    modes?: string;
    /** Optional dependencies OpusScript (opusscript) or OpusEncoder (@discordjs/opus) */
    opus: { [userID: string]: unknown };
    opusOnly: boolean;
    paused: boolean;
    pcmSize: number;
    piper: Piper;
    playing: boolean;
    ready: boolean;
    receiveStreamOpus?: VoiceDataStream | null;
    receiveStreamPCM?: VoiceDataStream | null;
    reconnecting: boolean;
    samplingRate: number;
    secret: Buffer;
    sendHeader: Buffer;
    sendNonce: Buffer;
    sequence: number;
    sessionID?: string;
    shard: Shard | Record<string, never>;
    shared: boolean;
    speaking: boolean;
    ssrc?: number;
    ssrcUserMap: { [s: number]: string };
    timestamp: number;
    token?: string;
    udpIP?: string;
    udpPort?: number;
    udpSocket: DgramSocket | null;
    volume: number;
    ws: BrowserWebSocket | WebSocket | null;
    wsSequence: number;
    constructor(id: string, options?: { shard?: Shard; shared?: boolean; opusOnly?: boolean });
    connect(data: VoiceConnectData): NodeJS.Timer | void;
    disconnect(error?: Error, reconnecting?: boolean): void;
    emit<K extends keyof VoiceEvents>(event: K, ...args: VoiceEvents[K]): boolean;
    emit(event: string, ...args: any[]): boolean;
    heartbeat(): void;
    off<K extends keyof VoiceEvents>(event: K, listener: (...args: VoiceEvents[K]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    once<K extends keyof VoiceEvents>(event: K, listener: (...args: VoiceEvents[K]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    pause(): void;
    play(resource: ReadableStream | string, options?: VoiceResourceOptions): void;
    receive(type: "opus" | "pcm"): VoiceDataStream;
    registerReceiveEventHandler(): void;
    resume(): void;
    sendAudioFrame(frame: Buffer): void;
    sendUDPPacket(packet: Buffer): void;
    sendWS(op: number, data: Record<string, unknown>): void;
    setSpeaking(value: boolean): void;
    setVolume(volume: number): void;
    stopPlaying(): void;
    switchChannel(channelID: string): void;
    updateVoiceState(selfMute: boolean, selfDeaf: boolean): void;
    on<K extends keyof VoiceEvents>(event: K, listener: (...args: VoiceEvents[K]) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    toJSON(props?: string[]): JSONCache;
  }

  export class VoiceConnectionManager<T extends VoiceConnection = VoiceConnection> extends Collection<T> implements SimpleJSON {
    constructor(vcObject: new () => T);
    join(guildID: string, channelID: string, options: VoiceResourceOptions): Promise<VoiceConnection>;
    leave(guildID: string): void;
    switch(guildID: string, channelID: string): void;
    voiceServerUpdate(data: VoiceServerUpdateData): void;
    toJSON(props?: string[]): JSONCache;
  }

  export class VoiceDataStream extends EventEmitter {
    type: "opus" | "pcm";
    constructor(type: string);
    on(event: "data", listener: (data: Buffer, userID: string, timestamp: number, sequence: number) => void): this;
  }

  export class VoiceState extends Base {
    channelID: string | null;
    createdAt: number;
    deaf: boolean;
    id: string;
    mute: boolean;
    requestToSpeakTimestamp: number | null;
    selfDeaf: boolean;
    selfMute: boolean;
    selfStream: boolean;
    selfVideo: boolean;
    sessionID: string | null;
    suppress: boolean;
    constructor(data: BaseData);
  }
}

export = Dysnomia;
