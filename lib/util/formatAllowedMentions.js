const Constants = require("../Constants");

const defaultAllowedMentions = formatAllowedMentions(Constants.DefaultClientOptions.allowedMentions);

function formatAllowedMentions(allowed, client) {
    if(!allowed) {
        return client?.options.allowedMentions ?? defaultAllowedMentions;
    }
    const result = {
        parse: []
    };
    if(allowed.everyone) {
        result.parse.push("everyone");
    }
    if(allowed.roles === true) {
        result.parse.push("roles");
    } else if(Array.isArray(allowed.roles)) {
        if(allowed.roles.length > 100) {
            throw new Error("Allowed role mentions cannot exceed 100.");
        }
        result.roles = allowed.roles;
    }
    if(allowed.users === true) {
        result.parse.push("users");
    } else if(Array.isArray(allowed.users)) {
        if(allowed.users.length > 100) {
            throw new Error("Allowed user mentions cannot exceed 100.");
        }
        result.users = allowed.users;
    }
    if(allowed.repliedUser !== undefined) {
        result.replied_user = allowed.repliedUser;
    }
    return result;
}

module.exports = formatAllowedMentions;
