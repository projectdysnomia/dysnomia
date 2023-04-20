"use strict";

const Base = require("./Base");

/**
 * Represents an attachment
 * @prop {String?} contentType The content type of the attachment
 * @prop {String?} description The description of the attachment
 * @prop {Number?} durationSecs The duration of the audio file (voice messages only)
 * @prop {Boolean?} ephemeral Whether the attachment is ephemeral
 * @prop {String} filename The filename of the attachment
 * @prop {Number?} height The height of the attachment
 * @prop {String} id The attachment ID
 * @prop {String} proxyURL The proxy URL of the attachment
 * @prop {Number} size The size of the attachment
 * @prop {String} url The URL of the attachment
 * @prop {String?} waveform A Base64-encoded byte array representing the sampled waveform of the audio file (voice messages only)
 * @prop {Number?} width The width of the attachment
 */
class Attachment extends Base {
    constructor(data) {
        super(data.id);

        this.filename = data.filename;
        this.size = data.size;
        this.url = data.url;
        this.proxyURL = data.proxy_url;
        this.durationSecs = data.duration_secs;
        this.waveform = data.waveform;
        this.update(data);
    }

    update(data) {
        if(data.description !== undefined) {
            this.description = data.description;
        }
        if(data.content_type !== undefined) {
            this.contentType = data.content_type;
        }
        if(data.height !== undefined) {
            this.height = data.height;
        }
        if(data.width !== undefined) {
            this.width = data.width;
        }
        if(data.ephemeral !== undefined) {
            this.ephemeral = data.ephemeral;
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
            ...props
        ]);
    }
}

module.exports = Attachment;
