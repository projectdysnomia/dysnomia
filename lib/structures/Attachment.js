"use strict";

const Base = require("./Base");
const Collection = require("../util/Collection");
const User = require("./User");

/**
 * Represents an attachment
 * @extends Base
 */
class Attachment extends Base {
    /**
     * The attachment ID
     * @override
     * @member {String} Attachment#id
     */

    /**
     * A collection of users participating in a clip. Will be empty if this attachment isn't a clip
     * @type {Collection<User>}
     */
    clipParticipants = new Collection();

    constructor(data, client) {
        super(data.id);

        /**
         * The filename of the attachment
         * @type {String}
         */
        this.filename = data.filename;
        /**
         * The size of the attachment
         * @type {Number}
         */
        this.size = data.size;
        /**
         * The URL of the attachment
         * @type {String}
         */
        this.url = data.url;
        /**
         * The proxy URL of the attachment
         * @type {String}
         */
        this.proxyURL = data.proxy_url;
        /**
         * The duration of the audio file (voice messages only)
         * @type {Number?}
         */
        this.durationSecs = data.duration_secs;
        /**
         * A Base64-encoded byte array representing the sampled waveform of the audio file (voice messages only)
         * @type {String?}
         */
        this.waveform = data.waveform;
        /**
         * The application appearing in the clip
         * @type {Object?}
         */
        this.application = data.application;
        /**
         * The timestamp of clip creation
         * @type {Number?}
         */
        this.clipCreatedAt = data.clip_created_at != null ? Date.parse(data.clip_created_at) : null;
        data.clip_participants?.forEach((participant) => {
            this.clipParticipants.add(client.options.restMode ? new User(participant, client) : client.users.update(participant, client));
        });

        this.update(data);
    }

    update(data) {
        if(data.title !== undefined) {
            /**
             * The title of the attachment
             * @type {String?}
             */
            this.title = data.title;
        }
        if(data.description !== undefined) {
            /**
             * The description of the attachment
             * @type {String?}
             */
            this.description = data.description;
        }
        if(data.content_type !== undefined) {
            /**
             * The content type of the attachment
             * @type {String?}
             */
            this.contentType = data.content_type;
        }
        if(data.height !== undefined) {
            /**
             * The height of the attachment
             * @type {Number?}
             */
            this.height = data.height;
        }
        if(data.width !== undefined) {
            /**
             * The width of the attachment
             * @type {Number?}
             */
            this.width = data.width;
        }
        if(data.ephemeral !== undefined) {
            /**
             * Whether the attachment is ephemeral
             * @type {Boolean?}
             */
            this.ephemeral = data.ephemeral;
        }
        if(data.flags !== undefined) {
            /**
             * Attachment flags. See [Discord's documentation](https://discord.com/developers/docs/resources/channel#attachment-object-attachment-flags) for a list of them
             * @type {Number?}
             */
            this.flags = data.flags;
        }
        if(data.placeholder !== undefined) {
            /**
             * A [thumbhash](https://evanw.github.io/thumbhash/) placeholder for the image
             * @type {String?}
             */
            this.placeholder = data.placeholder;
        }
        if(data.placeholder_version !== undefined) {
            /**
             * The version of the placeholder
             * @type {Number?}
             */
            this.placeholderVersion = data.placeholder_version;
        }
    }

    toJSON(props = []) {
        return super.toJSON([
            "filename",
            "description",
            "contentType",
            "size",
            "url",
            "proxyURL",
            "height",
            "width",
            "ephemeral",
            "durationSecs",
            "waveform",
            "flags",
            "placeholder",
            "placeholderVersion",
            "application",
            "clipCreatedAt",
            "participants",
            ...props
        ]);
    }
}

module.exports = Attachment;
