const Base = require("./Base");

/**
 * Represents an application command
 * @extends Base
 */
class ApplicationCommand extends Base {
    /**
     * The ID of the application command
     * @override
     * @member {Number} ApplicationCommand#id
     */

    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;


        /**
         * The ID of the application that this command belongs to
         * @type {String}
         */
        this.applicationID = data.application_id;
        /**
         * The name of the command
         * @type {String}
         */
        this.name = data.name;
        /**
         * The description of the command (empty for user & message commands)
         * @type {String}
         */
        this.description = data.description;
        /**
         * The [command type](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types)
         * @type {Number}
         */
        this.type = data.type;
        /**
         * The id of the version of this command
         * @type {String}
         */
        this.version = data.version;

        if(data.guild_id !== undefined) {
            /**
             * The ID of the guild associated with this command (guild commands only)
             * @type {String?}
             */
            this.guildID = data.guild_id;
        }

        if(data.name_localizations !== undefined) {
            /**
             * A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
             * @type {Object<string, string>}
             */
            this.nameLocalizations = data.name_localizations;
        }

        if(data.description_localizations !== undefined) {
            /**
             * A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
             * @type {Object<string, string>}
             */
            this.descriptionLocalizations = data.description_localizations;
        }

        if(data.options !== undefined) {
            /**
             * The [options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure) associated with this command
             * @type {Object[]?}
             */
            this.options = data.options;
        }

        if(data.default_member_permissions !== undefined) {
            /**
             * The [permissions](https://discord.com/developers/docs/topics/permissions) required by default for this command to be usable
             * @type {String?}
             */
            this.defaultMemberPermissions = data.default_member_permissions;
        }

        if(data.dm_permission !== undefined) {
            /**
             * If this command can be used in direct messages (global commands only)
             * @type {Boolean?}
             */
            this.dmPermission = data.dm_permission;
        }

        if(data.nsfw !== undefined) {
            /**
             * Whether this command is age-restricted or not
             * @type {Boolean}
             */
            this.nsfw = data.nsfw;
        }
    }

    /**
     * Delete this command
     * @returns {Promise}
     */
    delete() {
        return this.guildID === undefined ? this.#client.deleteCommand.call(this.#client, this.id) : this.#client.deleteGuildCommand.call(this.#client, this.guildID, this.id);
    }

    /**
    * Edit this application command
    * @arg {Object} options The properties to edit
    * @arg {String} [options.name] The command name
    * @arg {Object<string, string>} [options.nameLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to names for that locale
    * @arg {String} [options.description] The command description (chat input commands only)
    * @arg {Object<string, string>} [options.descriptionLocalizations] A map of [locales](https://discord.com/developers/docs/reference#locales) to descriptions for that locale
    * @arg {Array<Object>} [options.options] An array of [command options](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure)
    * @arg {String} [options.defaultMemberPermissions] The [permissions](https://discord.com/developers/docs/topics/permissions) required by default for this command to be usable
    * @arg {Boolean} [options.dmPermission] If this command can be used in direct messages (global commands only)
    * @returns {Promise}
    */
    edit(options) {
        return this.guildID === undefined ? this.#client.editCommand.call(this.#client, this.id, options) : this.#client.editGuildCommand.call(this.#client, this.id, this.guildID, options);
    }

    toJSON(props = []) {
        return super.toJSON([
            "applicationID",
            "defaultMemberPermissions",
            "description",
            "descriptionLocalizations",
            "dmPermission",
            "guildID",
            "name",
            "nameLocalizations",
            "nsfw",
            "options",
            "type",
            "version",
            ...props
        ]);
    }
}

module.exports = ApplicationCommand;
