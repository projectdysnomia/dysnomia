"use strict";
const Base = require("./Base");

/**
 * Represents a SKU
 * @extends Base
 */
class SKU extends Base {
    /**
     * The ID of the SKU
     * @member {String} SKU#id
     */

    #client;
    constructor(data, client) {
        super(data.id);
        this.#client = client;

        /**
         * The type of the SKU
         * @type {Number}
         */
        this.type = data.type;

        /**
         * The ID of the application that owns this SKU
         * @type {String}
         */
        this.applicationID = data.application_id;

        /**
         * The customer-facing name of the SKU
         * @type {String}
         */
        this.name = data.name;

        /**
         * A system-generated URL slug for the SKU
         * @type {String}
         */
        this.slug = data.slug;

        /**
         * The SKU flag bitfield
         * @type {Number}
         */
        this.flags = data.flags;
    }

    /**
     * Gets a subscription to this SKU
     * @param {String} subscriptionID The ID of the subscription
     * @returns {Promise<Subscription>}
     */
    getSubscription(subscriptionID) {
        return this.#client.getSKUSubscription.call(this.#client, this.id, subscriptionID);
    }

    /**
     * Gets the list of subscriptions to this SKU
     * @param {Object} options The options for the request
     * @param {String} [options.after] Get subscriptions after this subscription ID
     * @param {String} [options.before] Get subscriptions before this subscription ID
     * @param {Number} [options.limit] The maximum number of subscriptions to get
     * @param {String} options.userID The ID of the user to get subscriptions for (can be omitted only if requesting with an OAuth token)
     * @returns {Promise<Array<Subscription>>}
     */
    getSubscriptions(options) {
        return this.#client.getSKUSubscriptions.call(this.#client, this.id, options);
    }

    toJSON(props = []) {
        return super.toJSON([
            "type",
            "applicationID",
            "name",
            "slug",
            "flags",
            ...props
        ]);
    }
}

module.exports = SKU;
