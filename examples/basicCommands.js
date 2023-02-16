// WARNING: CommandClient is a deprecated interface and will be removed in a future version.

const Dysnomia = require("@projectdysnomia/dysnomia");

// Replace TOKEN with your bot account's token
const bot = new Dysnomia.CommandClient("Bot TOKEN", {}, {
    description: "A test bot made with Dysnomia",
    owner: "somebody",
    prefix: "!"
});

bot.on("ready", () => { // When the bot is ready
    console.log("Ready!"); // Log "Ready!"
});

bot.on("error", (err) => {
    console.error(err); // or your preferred logger
});

bot.registerCommandAlias("halp", "help"); // Alias !halp to !help

bot.registerCommand("ping", "Pong!", { // Make a ping command
// Responds with "Pong!" when someone says "!ping"
    description: "Pong!",
    fullDescription: "This command could be used to check if the bot is up. Or entertainment when you're bored."
});

bot.registerCommand("pong", ["Pang!", "Peng!", "Ping!", "Pung!"], { // Make a pong command
// Responds with a random version of "Ping!" when someone says "!pong"
    description: "Ping!",
    fullDescription: "This command could also be used to check if the bot is up. Or entertainment when you're bored."
});

const echoCommand = bot.registerCommand("echo", (msg, args) => { // Make an echo command
    if(args.length === 0) { // If the user just typed "!echo", say "Invalid input"
        return "Invalid input";
    }
    const text = args.join(" "); // Make a string of the text after the command label
    return text; // Return the generated string
}, {
    description: "Make the bot say something",
    fullDescription: "The bot will echo whatever is after the command label.",
    usage: "<text>"
});

echoCommand.registerSubcommand("reverse", (msg, args) => { // Make a reverse subcommand under echo
    if(args.length === 0) { // If the user just typed "!echo reverse", say "Invalid input"
        return "Invalid input";
    }
    let text = args.join(" "); // Make a string of the text after the command label
    text = text.split("").reverse().join(""); // Reverse the string
    return text; // Return the generated string
}, {
    description: "Make the bot say something in reverse",
    fullDescription: "The bot will echo, in reverse, whatever is after the command label.",
    usage: "<text>"
});

echoCommand.registerSubcommandAlias("backwards", "reverse"); // Alias "!echo backwards" to "!echo reverse"

bot.connect();
