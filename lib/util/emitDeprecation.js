const warningMessages = {
    FETCH_ALL_MEMBERS: "Fetching all guild members via fetchAllMembers() is deprecated. Use Guild#fetchMembers instead.",
    CREATE_MESSAGE_FILE: "Passing a file parameter to createMessage() is deprecated. Use content.attachments property instead.",
    EDIT_PARENT_FILE: "Passing a file parameter to editParent() is deprecated. Use content.attachments property instead.",
    EXECUTE_WEBHOOK_FILE: "Passing options.file to executeWebhook() is deprecated. Use options.attachments property instead.",
    EDIT_WEBHOOK_MESSAGE_FILE: "Passing options.file to editWebhookMessage() is deprecated. Use options.attachments property instead.",
    EDIT_MESSAGE_FILE: "Passing options.file to editMessage() is deprecated. Use options.attachments property instead.",
    AUTOMOD_CAMEL_CASE_META: "Accessing auto moderation metadata via camel-cased properties is deprecated. Use snake_cased properties instead.",
    CREATE_THREAD_WITHOUT_MESSAGE: "Creating threads via createThreadWithoutMessage() is deprecated. Use createThread() instead.",
    EXPORT_FUNCTION_CALL: "Creating a new Client instance indirectly by calling the default import is deprecated. Construct a Dysnomia.Client directly instead.",
    DISCOVERY_UNDOCUMENTED: "Methods related to guild discovery are undocumented and unsupported. They will be removed in a future version."
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
