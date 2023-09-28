"use strict";

const User = require("./User");

/**
* Represents an extended user
* @extends User
*/
class ExtendedUser extends User {
    constructor(data, client) {
        super(data, client);
    }

    update(data) {
        super.update(data);
        if(data.email !== undefined) {
            /**
             * The email of the user
             * @type {String?}
             */
            this.email = data.email;
        }
        if(data.verified !== undefined) {
            /**
             * Whether the account email has been verified
             * @type {Boolean?}
             */
            this.verified = data.verified;
        }
        if(data.mfa_enabled !== undefined) {
            /**
             * Whether the user has enabled two-factor authentication
             * @type {Boolean?}
             */
            this.mfaEnabled = data.mfa_enabled;
        }
        if(data.premium_type !== undefined) {
            /**
             * The type of Nitro subscription on the user's account
             * @type {Number?}
             */
            this.premiumType = data.premium_type;
        }
    }

    toJSON(props = []) {
        return super.toJSON([
            "email",
            "mfaEnabled",
            "premium",
            "verified",
            ...props
        ]);
    }
}

module.exports = ExtendedUser;
