"use strict";

const Base = require("../structures/Base");
const Collection = require("../util/Collection");

class VoiceConnectionManager extends Collection {
    pendingGuilds = {};
    constructor(vcObject, options) {
        super(vcObject || require("./VoiceConnection"));
        this.options = Object.assign({
            daveEncryption: true,
            opusOnly: false,
            udpTimeout: 10000,
            decryptionFailureTolerance: 36,
            ws: undefined
        }, options);
    }

    join(guildID, channelID, options) {
        const connection = this.get(guildID);
        if(connection?.ws) {
            connection.switchChannel(channelID);
            if(connection.ready) {
                return Promise.resolve(connection);
            } else {
                return new Promise((res, rej) => {
                    const disconnectHandler = () => {
                        connection.removeListener("ready", readyHandler);
                        connection.removeListener("error", errorHandler);
                        rej(new Error("Disconnected"));
                    };
                    const readyHandler = () => {
                        connection.removeListener("disconnect", disconnectHandler);
                        connection.removeListener("error", errorHandler);
                        res(connection);
                    };
                    const errorHandler = (err) => {
                        connection.removeListener("disconnect", disconnectHandler);
                        connection.removeListener("ready", readyHandler);
                        connection.disconnect();
                        rej(err);
                    };
                    connection.once("ready", readyHandler).once("disconnect", disconnectHandler).once("error", errorHandler);
                });
            }
        }
        return new Promise((res, rej) => {
            this.pendingGuilds[guildID] = {
                channelID: channelID,
                options: options || {},
                res: res,
                rej: rej,
                timeout: setTimeout(() => {
                    delete this.pendingGuilds[guildID];
                    rej(new Error("Voice connection timeout"));
                }, 10000)
            };
        });
    }

    leave(guildID) {
        const connection = this.get(guildID);
        if(!connection) {
            return;
        }
        connection.disconnect();
        connection._destroy();
        this.remove(connection);
    }

    switch(guildID, channelID) {
        const connection = this.get(guildID);
        connection?.switch(channelID);
    }

    voiceServerUpdate(data) {
        if(this.pendingGuilds[data.guild_id]?.timeout) {
            clearTimeout(this.pendingGuilds[data.guild_id].timeout);
            this.pendingGuilds[data.guild_id].timeout = null;
        }
        let connection = this.get(data.guild_id);
        if(!connection) {
            if(!this.pendingGuilds[data.guild_id]) {
                return;
            }
            connection = this.add(new this.baseObject(data.guild_id, {
                shard: data.shard,
                opusOnly: this.pendingGuilds[data.guild_id].options.opusOnly ?? this.options.opusOnly,
                udpTimeout: this.pendingGuilds[data.guild_id].options.udpTimeout ?? this.options.udpTimeout,
                decryptionFailureTolerance: this.pendingGuilds[data.guild_id].options.decryptionFailureTolerance ?? this.options.decryptionFailureTolerance,
                shared: this.pendingGuilds[data.guild_id].options.shared,
                daveEncryption: this.pendingGuilds[data.guild_id].options.daveEncryption ?? this.options.daveEncryption,
                ws: this.pendingGuilds[data.guild_id].options.ws ?? this.options.ws
            }));
        }
        connection.connect({
            channel_id: (this.pendingGuilds[data.guild_id] || connection).channelID,
            endpoint: data.endpoint,
            token: data.token,
            session_id: data.session_id,
            user_id: data.user_id
        });
        if(!this.pendingGuilds[data.guild_id] || this.pendingGuilds[data.guild_id].waiting) {
            return;
        }
        this.pendingGuilds[data.guild_id].waiting = true;
        const disconnectHandler = (err) => {
            connection = this.get(data.guild_id);
            if(connection) {
                connection.removeListener("ready", readyHandler);
                connection.removeListener("error", errorHandler);
            }
            if(this.pendingGuilds[data.guild_id]) {
                this.pendingGuilds[data.guild_id].rej(err || new Error("Disconnected"));
                delete this.pendingGuilds[data.guild_id];
            }
        };
        const readyHandler = () => {
            connection = this.get(data.guild_id);
            if(connection) {
                connection.removeListener("disconnect", disconnectHandler);
                connection.removeListener("error", errorHandler);
            }
            if(this.pendingGuilds[data.guild_id]) {
                this.pendingGuilds[data.guild_id].res(connection);
                delete this.pendingGuilds[data.guild_id];
            }
        };
        const errorHandler = (err) => {
            connection = this.get(data.guild_id);
            if(connection) {
                connection.removeListener("disconnect", disconnectHandler);
                connection.removeListener("ready", readyHandler);
                connection.disconnect();
            }
            if(this.pendingGuilds[data.guild_id]) {
                this.pendingGuilds[data.guild_id].rej(err);
                delete this.pendingGuilds[data.guild_id];
            }
        };
        connection.once("ready", readyHandler).once("disconnect", disconnectHandler).once("error", errorHandler);
    }

    toString() {
        return "[VoiceConnectionManager]";
    }

    toJSON(props = []) {
        return Base.prototype.toJSON.call(this, [
            "pendingGuilds",
            ...props
        ]);
    }
}

module.exports = VoiceConnectionManager;
