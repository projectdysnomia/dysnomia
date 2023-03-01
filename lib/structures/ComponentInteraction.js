"use strict";

const Interaction = require("./Interaction");
const Member = require("./Member");
const User = require("./User");
const Role = require("./Role");
const Channel = require("./Channel");
const Message = require("./Message");
const Collection = require("../util/Collection");
const Permission = require("./Permission");
const emitDeprecation = require("../util/emitDeprecation");

const {InteractionResponseTypes} = require("../Constants");

/**
* Represents a message component interaction. See Interaction for more properties
* @extends Interaction
* @prop {Permission?} appPermissions The permissions the app or bot has within the channel the interaction was sent from
* @prop {PrivateChannel | TextChannel | NewsChannel} channel The channel the interaction was created in. Can be partial with only the id if the channel is not cached
* @prop {Object} data The data attached to the interaction
* @prop {Number} data.component_type The type of Message Component
* @prop {String} data.custom_id The ID of the Message Component
* @prop {Object?} data.resolved resolved objects within the interaction (e.x. the user for a user option) (select menus only)
* @prop {Collection<Channel>?} data.resolved.channels resolved channels
* @prop {Collection<Member>?} data.resolved.members resolved members
* @prop {Collection<Role>?} data.resolved.roles resolved roles
* @prop {Collection<User>?} data.resolved.users resolved users
* @prop {Array<String>?} data.values The value of the run selected options (Select Menus Only)
* @prop {String?} guildID The ID of the guild in which the interaction was created
* @prop {Member?} member The member who triggered the interaction (This is only sent when the interaction is invoked within a guild)
* @prop {Message?} message The message the interaction came from
* @prop {User?} user The user who triggered the interaction (This is only sent when the interaction is invoked within a dm)
*/
class ComponentInteraction extends Interaction {
    constructor(data, client) {
        super(data, client);

        this.channel = this._client.getChannel(data.channel_id) || {
            id: data.channel_id
        };

        this.data = JSON.parse(JSON.stringify(data.data));

        if(data.data.resolved !== undefined) {
            //Users
            if(data.data.resolved.users !== undefined) {
                const usermap = new Collection(User);
                Object.entries(data.data.resolved.users).forEach(([id, user]) => {
                    usermap.set(id, this._client.users.update(user, client));
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
                        const guild = this._client.guilds.get(data.guild_id);
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
                    channelmap.set(id, Channel.from(channel, this._client) || new Channel(channel, this._client));
                });
                this.data.resolved.channels = channelmap;
            }
        }

        if(data.guild_id !== undefined) {
            this.guildID = data.guild_id;
        }

        if(data.member !== undefined) {
            if(this.channel.guild) {
                data.member.id = data.member.user.id;
                this.member = this.channel.guild.members.update(data.member, this.channel.guild);
            } else {
                const guild = this._client.guilds.get(data.guild_id);
                this.member = guild.members.update(data.member, guild);
            }
        }

        if(data.message !== undefined) {
            this.message = new Message(data.message, this._client);
        }

        if(data.user !== undefined) {
            this.user = this._client.users.update(data.user, client);
        }

        if(data.app_permissions !== undefined) {
            this.appPermissions = new Permission(data.app_permissions);
        }
    }

    /**
    * Acknowledges the interaction with a defer message update response
    * @returns {Promise}
    */
    acknowledge() {
        return this.deferUpdate();
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
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise<Message?>}
    */
    createFollowup(content, file) {
        if(this.acknowledged === false) {
            throw new Error("createFollowup cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
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
        if(file) {
            content.file = file;
        }
        return this._client.executeWebhook.call(this._client, this.applicationID, this.token, Object.assign({wait: true}, content));
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
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise}
    */
    createMessage(content, file) {
        if(this.acknowledged === true) {
            return this.createFollowup(content, file);
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
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }

            if(file) {
                emitDeprecation("CREATE_MESSAGE_FILE");
                this._client.emit("warn", "[DEPRECATED] A file parameter has been passed to createMessage(). This will be removed in future versions.");

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

        const {files, attachments} = this._client._processAttachments(content.attachments);
        content.attachments = attachments;

        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
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
        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
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
        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
            type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                flags: flags || 0
            }
        }).then(() => this.update());
    }

    /**
    * Acknowledges the interaction with a defer message update response
    * Note: You can **not** use more than 1 initial interaction response per interaction
    * @returns {Promise}
    */
    deferUpdate() {
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }
        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
            type: InteractionResponseTypes.DEFERRED_UPDATE_MESSAGE
        }).then(() => this.update());
    }

    /**
    * Delete a message
    * @arg {String} messageID the id of the message to delete, or "@original" for the original response
    * @returns {Promise}
    */
    deleteMessage(messageID) {
        if(this.acknowledged === false) {
            throw new Error("deleteMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
        }
        return this._client.deleteWebhookMessage.call(this._client, this.applicationID, this.token, messageID);
    }

    /**
    * Delete the parent message
    * Warning: Will error with ephemeral messages.
    * @returns {Promise}
    */
    deleteOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("deleteOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
        }
        return this._client.deleteWebhookMessage.call(this._client, this.applicationID, this.token, "@original");
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
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise<Message>}
    */
    editMessage(messageID, content, file) {
        if(this.acknowledged === false) {
            throw new Error("editMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
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
        if(file) {
            content.file = file;
        }
        return this._client.editWebhookMessage.call(this._client, this.applicationID, this.token, messageID, content);
    }

    /**
    * Edit the parent message
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
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise<Message>}
    */
    editOriginalMessage(content, file) {
        if(this.acknowledged === false) {
            throw new Error("editOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
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
        if(file) {
            content.file = file;
        }
        return this._client.editWebhookMessage.call(this._client, this.applicationID, this.token, "@original", content);
    }

    /**
    * Acknowledges the interaction by editing the parent message. If already acknowledged runs editOriginalMessage
    * Note: You can **not** use more than 1 initial interaction response per interaction, use edit if you have already responded with a different interaction response
    * Warning: Will error with ephemeral messages.
    * @arg {String | Object} content What to edit the message with
    * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
    * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
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
    * @arg {Number} [content.flags] A number representing the flags to apply. See [Discord's Documentation](https://discord.com/developers/docs/resources/channel#message-object-message-flags) for a list
    * @arg {Boolean} [content.tts] Set the message TTS flag
    * @arg {Object | Array<Object>} [file] [DEPRECATED] A file object (or an Array of them)
    * @arg {Buffer} file.file A buffer containing file data
    * @arg {String} file.name What to name the file
    * @returns {Promise}
    */
    editParent(content, file) {
        if(this.acknowledged === true) {
            return this.editOriginalMessage(content);
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
                content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
            }
            if(file) {
                emitDeprecation("EDIT_PARENT_FILE");
                this._client.emit("warn", "[DEPRECATED] A file parameter has been passed to createMessage(). This will be removed in future versions.");

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

        const {files, attachments} = this._client._processAttachments(content.attachments);
        content.attachments = attachments;

        return this._client.createInteractionResponse.call(this._client, this.id, this.token, {
            type: InteractionResponseTypes.UPDATE_MESSAGE,
            data: content
        }, files).then(() => this.update());
    }

    /**
    * Get the parent message
    * Warning: Will error with ephemeral messages
    * @returns {Promise<Message>}
    */
    getOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("getOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
        }
        return this._client.getWebhookMessage.call(this._client, this.applicationID, this.token, "@original");
    }

}

module.exports = ComponentInteraction;
