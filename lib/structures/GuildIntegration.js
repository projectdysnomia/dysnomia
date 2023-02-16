"use strict";

const Base = require("./Base");

/**
* Represents a guild integration
* @prop {Object} account Info on the integration account
* @prop {String} account.id The ID of the integration account
* @prop {String} account.name The name of the integration account
* @prop {Object?} application The bot/OAuth2 application for Discord integrations. See [the Discord docs](https://discord.com/developers/docs/resources/guild#integration-application-object)
* @prop {Number} createdAt Timestamp of the guild integration's creation
* @prop {Boolean} enabled Whether the integration is enabled or not
* @prop {Boolean?} enableEmoticons Whether integration emoticons are enabled or not
* @prop {Number?} expireBehavior behavior of expired subscriptions
* @prop {Number?} expireGracePeriod grace period for expired subscriptions
* @prop {String} id The ID of the integration
* @prop {Guild} guild The guild this integration belongs to
* @prop {String} name The name of the integration
* @prop {Boolean?} revoked Whether or not the application was revoked
* @prop {String?} roleID The ID of the role connected to the integration
* @prop {Array<String>} scopes The scope the application is authorized for
* @prop {Number?} subscriberCount The amount of subscribers
* @prop {Number?} syncedAt Unix timestamp of last integration sync
* @prop {Boolean?} syncing Whether the integration is syncing or not
* @prop {String} type The type of the integration
* @prop {User?} user The user connected to the integration
*/
class GuildIntegration extends Base {
    constructor(data, guild) {
        super(data.id);
        this.guild = guild;
        this.name = data.name;
        this.type = data.type;
        if(data.role_id !== undefined) {
            this.roleID = data.role_id;
        }
        if(data.user) {
            this.user = guild.shard.client.users.add(data.user, guild.shard.client);
        }
        this.account = data.account; // not worth making a class for
        this.update(data);
    }

    update(data) {
        this.enabled = data.enabled;
        if(data.syncing !== undefined) {
            this.syncing = data.syncing;
        }
        if(data.expire_behavior !== undefined) {
            this.expireBehavior = data.expire_behavior;
        }
        if(data.expire_behavior !== undefined) {
            this.expireGracePeriod = data.expire_grace_period;
        }
        if(data.enable_emoticons !== undefined) {
            this.enableEmoticons = data.enable_emoticons;
        }
        if(data.subscriber_count !== undefined) {
            this.subscriberCount = data.subscriber_count;
        }
        if(data.synced_at !== undefined) {
            this.syncedAt = data.synced_at;
        }
        if(data.revoked !== undefined) {
            this.revoked = data.revoked;
        }
        if(data.application !== undefined) {
            this.application = data.application;
        }
        if(data.scopes !== undefined) {
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
