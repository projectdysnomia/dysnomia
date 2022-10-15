const warningMessages = {
    FETCH_ALL_MEMBERS: "Fetching all guild members via fetchAllMembers() is deprecated. Use Guild#fetchMembers instead.",
    CREATE_MESSAGE_FILE: "Passing a file parameter to createMessage() is deprecated. Use content.attachments property instead.",
    EXECUTE_WEBHOOK_FILE: "Passing options.file to executeWebhook() is deprecated. Use options.attachments property instead.",
    EDIT_WEBHOOK_MESSAGE_FILE: "Passing options.file to editWebhookMessage() is deprecated. Use options.attachments property instead.",
    EDIT_MESSAGE_FILE: "Passing options.file to editMessage() is deprecated. Use options.attachments property instead."
};
const unknownCodeMessage = "You have triggered a deprecated behavior whose warning was implemented improperly. Please report this issue.";

const emittedCodes = [];

module.exports = function emitDeprecation(code) {
    if(emittedCodes.includes(code) ) {
        return;
    }
    emittedCodes.push(code);
    process.emitWarning(warningMessages[code] || unknownCodeMessage, "DeprecationWarning", `dysnomia:${code}`);
};
