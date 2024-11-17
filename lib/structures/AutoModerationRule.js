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
     * @param {Object} options The new rule options
     * @param {Object[]} [options.actions] The [actions](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-action-object) done when the rule is violated
     * @param {Boolean} [options.enabled=false] If the rule is enabled, false by default
     * @param {Number} [options.eventType] The [event type](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-event-types) for the rule
     * @param {String[]} [options.exemptChannels] Any channels where this rule does not apply
     * @param {String[]} [options.exemptRoles] Any roles to which this rule does not apply
     * @param {String} [options.name] The name of the rule
     * @param {String} [options.reason] The reason to be displayed in audit logs
     * @param {Object} [options.triggerMetadata] The [trigger metadata](https://discord.com/developers/docs/resources/auto-moderation#auto-moderation-rule-object-trigger-metadata) for the rule
     * @returns {Promise<AutoModerationRule>}
     */
    edit(options) {
        return this.#client.editAutoModerationRule.call(this.#client, this.guildID, this.id, options);
    }

    toJSON(props = []) {
        return super.toJSON([
            "actions",
            "creatorID",
            "enabled",
            "eventType",
            "exemptRoles",
            "exemptChannels",
            "guildID",
            "name",
            "triggerMetadata",
            "triggerType",
            ...props
        ]);
    }
}

module.exports = AutoModerationRule;
