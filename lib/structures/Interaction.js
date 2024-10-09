"use strict";

const Base = require("./Base");
const Entitlement = require("./Entitlement");
const {InteractionTypes} = require("../Constants");
const Member = require("./Member");
const Permission = require("./Permission");

/**
 * Represents an interaction. You also probably want to look at AutocompleteInteraction, CommandInteraction, ComponentInteraction, and ModalSubmitInteraction.
 * @extends Base
 */
class Interaction extends Base {
    /**
     * The ID of the interaction
     * @member {String} Interaction#id
     */
    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;

        /**
         * The ID of the interaction's application
         * @type {String}
         */
        this.applicationID = data.application_id;
        /**
         * The interaction token (Interaction tokens are valid for 15 minutes after initial response and can be used to send followup messages but you must send an initial response within 3 seconds of receiving the event. If the 3 second deadline is exceeded, the token will be invalidated.)
         * @type {String}
         */
        this.token = data.token;
        /**
         * The [interaction type](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type)
         * @type {Number}
         */
        this.type = data.type;
        /**
         * The interaction version
         * @type {Number}
         */
        this.version = data.version;
        /**
         * Whether or not the interaction has been acknowledged
         * @type {Boolean}
         */
        this.acknowledged = false;

        if(data.channel !== undefined) {
            /**
             * The channel the interaction was created in. Can be partial with only the id and type if the channel is not cached.
             * @type {(PrivateChannel | TextChannel | NewsChannel)?}
             */
            this.channel = this.#client.getChannel(data.channel.id) || data.channel;
        }

        if(data.data !== undefined) {
            /**
             * The data attached to the interaction. See AutocompleteInteraction, CommandInteraction, and ComponentInteraction for specific details
             * @type {Object}
             */
            this.data = JSON.parse(JSON.stringify(data.data));
        }

        if(data.guild_id !== undefined) {
            /**
             * The ID of the guild in which the interaction was created
             * @type {String?}
             */
            this.guildID = data.guild_id;
        }

        if(data.member !== undefined) {
            if(this.channel.guild) {
                data.member.id = data.member.user.id;
                /**
                 * The member who triggered the interaction (This is only sent when the interaction is invoked within a guild)
                 * @type {Member?}
                 */
                this.member = this.channel.guild.members.update(data.member, this.channel.guild);
            } else {
                const guild = this.#client.guilds.get(data.guild_id);
                this.member = new Member(data.member, guild, this.#client);
            }
            this.user = this.member.user;
        }

        if(data.user !== undefined) {
            /**
             * The user who triggered the interaction
             * @type {User}
             */
            this.user = this.#client.users.update(data.user, client);
        }

        if(data.locale !== undefined) {
            /**
             * The selected language of the invoking user (e.g. "en-US")
             * @type {String?}
             */
            this.locale = data.locale;
        }

        if(data.guild_locale !== undefined) {
            /**
             * The selected language of the guild the command was invoked from (e.g. "en-US")
             * @type {String?}
             */
            this.guildLocale = data.guild_locale;
        }

        if(data.app_permissions !== undefined) {
            /**
             * The permissions the app has in the source context of the interaction.
             * @type {Permission?}
             */
            this.appPermissions = new Permission(data.app_permissions);
        }


        if(data.context !== undefined) {
            /**
             * The context from which this interaction was triggered
             * @type {Number?}
             */
            this.context = data.context;
        }

        if(data.authorizing_integration_owners !== undefined) {
            /**
             * A mapping of installation contexts that the app was authorized for to respective guild/user IDs
             * @type {Object<number, string>}
             */
            this.authorizingIntegrationOwners = data.authorizing_integration_owners;

        }
    }

    update() {
        this.acknowledged = true;
    }

    static from(data, client) {
        switch(data.type) {
            case InteractionTypes.APPLICATION_COMMAND: {
                return new CommandInteraction(data, client);
            }
            case InteractionTypes.MESSAGE_COMPONENT: {
                return new ComponentInteraction(data, client);
            }
            case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE: {
                return new AutocompleteInteraction(data, client);
            }
            case InteractionTypes.MODAL_SUBMIT: {
                return new ModalSubmitInteraction(data, client);
            }
        }

        client.emit("warn", new Error(`Unknown interaction type: ${data.type}\n${JSON.stringify(data, null, 2)}`));
        return new Interaction(data, client);
    }

    toJSON(props = []) {
        return super.toJSON([
            "acknowledged",
            "applicationID",
            "channel",
            "data",
            "guildLocale",
            "locale",
            "token",
            "type",
            "version",
            ...props
        ]);
    }
}

module.exports = Interaction;

// Circular import
const CommandInteraction = require("./CommandInteraction");
const ComponentInteraction = require("./ComponentInteraction");
const AutocompleteInteraction = require("./AutocompleteInteraction");
const ModalSubmitInteraction = require("./ModalSubmitInteraction.js");
