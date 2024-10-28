"use strict";
const Base = require("./Base");

/**
 * Represents a subscription for one or more SKUs
 * @extends Base
 */
class Subscription extends Base {
    /**
     * The ID of the subscription
     * @member {String} Subscription#id
     */

    constructor(data) {
        super(data.id);

        /**
         * The ID of the user who subscribed
         * @type {String}
         */
        this.userID = data.user_id;

        /**
         * An array of SKU IDs that the user is subscribed to
         * @type {Array<String>}
         */
        this.skuIDs = data.sku_ids;

        /**
         * An array of entitlement IDs that this subscription grants
         * @type {Array<String>}
         */
        this.entitlementIDs = data.entitlement_ids;

        /**
         * The start timestamp of the current subscription period
         * @type {Number}
         */
        this.currentPeriodStart = Date.parse(data.current_period_start);

        /**
         * The end timestamp of the current subscription period
         * @type {Number}
         */
        this.currentPeriodEnd = Date.parse(data.current_period_end);

        /**
         * The status of the subscription
         * @type {Number}
         */
        this.status = data.status;

        /**
         * A timestamp of when the subscription was canceled
         * @type {Number?}
         */
        this.canceledAt = data.canceled_at ? Date.parse(data.canceled_at) : null;

        /**
         * An ISO 3166-1 alpha-2 country code of the payment source used to purchase the subscription. Missing if not queried with a private OAuth2 scope.
         * @type {String?}
         */
        this.country = data.country;
    }

    toJSON(props = []) {
        return super.toJSON([
            "userID",
            "skuIDs",
            "entitlementIDs",
            "currentPeriodStart",
            "currentPeriodEnd",
            "status",
            "canceledAt",
            "country",
            ...props
        ]);
    }
}

module.exports = Subscription;
