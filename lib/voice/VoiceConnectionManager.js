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
        const pending = this.pendingGuilds[data.guild_id];
        if(pending?.timeout) {
            clearTimeout(pending.timeout);
            pending.timeout = null;
        }
        let connection = this.get(data.guild_id);
        if(!connection) {
            if(!pending) {
                return;
            }
            connection = this.add(new this.baseObject(data.guild_id, {
                shard: data.shard,
                opusOnly: pending.options.opusOnly ?? this.options.opusOnly,
                udpTimeout: pending.options.udpTimeout ?? this.options.udpTimeout,
                decryptionFailureTolerance: pending.options.decryptionFailureTolerance ?? this.options.decryptionFailureTolerance,
                shared: pending.options.shared,
                daveEncryption: pending.options.daveEncryption ?? this.options.daveEncryption,
                ws: pending.options.ws ?? this.options.ws
            }));
        }
        connection.connect({
            channel_id: (pending || connection).channelID,
            endpoint: data.endpoint,
            token: data.token,
            session_id: data.session_id,
            user_id: data.user_id
        });
        if(!pending || pending.waiting) {
            return;
        }
        pending.waiting = true;
        const disconnectHandler = (err) => {
            connection = this.get(data.guild_id);
            if(connection) {
                connection.removeListener("ready", readyHandler);
                connection.removeListener("error", errorHandler);
            }
            pending.rej(err || new Error("Disconnected"));
            if(this.pendingGuilds[data.guild_id] === pending) {
                delete this.pendingGuilds[data.guild_id];
            }
        };
        const readyHandler = () => {
            connection = this.get(data.guild_id);
            if(connection) {
                connection.removeListener("disconnect", disconnectHandler);
                connection.removeListener("error", errorHandler);
            }
            pending.res(connection);
            if(this.pendingGuilds[data.guild_id] === pending) {
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
            pending.rej(err);
            if(this.pendingGuilds[data.guild_id] === pending) {
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
