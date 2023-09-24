"use strict";

const Base = require("./Base");
const Member = require("./Member");

/**
* Represents a thread member
* @extends Base
*/
class ThreadMember extends Base {
    /**
     * The ID of the thread member
     * @member {String} ThreadMember#id
     */
    #client;
    constructor(data, client) {
        super(data.user_id);
        this.#client = client;
        /**
         * The user-thread settings of this member
         * @type {Number}
         */
        this.flags = data.flags;
        /**
         * The ID of the thread this member is a part of
         * @type {String}
         */
        this.threadID = data.thread_id || data.id; // Thanks Discord
        /**
         * Timestamp of when the member joined the thread
         * @type {Number}
         */
        this.joinTimestamp = Date.parse(data.join_timestamp);

        if(data.member !== undefined) {
            if(data.member.id === undefined) {
                data.member.id = this.id;
            }

            const guild = this.#client.guilds.get(this.#client.threadGuildMap[this.threadID]);
            /**
             * The guild member that this thread member belongs to
             * @type {Member?}
             */
            this.guildMember = guild ? guild.members.update(data.member, guild) : new Member(data.member, guild, client);
            if(data.presence !== undefined) {
                this.guildMember.update(data.presence);
            }
        }

        this.update(data);
    }

    update(data) {
        if(data.flags !== undefined) {
            this.flags = data.flags;
        }
    }

    /**
    * Remove the member from the thread
    * @returns {Promise}
    */
    leave() {
        return this.#client.leaveThread.call(this.#client, this.threadID, this.id);
    }

    toJSON(props = []) {
        return super.toJSON([
            "threadID",
            "joinTimestamp",
            ...props
        ]);
    }
}

module.exports = ThreadMember;
