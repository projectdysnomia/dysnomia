"use strict";
/**
 * Import the Client eagerly to allow some of the circularly
 * imported modules to correctly initialize.
 */
const Client = require("./lib/Client.js");

const Dysnomia = {};

Dysnomia.ApplicationCommand = require("./lib/structures/ApplicationCommand");
Dysnomia.Attachment = require("./lib/structures/Attachment");
Dysnomia.AutocompleteInteraction = require("./lib/structures/AutocompleteInteraction");
Dysnomia.AutoModerationRule = require("./lib/structures/AutoModerationRule");
Dysnomia.Base = require("./lib/structures/Base");
Dysnomia.Bucket = require("./lib/util/Bucket");
Dysnomia.CategoryChannel = require("./lib/structures/CategoryChannel");
Dysnomia.Channel = require("./lib/structures/Channel");
Dysnomia.CommandInteraction = require("./lib/structures/CommandInteraction");
Dysnomia.ComponentInteraction = require("./lib/structures/ComponentInteraction");
Dysnomia.Client = Client;
Dysnomia.Collection = require("./lib/util/Collection");
Dysnomia.Constants = require("./lib/Constants");
Dysnomia.DiscordHTTPError = require("./lib/errors/DiscordHTTPError");
Dysnomia.DiscordRESTError = require("./lib/errors/DiscordRESTError");
Dysnomia.Entitlement = require("./lib/structures/Entitlement");
Dysnomia.ExtendedUser = require("./lib/structures/ExtendedUser");
Dysnomia.ForumChannel = require("./lib/structures/ForumChannel");
Dysnomia.GroupChannel = require("./lib/structures/GroupChannel.js");
Dysnomia.Guild = require("./lib/structures/Guild");
Dysnomia.GuildChannel = require("./lib/structures/GuildChannel");
Dysnomia.GuildIntegration = require("./lib/structures/GuildIntegration");
Dysnomia.GuildPreview = require("./lib/structures/GuildPreview");
Dysnomia.GuildScheduledEvent = require("./lib/structures/GuildScheduledEvent");
Dysnomia.GuildTemplate = require("./lib/structures/GuildTemplate");
Dysnomia.Interaction = require("./lib/structures/Interaction");
Dysnomia.InteractionMetadata = require("./lib/structures/InteractionMetadata.js");
Dysnomia.Invite = require("./lib/structures/Invite");
Dysnomia.MediaChannel = require("./lib/structures/MediaChannel");
Dysnomia.Member = require("./lib/structures/Member");
Dysnomia.Message = require("./lib/structures/Message");
Dysnomia.ModalSubmitInteraction = require("./lib/structures/ModalSubmitInteraction.js");
Dysnomia.NewsChannel = require("./lib/structures/NewsChannel");
Dysnomia.NewsThreadChannel = require("./lib/structures/NewsThreadChannel");
Dysnomia.Permission = require("./lib/structures/Permission");
Dysnomia.PermissionOverwrite = require("./lib/structures/PermissionOverwrite");
Dysnomia.PingInteraction = require("./lib/structures/PingInteraction");
Dysnomia.PrivateChannel = require("./lib/structures/PrivateChannel");
Dysnomia.PrivateThreadChannel = require("./lib/structures/PrivateThreadChannel");
Dysnomia.PublicThreadChannel = require("./lib/structures/PublicThreadChannel");
Dysnomia.RequestHandler = require("./lib/rest/RequestHandler");
Dysnomia.Role = require("./lib/structures/Role");
Dysnomia.SequentialBucket = require("./lib/util/SequentialBucket");
Dysnomia.Shard = require("./lib/gateway/Shard");
Dysnomia.SharedStream = require("./lib/voice/SharedStream");
Dysnomia.SKU = require("./lib/structures/SKU.js");
Dysnomia.SoundboardSound = require("./lib/structures/SoundboardSound");
Dysnomia.StageChannel = require("./lib/structures/StageChannel");
Dysnomia.StageInstance = require("./lib/structures/StageInstance");
Dysnomia.Subscription = require("./lib/structures/Subscription.js");
Dysnomia.TextChannel = require("./lib/structures/TextChannel");
Dysnomia.TextVoiceChannel = require("./lib/structures/TextVoiceChannel");
Dysnomia.ThreadChannel = require("./lib/structures/ThreadChannel");
Dysnomia.ThreadMember = require("./lib/structures/ThreadMember");
Dysnomia.UnavailableGuild = require("./lib/structures/UnavailableGuild");
Dysnomia.User = require("./lib/structures/User");
Dysnomia.VERSION = require("./package.json").version;
Dysnomia.VoiceChannel = require("./lib/structures/VoiceChannel");
Dysnomia.VoiceConnection = require("./lib/voice/VoiceConnection");
Dysnomia.VoiceConnectionManager = require("./lib/voice/VoiceConnectionManager");
Dysnomia.VoiceState = require("./lib/structures/VoiceState");

module.exports = Dysnomia;
