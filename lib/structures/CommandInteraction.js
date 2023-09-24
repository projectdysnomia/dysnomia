"use strict";

const Interaction = require("./Interaction");
const Member = require("./Member");
const User = require("./User");
const Role = require("./Role");
const Channel = require("./Channel");
const Message = require("./Message");
const Attachment = require("./Attachment");
const Collection = require("../util/Collection");

const {InteractionResponseTypes} = require("../Constants");

/**
* Represents an application command interaction.
* @extends Interaction
*/
class CommandInteraction extends Interaction {
    /**
     * @override
     * @member {!(PrivateChannel | TextChannel | NewsChannel)} CommandInteraction#channel
     */
    /**
     * The data attached to the interaction
     * @override
     * @member {CommandInteraction.InteractionData} CommandInteraction#data
     */
    #client;
    constructor(data, client) {
        super(data, client);
        this.#client = client;

        if(data.data.resolved !== undefined) {
            //Users
            if(data.data.resolved.users !== undefined) {
                const usermap = new Collection(User);
                Object.entries(data.data.resolved.users).forEach(([id, user]) => {
                    usermap.set(id, this.#client.users.update(user, client));
                });
                this.data.resolved.users = usermap;
            }
            //Members
            if(data.data.resolved.members !== undefined) {
                const membermap = new Collection(Member);
                Object.entries(data.data.resolved.members).forEach(([id, member]) => {
                    member.id = id;
                    member.user = {id};
                    if(this.channel.guild) {
                        membermap.set(id, this.channel.guild.members.update(member, this.channel.guild));
                    } else {
                        const guild = this.#client.guilds.get(data.guild_id);
                        membermap.set(id, guild.members.update(member, guild));
                    }
                });
                this.data.resolved.members = membermap;
            }
            //Roles
            if(data.data.resolved.roles !== undefined) {
                const rolemap = new Collection(Role);
                Object.entries(data.data.resolved.roles).forEach(([id, role]) => {
                    rolemap.set(id, new Role(role, this.channel.guild));
                });
                this.data.resolved.roles = rolemap;
            }
            //Channels
            if(data.data.resolved.channels !== undefined) {
                const channelmap = new Collection(Channel);
                Object.entries(data.data.resolved.channels).forEach(([id, channel]) => {
                    channelmap.set(id, Channel.from(channel, this.#client) || new Channel(channel, this.#client));
                });
                this.data.resolved.channels = channelmap;
            }
            //Messages
            if(data.data.resolved.messages !== undefined) {
                const messagemap = new Collection(Message);
                Object.entries(data.data.resolved.messages).forEach(([id, message]) => {
                    messagemap.set(id, new Message(message, this.#client));
                });
                this.data.resolved.messages = messagemap;
            }
            //Attachments
            if(data.data.resolved.attachments !== undefined) {
                const attachmentsmap = new Collection(Attachment);
                Object.entries(data.data.resolved.attachments).forEach(([id, attachment]) => {
                    attachmentsmap.set(id, new Attachment(attachment));
                });
                this.data.resolved.attachments = attachmentsmap;
            }
        }
    }

    /**
    * Acknowledges the interaction with a defer response
    * Note: You can **not** use more than 1 initial interaction response per interaction.
    * @arg {Number} [flags] A number representing the flags to apply. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @returns {Promise}
    */
    acknowledge(flags) {
        return this.defer(flags);
    }

    /**
    * Respond to the interaction with a followup message
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {Buffer} content.attachments[].file A buffer containing file data
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Array<Object>} [options.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] A number representing the flags to apply. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise<Message?>}
    */
    createFollowup(content) {
        if(this.acknowledged === false) {
            throw new Error("createFollowup cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
        }
        return this.#client.executeWebhook.call(this.#client, this.applicationID, this.token, Object.assign({wait: true}, content));
    }

    /**
    * Acknowledges the interaction with a message. If already acknowledged runs createFollowup
    * @arg {String | Object} content A string or object. If an object is passed:
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
    * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
    * @arg {Array<Object>} [content.attachments] The files to attach to the message
    * @arg {Buffer} content.attachments[].file A buffer containing file data
    * @arg {String} content.attachments[].filename What to name the file
    * @arg {String} [content.attachments[].description] A description for the attachment
    * @arg {Array<Object>} [content.components] An array of components. See [Discord's Documentation](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @arg {String} [content.content] A content string
    * @arg {Array<Object>} [content.embeds] An array of embed objects. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
    * @arg {Number} [content.flags] A number representing the flags to apply. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @returns {Promise}
    */
    createMessage(content) {
        if(this.acknowledged === true) {
            return this.createFollowup(content);
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
                content.allowed_mentions = this.#client._formatAllowedMentions(content.allowedMentions);
            }
        }

        const {files, attachments} = this.#client._processAttachments(content.attachments);
        content.attachments = attachments;

        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.CHANNEL_MESSAGE_WITH_SOURCE,
            data: content
        }, files).then(() => this.update());
    }

    /**
    * Responds to an interaction with a modal
    * @arg {Object} content An object
    * @arg {String} [content.title] The title for the modal, max 45 characters
    * @arg {String} [content.custom_id] The custom identifier for the modal
    * @arg {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
    * @returns {Promise}
    */
    async createModal(content) {
        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.MODAL,
            data: content
        }).then(() => this.update());
    }

    /**
    * Acknowledges the interaction with a defer response
    * Note: You can **not** use more than 1 initial interaction response per interaction.
    * @arg {Number} [flags] A number representing the flags to apply. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @returns {Promise}
    */
    defer(flags) {
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }
        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: flags || 0
            }
        }).then(() => this.update());
    }

    /**
    * Delete a message
    * @arg {String} messageID the id of the message to delete, or "@original" for the original response
    * @returns {Promise}
    */
    deleteMessage(messageID) {
        if(this.acknowledged === false) {
            throw new Error("deleteMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        return this.#client.deleteWebhookMessage.call(this.#client, this.applicationID, this.token, messageID);
    }

    /**
    * Delete the Original message
    * Warning: Will error with ephemeral messages
    * @returns {Promise}
    */
    deleteOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("deleteOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        return this.#client.deleteWebhookMessage.call(this.#client, this.applicationID, this.token, "@original");
    }

    /**
    * Edit a message
    * @arg {String} messageID the id of the message to edit, or "@original" for the original response
    * @arg {Object} content Interaction message edit options
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
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
    * @returns {Promise<Message>}
    */
    editMessage(messageID, content) {
        if(this.acknowledged === false) {
            throw new Error("editMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
        }
        return this.#client.editWebhookMessage.call(this.#client, this.applicationID, this.token, messageID, content);
    }

    /**
    * Edit the Original response message
    * @arg {Object} content Interaction message edit options
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
    * @arg {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
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
    * @returns {Promise<Message>}
    */
    editOriginalMessage(content) {
        if(this.acknowledged === false) {
            throw new Error("editOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            }
        }
        return this.#client.editWebhookMessage.call(this.#client, this.applicationID, this.token, "@original", content);
    }

    /**
    * Get the Original response message
    * Warning: Will error with ephemeral messages
    * @returns {Promise<Message>}
    */
    getOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("getOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, or defer first.");
        }
        return this.#client.getWebhookMessage.call(this.#client, this.applicationID, this.token, "@original");
    }

}

module.exports = CommandInteraction;

/**
 * The data attached to the interaction
 * @typedef CommandInteraction.InteractionData
 * @prop {String} id The ID of the Application Command
 * @prop {String} name The command name
 * @prop {Number} type The [command type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types)
 * @prop {String?} target_id The id the of user or message targetted by a context menu command
 * @prop {CommandInteraction.ResolvedData?} resolved Resolved objects within the interaction (e.x. the user for a user option)
 * @prop {Array<CommandInteraction.CommandOptions>?} options The run Application Command options
 */

/**
 * The run Application Command options
 * @typedef CommandInteraction.CommandOptions
 * @prop {String} name The name of the Application Command option
 * @prop {Number} type The [option type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type)
 * @prop {(String | Number | Boolean)?} value The option value (Mutually exclusive with options)
 * @prop {Array<Object>?} options Sub-options (Mutually exclusive with value, subcommand/subcommandgroup)
 */

/**
 * Resolved objects within the interaction (e.x. the user for a user option)
 * @typedef CommandInteraction.ResolvedData
 * @prop {Collection<Channel>?} channels Resolved channels
 * @prop {Collection<Member>?} members Resolved members
 * @prop {Collection<Message>?} messages Resolved messages
 * @prop {Collection<Role>?} roles Resolved roles
 * @prop {Collection<User>?} users Resolved users
 */
