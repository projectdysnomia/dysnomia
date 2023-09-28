"use strict";

const Base = require("./Base");

/**
* Represents a guild integration
* @extends Base
*/
class GuildIntegration extends Base {
    /**
     * The ID of the integration
     * @member {String} GuildIntegration#id
     */
    /**
     * Timestamp of the guild integration's creation
     * @member {Number} GuildIntegration#createdAt
     */
    constructor(data, guild) {
        super(data.id);
        /**
         * The guild this integration belongs to
         * @type {Guild}
         */
        this.guild = guild;
        /**
         * The name of the integration
         * @type {String}
         */
        this.name = data.name;
        /**
         * The type of the integration
         * @type {String}
         */
        this.type = data.type;
        if(data.role_id !== undefined) {
            /**
             * The ID of the role connected to the integration
             * @type {String?}
             */
            this.roleID = data.role_id;
        }
        if(data.user) {
            /**
             * The user connected to the integration
             * @type {User?}
             */
            this.user = guild.shard.client.users.add(data.user, guild.shard.client);
        }
        /**
         * Info on the integration account
         * @type {GuildIntegration.AccountData}
         */
        this.account = data.account; // not worth making a class for
        this.update(data);
    }

    update(data) {
        /**
         * Whether the integration is enabled or not
         * @type {Boolean}
         */
        this.enabled = data.enabled;
        if(data.syncing !== undefined) {
            /**
             * Whether the integration is syncing or not
             * @type {Boolean?}
             */
            this.syncing = data.syncing;
        }
        if(data.expire_behavior !== undefined) {
            /**
             * The behavior of expired subscriptions
             * @type {Number?}
             */
            this.expireBehavior = data.expire_behavior;
        }
        if(data.expire_behavior !== undefined) {
            /**
             * The grace period for expired subscriptions
             * @type {Number?}
             */
            this.expireGracePeriod = data.expire_grace_period;
        }
        if(data.enable_emoticons !== undefined) {
            /**
             * Whether integration emoticons are enabled or not
             * @type {Boolean?}
             */
            this.enableEmoticons = data.enable_emoticons;
        }
        if(data.subscriber_count !== undefined) {
            /**
             * The amount of subscribers
             * @type {Number?}
             */
            this.subscriberCount = data.subscriber_count;
        }
        if(data.synced_at !== undefined) {
            /**
             * Unix timestamp of last integration sync
             * @type {Number?}
             */
            this.syncedAt = data.synced_at;
        }
        if(data.revoked !== undefined) {
            /**
             * Whether or not the application was revoked
             * @type {Boolean?}
             */
            this.revoked = data.revoked;
        }
        if(data.application !== undefined) {
            /**
             * The bot/OAuth2 application for Discord integrations. See [the Discord docs](https://discord.com/developers/docs/resources/guild#integration-application-object)
             * @type {Object?}
             */
            this.application = data.application;
        }
        if(data.scopes !== undefined) {
            /**
             * The scope the application is authorized for
             * @type {Array<String>?}
             */
            this.scopes = data.scopes;
        }
    }

    /**
    * Delete the guild integration
    * @returns {Promise}
    */
    delete() {
        return this.guild.shard.client.deleteGuildIntegration.call(this.guild.shard.client, this.guild.id, this.id);
    }

    toJSON(props = []) {
        return super.toJSON([
            "account",
            "application",
            "enabled",
            "enableEmoticons",
            "expireBehavior",
            "expireGracePeriod",
            "name",
            "revoked",
            "roleID",
            "scopes",
            "subscriberCount",
            "syncedAt",
            "syncing",
            "type",
            "user",
            ...props
        ]);
    }
}

module.exports = GuildIntegration;

/**
 * Info on the integration account
 * @typedef GuildIntegration.AccountData
 * @prop {String} id The ID of the integration account
 * @prop {String} name The name of the integration account
 */
