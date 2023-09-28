"use strict";

const Permission = require("./Permission");

/**
* Represents a permission overwrite
* @extends Permission
*/
class PermissionOverwrite extends Permission {
    constructor(data) {
        super(data.allow, data.deny);
        /**
         * The ID of the overwrite
         * @type {String}
         */
        this.id = data.id;
        /**
         * The type of the overwrite, either 1 for "member" or 0 for "role"
         * @type {Number}
         */
        this.type = data.type;
    }

    toJSON(props = []) {
        return super.toJSON([
            "type",
            ...props
        ]);
    }
}

module.exports = PermissionOverwrite;
