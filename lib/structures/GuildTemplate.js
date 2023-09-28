const Base = require("./Base");
const Guild = require("./Guild");

/**
* Represents a guild template
*/
class GuildTemplate {
    #client;
    constructor(data, client) {
        this.#client = client;
        /**
         * The template code
         * @type {String}
         */
        this.code = data.code;
        /**
         * Timestamp of template creation
         * @type {Number}
         */
        this.createdAt = Date.parse(data.created_at);
        /**
         * The user that created the template
         * @type {User}
         */
        this.creator = client.users.update(data.creator, client);
        /**
         * The template description
         * @type {String?}
         */
        this.description = data.description;
        /**
         * Whether the template has unsynced changes
         * @type {Boolean?}
         */
        this.isDirty = data.is_dirty;
        /**
         * The template name
         * @type {String}
         */
        this.name = data.name;
        /**
         * The guild snapshot this template contains
         * @type {Guild}
         */
        this.serializedSourceGuild = new Guild(data.serialized_source_guild, client);
        /**
         * The guild this template is based on. If the guild is not cached, this will be an object with `id` key. No other property is guaranteed
         * @type {Guild | Object}
         */
        this.sourceGuild = client.guilds.get(data.source_guild_id) || {id: data.source_guild_id};
        /**
         * Timestamp of template update
         * @type {Number}
         */
        this.updatedAt = Date.parse(data.updated_at);
        /**
         * The number of times this template has been used
         * @type {Number}
         */
        this.usageCount = data.usage_count;
    }

    /**
    * Create a guild based on this template. This can only be used with bots in less than 10 guilds
    * @arg {String} name The name of the guild
    * @arg {String} [icon] The 128x128 icon as a base64 data URI
    * @returns {Promise<Guild>}
    */
    createGuild(name, icon) {
        return this.#client.createGuildFromTemplate.call(this.#client, this.code, name, icon);
    }

    /**
    * Delete this template
    * @returns {Promise<GuildTemplate>}
    */
    delete() {
        return this.#client.deleteGuildTemplate.call(this.#client, this.sourceGuild.id, this.code);
    }

    /**
    * Edit this template
    * @arg {Object} options The properties to edit
    * @arg {String} [options.name] The name of the template
    * @arg {String?} [options.description] The description for the template. Set to `null` to remove the description
    * @returns {Promise<GuildTemplate>}
    */
    edit(options) {
        return this.#client.editGuildTemplate.call(this.#client, this.sourceGuild.id, this.code, options);
    }

    /**
    * Force this template to sync to the guild's current state
    * @returns {Promise<GuildTemplate>}
    */
    sync() {
        return this.#client.syncGuildTemplate.call(this.#client, this.sourceGuild.id, this.code);
    }

    toJSON(props = []) {
        return Base.prototype.toJSON.call(this, [
            "code",
            "createdAt",
            "creator",
            "description",
            "isDirty",
            "name",
            "serializedSourceGuild",
            "sourceGuild",
            "updatedAt",
            "usageCount",
            ...props
        ]);
    }
}

module.exports = GuildTemplate;
