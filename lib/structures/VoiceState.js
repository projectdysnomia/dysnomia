"use strict";

const Base = require("./Base");

/**
* Represents a member's voice state in a guild
* @extends Base
*/
class VoiceState extends Base {
    /**
     * The ID of the member
     * @member {String} VoiceState#id
     */
    constructor(data) {
        super(data.id);
        /**
         * Whether the member is server muted or not
         * @type {Boolean}
         */
        this.mute = false;
        /**
         * Whether the member is server deafened or not
         * @type {Boolean}
         */
        this.deaf = false;
        /**
         * Timestamp of the member's latest request to speak
         * @type {Number?}
         */
        this.requestToSpeakTimestamp = null;
        /**
         * Whether the member is self muted or not
         * @type {Boolean}
         */
        this.selfMute = false;
        /**
         * Whether the member is self deafened or not
         * @type {Boolean}
         */
        this.selfDeaf = false;
        /**
         * Whether the member is streaming using "Go Live"
         * @type {Boolean}
         */
        this.selfStream = false;
        /**
         * Whether the member's camera is enabled
         * @type {Boolean}
         */
        this.selfVideo = false;
        /**
         * Whether the member is suppressed or not
         * @type {Boolean}
         */
        this.suppress = false;
        this.update(data);
    }

    update(data) {
        if(data.channel_id !== undefined) {
            /**
             * The ID of the member's current voice channel
             * @type {String?}
             */
            this.channelID = data.channel_id;
            /**
             * The ID of the member's current voice session
             * @type {String?}
             */
            this.sessionID = data.channel_id === null ? null : data.session_id;
        } else if(this.channelID === undefined) {
            this.channelID = this.sessionID = null;
        }
        if(data.mute !== undefined) {
            this.mute = data.mute;
        }
        if(data.deaf !== undefined) {
            this.deaf = data.deaf;
        }
        if(data.request_to_speak_timestamp !== undefined) {
            this.requestToSpeakTimestamp = Date.parse(data.request_to_speak_timestamp);
        }
        if(data.self_mute !== undefined) {
            this.selfMute = data.self_mute;
        }
        if(data.self_deaf !== undefined) {
            this.selfDeaf = data.self_deaf;
        }
        if(data.self_video !== undefined) {
            this.selfVideo = data.self_video;
        }
        if(data.self_stream !== undefined) {
            this.selfStream = data.self_stream;
        }
        if(data.suppress !== undefined) { // Bots ignore this
            this.suppress = data.suppress;
        }
    }

    toJSON(props = []) {
        return super.toJSON([
            "channelID",
            "deaf",
            "mute",
            "requestToSpeakTimestamp",
            "selfDeaf",
            "selfMute",
            "selfStream",
            "selfVideo",
            "sessionID",
            "suppress",
            ...props
        ]);
    }
}

module.exports = VoiceState;
