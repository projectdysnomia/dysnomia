const Base = require("./Base");

/**
 * Represents an entitlement
 * @extends Base
 */
class Entitlement extends Base {
    /**
     * The ID of the entitlement
     * @member {String} Entitlement#id
     */
    #client;
    constructor(data, client) {
        super(data.id);

        this.#client = client;

        /**
         * The ID of the SKU associated with this entitlement
         * @type {String}
         */
        this.skuID = data.sku_id;

        /**
         * The ID of the user that is granted access to the SKU
         * @type {String?}
         */
        this.userID = data.user_id;

        /**
         * The ID of the guild that is granted access to the SKU
         * @type {String?}
         */
        this.guildID = data.guild_id;

        /**
         * The ID of the application associated with this entitlement
         * @type {String}
         */
        this.applicationID = data.application_id;

        /**
         * The type of the entitlement
         * @type {Number}
         */
        this.type = data.type;

        /**
         * The timestamp at which the entitlement starts to be valid. `null` if the entitlement is a test entitlement.
         * @type {Number?}
         */
        this.startsAt = data.starts_at != null ? Date.parse(data.starts_at) : null;
        /**
         * The timestamp at which the entitlement is no longer valid. `null` if the entitlement is a test entitlement.
         * @type {Number?}
         */
        this.endsAt = data.ends_at != null ? Date.parse(data.ends_at) : null;
    }
}

module.exports = Entitlement;
