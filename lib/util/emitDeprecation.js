"use strict";

const warningMessages = {
    INTERACTIONS_REQUIRE_PREMIUM: "Interaction#requirePremium is deprecated by Discord. Please use premium buttons instead."
};
const unknownCodeMessage = "You have triggered a deprecated behavior whose warning was implemented improperly. Please report this issue.";

const emittedCodes = [];

/**
 * @param {keyof typeof warningMessages} code
 */
module.exports = function emitDeprecation(code) {
    if(emittedCodes.includes(code)) {
        return;
    }
    emittedCodes.push(code);
    process.emitWarning(warningMessages[code] || unknownCodeMessage, "DeprecationWarning", `dysnomia:${code}`);
};
