"use strict";

const Base = require("./Base");
const {Permissions} = require("../Constants");

/**
* Represents a calculated permissions number
*/
class Permission extends Base {
    #json;
    constructor(allow, deny = 0) {
        super();
        /**
         * The allowed permissions number
         * @type {BigInt}
         */
        this.allow = BigInt(allow);
        /**
         * The denied permissions number
         * @type {BigInt}
         */
        this.deny = BigInt(deny);
    }

    /**
     * A JSON representation of the permissions number.
     * If a permission key isn't there, it is not set by this permission.
     * If a permission key is false, it is denied by the permission.
     * If a permission key is true, it is allowed by the permission.
     * i.e.:
     * ```json
     * {
     *   "readMessages": true,
     *   "sendMessages": true,
     *   "manageMessages": false
     * }
     * ```
     * In the above example, readMessages and sendMessages are allowed permissions, and manageMessages is denied. Everything else is not explicitly set.
     * [A full list of permission nodes can be found in Constants](https://github.com/projectdysnomia/dysnomia/blob/dev/lib/Constants.js#L442)
     * @type {Object<string, boolean>}
     */
    get json() {
        if(!this.#json) {
            this.#json = {};
            for(const perm of Object.keys(Permissions)) {
                if(!perm.startsWith("all")) {
                    if(this.allow & Permissions[perm]) {
                        this.#json[perm] = true;
                    } else if(this.deny & Permissions[perm]) {
                        this.#json[perm] = false;
                    }
                }
            }
        }
        return this.#json;
    }

    /**
    * Check if this permission allows a specific permission
    * @arg {String | BigInt} permission The name of the permission, or bit of permissions. [A full list of permission nodes can be found on the docs reference page](/Eris/docs/reference). Pass a BigInt if you want to check multiple permissions.
    * @returns {Boolean} Whether the permission allows the specified permission
    */
    has(permission) {
        if(typeof permission === "bigint") {
            return (this.allow & permission) === permission;
        }
        return !!(this.allow & Permissions[permission]);
    }

    toString() {
        return `[${this.constructor.name} +${this.allow} -${this.deny}]`;
    }

    toJSON(props = []) {
        return super.toJSON([
            "allow",
            "deny",
            ...props
        ]);
    }
}

module.exports = Permission;
