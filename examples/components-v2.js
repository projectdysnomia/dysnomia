const Dysnomia = require("@projectdysnomia/dysnomia");

const {Client, Constants} = Dysnomia;

// Replace TOKEN with your bot account's token
const bot = new Client("Bot TOKEN");

bot.on("ready", async () => { // When the bot is ready
    console.log("Ready!"); // Log "Ready!"

    // Register the commands
    await bot.bulkEditCommands([
        {
            name: "components-v2",
            description: "Shows an example message featuring v2 components",
            type: Constants.ApplicationCommandTypes.CHAT_INPUT
        }
    ]);
});

bot.on("error", (err) => {
    console.error(err); // or your preferred logger
});

bot.on("interactionCreate", async (interaction) => { // When an interaction is created
    if(interaction instanceof Dysnomia.CommandInteraction) { // If the interaction is a command interaction
        if(interaction.data.name === "components-v2") { // If the command name is "components-v2"
            // Send a message containing v2 components
            // Note that you cannot use "content" and "embeds" when sending v2 components
            await interaction.createMessage({
                flags: Constants.MessageFlags.IS_COMPONENTS_V2, // This flag is required to be able to send v2 components
                components: [
                    // A text display component displays text
                    {
                        type: Constants.ComponentTypes.TEXT_DISPLAY,
                        content: "# Welcome to Components v2!"
                    },
                    // A container component groups components together in a box, similar to an embed
                    {
                        type: Constants.ComponentTypes.CONTAINER,
                        accent_color: 0x008000,
                        components: [
                            {
                                type: Constants.ComponentTypes.TEXT_DISPLAY,
                                content: "A container groups content together, similar to an embed. It can have an accent color and various components included in it. You can find some files and images below."
                            },
                            // A media gallery components displays a bunch of media items (images, videos, etc.) in a grid
                            {
                                type: Constants.ComponentTypes.MEDIA_GALLERY,
                                items: [
                                    {
                                        media: {
                                            url: interaction.user.avatarURL // The URL of the media item. attachment:// URLs can also be used
                                        },
                                        description: `${interaction.user.username}'s avatar` // A media gallery item can have alt text attached to it
                                    }
                                ]
                            },
                            // A separator component creates a horizontal line in the message
                            {
                                type: Constants.ComponentTypes.SEPARATOR,
                                divider: true,
                                spacing: Constants.SeparatorSpacingSize.LARGE
                            },
                            // A section component displays text content with an optional accessory
                            {
                                type: Constants.ComponentTypes.SECTION,
                                components: [
                                    {
                                        type: Constants.ComponentTypes.TEXT_DISPLAY,
                                        content: "Above is a divider with large spacing, and your avatar is to the right of this text. v1 components are still supported in v2 messages. For example, here's an user select component:"
                                    }
                                ],
                                accessory: { // A thumbnail accessory displays an image to the right of the section
                                    type: Constants.ComponentTypes.THUMBNAIL,
                                    media: {
                                        url: interaction.user.avatarURL
                                    }
                                }
                            },
                            // An action row (v1 component)
                            {
                                type: Constants.ComponentTypes.ACTION_ROW,
                                components: [
                                    // A user select component allows the user to select a user
                                    {
                                        type: Constants.ComponentTypes.USER_SELECT,
                                        custom_id: "user_select",
                                        placeholder: "Select a user"
                                    }
                                ]
                            }
                        ]
                    },
                    // A file component displays a file attachment
                    {
                        type: Constants.ComponentTypes.FILE,
                        file: {
                            url: "attachment://hello_world.txt"
                        },
                        spoiler: true
                    },
                    {
                        type: Constants.ComponentTypes.SECTION,
                        components: [
                            {
                                type: Constants.ComponentTypes.TEXT_DISPLAY,
                                content: "A section can have a button displayed next to it."
                            }
                        ],
                        accessory: {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.PRIMARY,
                            custom_id: "click_me",
                            label: "Click me!"
                        }
                    }
                ],
                attachments: [{
                    filename: "hello_world.txt",
                    file: Buffer.from("Hello, world!")
                }]
            });
        }
    } else if(interaction instanceof Dysnomia.ComponentInteraction) { // If the interaction is a component interaction
        await interaction.createMessage({
            content: "A component interaction was received!",
            flags: Constants.MessageFlags.EPHEMERAL
        });
    }
});

bot.connect(); // Get the bot to connect to Discord
