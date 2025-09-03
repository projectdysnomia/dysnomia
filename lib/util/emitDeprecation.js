"use strict";

const warningMessages = {
    CHANNEL_CLIENT: "Accessing the client reference via Channel#client is deprecated and is going to be removed in the next release. Please use your own client reference instead.",
    NITRO_STICKER_PACKS: "Client#getNitroStickerPacks is deprecated as built-in sticker packs are free for everyone. Please use Client#getStickerPacks instead.",
    INTERACTIONS_REQUIRE_PREMIUM: "Interaction#requirePremium is deprecated by Discord. Please use premium buttons instead.",
    PRIVATE_CHANNEL_RECIPIENT: "Accessing a private channel recipient via PrivateChannel#recipient is deprecated. Use PrivateChannel#recipients instead.",
    CHANNEL_PINS_NEW: "Returning the pinned messages of a channel as an array of messages in Client#getPins is deprecated. To opt into the new form, pass an options object to Client#getPins.",
    BOT_GUILD_OWNERSHIP: "Bot users cannot own guilds any longer. As such, any API calls that involve bot ownership of a guild are deprecated.",
    NEW_VOICE_CONFIG: "Setting opusOnly on client options has moved to the voice object in client options. Please update your code accordingly."
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
