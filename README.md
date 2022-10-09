Project Dysnomia
====

A fork of [Eris](https://github.com/abalabahaha/eris), a Node.js wrapper for interfacing with Discord, focused on keeping up with the latest Discord API changes.

Installing
----------

You will need NodeJS 10.4+. Voice support requires [additional software](https://github.com/nodejs/node-gyp#installation).

```
npm install --no-optional @projectdysnomia/dysnomia
```

If you'd like to install the development versions of the library, use the following command instead:
```
npm install --no-optional github:projectdysnomia/dysnomia#dev
```

If you need voice support, remove the `--no-optional`.

Ping Pong Example
-----------------

```js
const Dysnomia = require("@projectdysnomia/dysnomia");

// Replace TOKEN with your bot account's token
const bot = new Dysnomia("Bot TOKEN", {
    intents: [
        "guildMessages"
    ]
});

bot.on("ready", () => { // When the bot is ready
    console.log("Ready!"); // Log "Ready!"
});

bot.on("error", (err) => {
  console.error(err); // or your preferred logger
});

bot.on("messageCreate", (msg) => { // When a message is created
    if(msg.content === "!ping") { // If the message content is "!ping"
        bot.createMessage(msg.channel.id, "Pong!");
        // Send a message in the same channel with "Pong!"
    } else if(msg.content === "!pong") { // Otherwise, if the message is "!pong"
        bot.createMessage(msg.channel.id, "Ping!");
        // Respond with "Ping!"
    }
});

bot.connect(); // Get the bot to connect to Discord
```

More examples can be found in [the examples folder](https://github.com/projectdysnomia/dysnomia/tree/master/examples).

Useful Links
------------

- [The official Project Dysnomia server](https://discord.gg/2uUvgJzgCE) is the best place to get support.
- [The GitHub repo](https://github.com/projectdysnomia/dysnomia) is where development primarily happens.
- [The NPM package webpage](https://npmjs.com/package/@projectdysnomia/dysnomia) is, well, the webpage for the NPM package.

License
-------

Refer to the [LICENSE](LICENSE) file.
