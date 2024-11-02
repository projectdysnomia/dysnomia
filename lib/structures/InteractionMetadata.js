"use strict";
const Base = require("./Base");
const User = require("./User");

/**
 * Represents metadata about the interaction in a {@link Message} object
 * @extends Base
 */
class InteractionMetadata extends Base {
    /**
     * The ID of the interaction
     * @member {String} InteractionMetadata#id
     */

    constructor(data, client) {
        super(data.id);

        /**
         * The type of the interaction
         * @type {Number}
         */
        this.type = data.type;

        /**
         * The user who triggered the interaction
         * @type {User}
         */
        this.user = client ? client.users.update(data.user, client) : new User(data.user, client);

        /**
         * A mapping of installation contexts that the app was authorized for to respective guild/user IDs
         * @type {Object<number, string>}
         */
        this.authorizingIntegrationOwners = data.authorizing_integration_owners;

        /**
         * The ID of the original response message (present only on follow-up messages)
         * @type {String?}
         */
        this.originalResponseMessageID = data.original_response_message_id;

        /**
         * The ID of the message which contained the interactive component (present only on messages created from component interactions)
         * @type {String?}
         */
        this.interactedMessageID = data.interacted_message_id;

        if(data.triggering_interaction_metadata !== undefined) {
            /**
             * The metadata for the interaction that was used to open the modal (present only on modal submit interactions)
             * @type {InteractionMetadata?}
             */
            this.triggeringInteractionMetadata = new InteractionMetadata(data.triggering_interaction_metadata, client);
        }

        if(data.target_user !== undefined) {
            /**
             * The user an interaction command was run on, present only on user command interactions
             * @type {User?}
             */
            this.targetUser = client ? client.users.update(data.target_user, client) : new User(data.target_user, client);
        }

        /**
         * The ID of the message an interaction command was run on, present only on message command interactions
         * @type {String?}
         */
        this.targetMessageID = data.target_message_id;
    }

    toJSON(props = []) {
        return super.toJSON([
            "type",
            "user",
            "authorizingIntegrationOwners",
            "originalResponseMessageID",
            "interactedMessageID",
            "triggeringInteractionMetadata",
            "targetUser",
            "targetMessageID",
            ...props
        ]);
    }
}

module.exports = InteractionMetadata;
