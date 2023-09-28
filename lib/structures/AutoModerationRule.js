"use strict";

const Base = require("./Base");

/**
 * Represents an auto moderation rule
 */
class AutoModerationRule extends Base {
    /**
     * The ID of the auto moderation rule
     * @member {String} AutoModerationRule#id
     */
    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;

        /**
         * An array of [auto moderation action objects](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object)
         * @type {Array<Object>}
         */
        this.actions = data.actions.map((action) => ({
            type: action.type,
            metadata: action.metadata
        }));
        /**
         * The ID of the user who created this auto moderation rule
         * @type {String}
         */
        this.creatorID = data.creator_id;
        /**
         * Whether this auto moderation rule is enabled or not
         * @type {Boolean}
         */
        this.enabled = data.enabled;
        /**
         * The rule [event type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types)
         * @type {Number}
         */
        this.eventType = data.event_type;
        /**
         * An array of role IDs exempt from this rule
         * @type {Array<String>}
         */
        this.exemptRoles = data.exempt_roles;
        /**
         * An array of channel IDs exempt from this rule
         * @type {Array<String>}
         */
        this.exemptChannels = data.exempt_channels;
        /**
         * The ID of the guild which this rule belongs to
         * @type {String}
         */
        this.guildID = data.guild_id;
        /**
         * The name of the rule
         * @type {String}
         */
        this.name = data.name;
        /**
         * The [metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) tied with this rule
         * @type {Object}
         */
        this.triggerMetadata = data.trigger_metadata;
        /**
         * The rule [trigger type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-types)
         * @type {Number}
         */
        this.triggerType = data.trigger_type;
    }

    /**
     * Deletes this auto moderation rule
     * @returns {Promise}
     */
    delete() {
        return this.#client.deleteAutoModerationRule.call(this.#client, this.guildID, this.id);
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
        return this.#client.editAutoModerationRule.call(this.#client, this.guildID, this.id, options);
    }
}

module.exports = AutoModerationRule;
