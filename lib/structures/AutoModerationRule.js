"use strict";

const Base = require("./Base");

/**
 * Represents an auto moderation rule
 * @prop {Array<Object>} actions An array of [auto moderation action objects](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object)
 * @prop {String} creatorID The ID of the user who created this auto moderation rule
 * @prop {Boolean} enabled Whether this auto moderation rule is enabled or not
 * @prop {Number} eventType The rule [event type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types)
 * @prop {Array<String>} exemptRoles An array of role IDs exempt from this rule
 * @prop {Array<String>} exemptChannels An array of channel IDs exempt from this rule
 * @prop {String} guildID The ID of the guild which this rule belongs to
 * @prop {String} id The ID of the auto moderation rule
 * @prop {String} name The name of the rule
 * @prop {Object} triggerMetadata The [metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) tied with this rule
 * @prop {Number} triggerType The rule [trigger type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types)
 */
class AutoModerationRule extends Base {
    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;

        this.actions = data.actions.map((action) => ({
            type: action.type,
            metadata: action.metadata
        }));

        this.creatorID = data.creator_id;
        this.enabled = data.enabled;
        this.eventType = data.event_type;
        this.exemptRoles = data.exempt_roles;
        this.exemptChannels = data.exempt_channels;
        this.guildID = data.guild_id;
        this.name = data.name;
        this.triggerMetadata = data.trigger_metadata;
        this.triggerType = data.trigger_type;
    }

    /**
     * Deletes this auto moderation rule
     * @returns {Promise}
     */
    delete() {
        return this.#client.rest.deleteAutoModerationRule(this.guildID, this.id);
    }

    /**
     * Edits this auto moderation rule
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
    edit(options) {
        return this.#client.rest.editAutoModerationRule(this.guildID, this.id, options);
    }
}

module.exports = AutoModerationRule;
