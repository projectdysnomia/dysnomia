"use strict";

const Interaction = require("./Interaction");
const Message = require("./Message");

const {InteractionResponseTypes} = require("../Constants");
const emitDeprecation = require("../util/emitDeprecation");

/**
 * Represents a modal submit interaction.
 * @extends Interaction
 */
class ModalSubmitInteraction extends Interaction {
    /**
     * @override
     * @member {!(PrivateChannel | TextChannel | NewsChannel)} CommandInteraction#channel
     */
    /**
     * The data attached to the interaction
     * @override
     * @member {ModalSubmitInteraction.InteractionData} ModalSubmitInteraction#data
     */

    #client;
    constructor(data, client) {
        super(data, client);
        this.#client = client;
    }

    /**
     * Acknowledges the interaction with a defer message update response
     * @returns {Promise}
     */
    async acknowledge() {
        return this.deferUpdate();
    }

    /**
     * Respond to the interaction with a followup message
     * @param {String | Object} content A string or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {Buffer} content.attachments[].file A buffer containing file data
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} [content.content] A content string
     * @param {Array<Object>} [options.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Number} [content.flags] 64 for Ephemeral
     * @param {Object} [content.poll] A poll object. See [Discord's Documentation](https://discord.com/developers/docs/resources/poll#poll-create-request-object-poll-create-request-object-structure) for object structure
     * @param {Boolean} [content.tts] Set the message TTS flag
     * @returns {Promise<Message?>}
     */
    async createFollowup(content) {
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
        return this.#client.executeWebhook.call(this.#client, this.applicationID, this.token, Object.assign({wait: true}, content));
    }

    /**
     * Acknowledges the interaction with a message. If already acknowledged runs createFollowup
     * @param {String | Object} content A string or object. If an object is passed:
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow
     * @param {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow
     * @param {Array<Object>} [content.attachments] The files to attach to the message
     * @param {Buffer} content.attachments[].file A buffer containing file data
     * @param {String} content.attachments[].filename What to name the file
     * @param {String} [content.attachments[].description] A description for the attachment
     * @param {Array<Object>} [content.components] An array of components. See [the official Discord API documentation entry](https://discord.com/developers/docs/interactions/message-components#what-is-a-component) for object structure
     * @param {String} [content.content] A content string
     * @param {Array<Object>} [content.embeds] An array of embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
     * @param {Boolean} [content.flags] 64 for Ephemeral
     * @param {Object} [content.poll] A poll object. See [Discord's Documentation](https://discord.com/developers/docs/resources/poll#poll-create-request-object-poll-create-request-object-structure) for object structure
     * @param {Boolean} [content.tts] Set the message TTS flag
     * @returns {Promise<Message>}
     */
    async createMessage(content) {
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
            data: content,
            withResponse: true
        }, files).then((resp) => {
            this.update();
            return new Message(resp.resource.message, this.#client);
        });
    }

    /**
     * Acknowledges the interaction with a defer response
     * Note: You can **not** use more than 1 initial interaction response per interaction
     * @param {Number} [flags] 64 for Ephemeral
     * @returns {Promise}
     */
    async defer(flags) {
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
     * Acknowledges the interaction with a defer message update response
     * Note: You can **not** use more than 1 initial interaction response per interaction
     * @returns {Promise}
     */
    async deferUpdate() {
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }
        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.DEFERRED_UPDATE_MESSAGE
        }).then(() => this.update());
    }

    /**
     * Delete a message
     * @param {String} messageID the id of the message to delete, or "@original" for the original response
     * @returns {Promise}
     */
    async deleteMessage(messageID) {
        if(this.acknowledged === false) {
            throw new Error("deleteMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
        }
        return this.#client.deleteWebhookMessage.call(this.#client, this.applicationID, this.token, messageID);
    }

    /**
     * Delete the parent message
     * Warning: Will error with ephemeral messages
     * @returns {Promise}
     */
    async deleteOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("deleteOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
        }
        return this.#client.deleteWebhookMessage.call(this.#client, this.applicationID, this.token, "@original");
    }

    /**
     * Edit a message
     * @param {String} messageID the id of the message to edit, or "@original" for the original response
     * @param {Object} content Interaction message edit options
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
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
     * @returns {Promise<Message>}
     */
    async editMessage(messageID, content) {
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
        return this.#client.editWebhookMessage.call(this.#client, this.applicationID, this.token, messageID, content);
    }

    /**
     * Edit the parent message
     * @param {Object} content Interaction message edit options
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
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
     * @returns {Promise<Message>}
     */
    async editOriginalMessage(content) {
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
        return this.#client.editWebhookMessage.call(this.#client, this.applicationID, this.token, "@original", content);
    }

    /**
     * Acknowledges the interaction by editing the parent message. If already acknowledged runs editOriginalMessage
     * Warning: Will error with ephemeral messages
     * @param {String | Object} content What to edit the message with
     * @param {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
     * @param {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here
     * @param {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to
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
     * @param {Boolean} [content.flags] 64 for Ephemeral
     * @param {Boolean} [content.tts] Set the message TTS flag
     * @returns {Promise<Message>}
     */
    async editParent(content) {
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
                content.allowed_mentions = this.#client._formatAllowedMentions(content.allowedMentions);
            }
        }

        const {files, attachments} = this.#client._processAttachments(content.attachments);
        content.attachments = attachments;

        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.UPDATE_MESSAGE,
            data: content
        }, files).then((resp) => {
            this.update();
            return new Message(resp.resource.message, this.#client);
        });
    }

    /**
     * Get the parent message
     * Warning: Will error with ephemeral messages
     * @returns {Promise<Message>}
     */
    async getOriginalMessage() {
        if(this.acknowledged === false) {
            throw new Error("getOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.");
        }
        return this.#client.getWebhookMessage.call(this.#client, this.applicationID, this.token, "@original");
    }

    /**
     * Responds to the interaction with launching an activity
     * @returns {Promise<Object>} Returns [the created activity instance](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-callback-interaction-callback-activity-instance-resource)
     */
    launchActivity() {
        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.LAUNCH_ACTIVITY,
            withResponse: true
        }).then((resp) => {
            this.update();
            return resp.resource.activity_instance;
        });
    }

    /**
     * Responds to the interaction with a message with an upgrade button
     * @deprecated Use premium buttons instead
     * @returns {Promise}
     */
    requirePremium() {
        emitDeprecation("INTERACTIONS_REQUIRE_PREMIUM");
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }

        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.PREMIUM_REQUIRED
        }).then(() => this.update());
    }
}

module.exports = ModalSubmitInteraction;

/**
 * The data attached to the interaction
 * @typedef ModalSubmitInteraction.InteractionData
 * @prop {String} custom_id The ID of the Modal
 * @prop {Array<Object>} components The values submitted by the user
 */
