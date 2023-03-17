"use strict";

const Base = require("./Base");
const Member = require("./Member");

/**
* Represents a thread member
* @prop {Number} flags The user-thread settings of this member
* @prop {Member?} guildMember The guild member that this thread member belongs to
* @prop {String} id The ID of the thread member
* @prop {Number} joinTimestamp Timestamp of when the member joined the thread
* @prop {String} threadID The ID of the thread this member is a part of
*/
class ThreadMember extends Base {
    #client;
    constructor(data, client) {
        super(data.user_id);
        this.#client = client;
        this.flags = data.flags;
        this.threadID = data.thread_id || data.id; // Thanks Discord
        this.joinTimestamp = Date.parse(data.join_timestamp);

        if(data.member !== undefined) {
            if(data.member.id === undefined) {
                data.member.id = this.id;
            }

            const guild = this.#client.guilds.get(this.#client.threadGuildMap[this.threadID]);
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
        return this.#client.rest.leaveThread(this.threadID, this.id);
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
