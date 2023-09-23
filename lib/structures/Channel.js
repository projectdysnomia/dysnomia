"use strict";

const Base = require("./Base");
const {ChannelTypes} = require("../Constants");
const emitDeprecation = require("../util/emitDeprecation");

/**
* Represents a channel. You also probably want to look at CategoryChannel, NewsChannel, PrivateChannel, TextChannel, and TextVoiceChannel.
* @prop {Client} client [DEPRECATED] The client that initialized the channel
* @prop {Number} createdAt Timestamp of the channel's creation
* @prop {String} id The ID of the channel
* @prop {String} mention A string that mentions the channel
* @prop {Number} type The type of the channel
*/
class Channel extends Base {
    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;
        this.type = data.type;
    }

    get client() {
        emitDeprecation("CHANNEL_CLIENT");
        return this.#client;
    }

    get mention() {
        return `<#${this.id}>`;
    }

    static from(data, client) {
        switch(data.type) {
            case ChannelTypes.GUILD_TEXT: {
                return new TextChannel(data, client);
            }
            case ChannelTypes.DM: {
                return new PrivateChannel(data, client);
            }
            case ChannelTypes.GUILD_VOICE: {
                return new TextVoiceChannel(data, client);
            }
            case ChannelTypes.GUILD_CATEGORY: {
                return new CategoryChannel(data, client);
            }
            case ChannelTypes.GUILD_ANNOUNCEMENT: {
                return new NewsChannel(data, client);
            }
            case ChannelTypes.ANNOUNCEMENT_THREAD: {
                return new NewsThreadChannel(data, client);
            }
            case ChannelTypes.PUBLIC_THREAD: {
                return new PublicThreadChannel(data, client);
            }
            case ChannelTypes.PRIVATE_THREAD: {
                return new PrivateThreadChannel(data, client);
            }
            case ChannelTypes.GUILD_STAGE_VOICE: {
                return new StageChannel(data, client);
            }
            case ChannelTypes.GUILD_FORUM: {
                return new ForumChannel(data, client);
            }
            case ChannelTypes.GUILD_MEDIA: {
                return new MediaChannel(data, client);
            }
        }
        if(data.guild_id) {
            if(data.last_message_id !== undefined) {
                client.emit("warn", new Error(`Unknown guild text channel type: ${data.type}\n${JSON.stringify(data)}`));
                return new TextChannel(data, client);
            }
            client.emit("warn", new Error(`Unknown guild channel type: ${data.type}\n${JSON.stringify(data)}`));
            return new GuildChannel(data, client);
        }
        client.emit("warn", new Error(`Unknown channel type: ${data.type}\n${JSON.stringify(data)}`));
        return new Channel(data, client);
    }

    toJSON(props = []) {
        return super.toJSON([
            "type",
            ...props
        ]);
    }
}

module.exports = Channel;

// Circular import
const CategoryChannel = require("./CategoryChannel");
const ForumChannel = require("./ForumChannel");
const GuildChannel = require("./GuildChannel");
const MediaChannel = require("./MediaChannel");
const NewsChannel = require("./NewsChannel");
const NewsThreadChannel = require("./NewsThreadChannel");
const PrivateChannel = require("./PrivateChannel");
const PrivateThreadChannel = require("./PrivateThreadChannel");
const PublicThreadChannel = require("./PublicThreadChannel");
const StageChannel = require("./StageChannel");
const TextChannel = require("./TextChannel");
const TextVoiceChannel = require("./TextVoiceChannel");
