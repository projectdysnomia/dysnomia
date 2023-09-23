const warningMessages = {
    CHANNEL_CLIENT: "Accessing the client reference via Channel#client is deprecated and is going to be removed in the next release. Please use your own client reference instead.",
    NITRO_STICKER_PACKS: "Client#getNitroStickerPacks is deprecated as built-in sticker packs are free for everyone. Please use Client#getStickerPacks instead."
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
