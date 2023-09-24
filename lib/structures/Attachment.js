"use strict";

const Base = require("./Base");

/**
 * Represents an attachment
 * @extends Base
 */
class Attachment extends Base {
    /**
     * The attachment ID
     * @override
     * @member {Number} Attachment#id
     */

    constructor(data) {
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
        this.update(data);
    }

    update(data) {
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
            ...props
        ]);
    }
}

module.exports = Attachment;
