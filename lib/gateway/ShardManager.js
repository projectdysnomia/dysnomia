"use strict";

const Base = require("../structures/Base");
const Collection = require("../util/Collection");
const Shard = require("./Shard");
const Constants = require("../Constants");
let ZlibSync;
try {
    ZlibSync = require("zlib-sync");
} catch{
    try {
        ZlibSync = require("pako");
    } catch{ // eslint-disable no-empty
    }
}
class ShardManager extends Collection {
    #client;
    buckets = new Map();
    connectQueue = [];
    connectTimeout = null;

    constructor(client, options = {}) {
        super(Shard);
        this.#client = client;
        this.options = Object.assign({
            autoreconnect:        true,
            compress:             false,
            connectionTimeout:    30000,
            disableEvents:        {},
            firstShardID:         0,
            getAllUsers:          false,
            guildCreateTimeout:   2000,
            intents:              Constants.Intents.allNonPrivileged,
            largeThreshold:       250,
            maxReconnectAttempts: Infinity,
            maxResumeAttempts:    10,
            maxConcurrency:       1,
            maxShards:            1,
            seedVoiceConnections: false,
            requestTimeout:       15000,
            reconnectDelay:       ((lastDelay, attempts) => Math.pow(attempts + 1, 0.7) * 20000)
        }, options);

        if(typeof this.options.intents !== "undefined") {
            // Resolve intents option to the proper integer
            if(Array.isArray(this.options.intents)) {
                let bitmask = 0;
                for(const intent of this.options.intents) {
                    if(Constants.Intents[intent]) {
                        bitmask |= Constants.Intents[intent];
                    } else if(typeof intent === "number") {
                        bitmask |= intent;
                    } else {
                        this.#client.emit("warn", `Unknown intent: ${intent}`);
                    }
                }
                this.options.intents = bitmask;
            }

            // Ensure requesting all guild members isn't destined to fail
            if(this.options.getAllUsers && !(this.options.intents & Constants.Intents.guildMembers)) {
                throw new Error("Cannot request all members without guildMembers intent");
            }
        }

        if(this.options.lastShardID === undefined && this.options.maxShards !== "auto") {
            this.options.lastShardID = this.options.maxShards - 1;
        }

        if(typeof window !== "undefined" || !ZlibSync) {
            this.options.compress = false; // zlib does not like Blobs, Pako is not here
        }
    }

    connect(shard) {
        this.connectQueue.push(shard);
        this.tryConnect();
    }

    spawn(id) {
        let shard = this.get(id);
        if(!shard) {
            shard = this.add(new Shard(id, this.#client));
            shard.on("ready", () => {
                /**
                * Fired when a shard turns ready
                * @event Client#shardReady
                * @prop {Number} id The ID of the shard
                */
                this.#client.emit("shardReady", shard.id);
                if(this.#client.ready) {
                    return;
                }
                for(const other of this.values()) {
                    if(!other.ready) {
                        return;
                    }
                }
                this.#client.ready = true;
                this.#client.startTime = Date.now();
                /**
                * Fired when all shards turn ready
                * @event Client#ready
                */
                this.#client.emit("ready");
            }).on("resume", () => {
                /**
                * Fired when a shard resumes
                * @event Client#shardResume
                * @prop {Number} id The ID of the shard
                */
                this.#client.emit("shardResume", shard.id);
                if(this.#client.ready) {
                    return;
                }
                for(const other of this.values()) {
                    if(!other.ready) {
                        return;
                    }
                }
                this.#client.ready = true;
                this.#client.startTime = Date.now();
                this.#client.emit("ready");
            }).on("disconnect", (error) => {
                /**
                * Fired when a shard disconnects
                * @event Client#shardDisconnect
                * @prop {Error?} error The error, if any
                * @prop {Number} id The ID of the shard
                */
                this.#client.emit("shardDisconnect", error, shard.id);
                for(const other of this.values()) {
                    if(other.ready) {
                        return;
                    }
                }
                this.#client.ready = false;
                this.#client.startTime = 0;
                /**
                * Fired when all shards disconnect
                * @event Client#disconnect
                */
                this.#client.emit("disconnect");
            });
        }
        if(shard.status === "disconnected") {
            return this.connect(shard);
        }
    }

    tryConnect() {
        // nothing in queue
        if(this.connectQueue.length === 0) {
            return;
        }

        // loop over the connectQueue
        for(const shard of this.connectQueue) {
            // find the bucket for our shard
            const rateLimitKey = (shard.id % this.options.maxConcurrency) || 0;
            const lastConnect = this.buckets.get(rateLimitKey) || 0;

            // has enough time passed since the last connect for this bucket (5s/bucket)?
            // alternatively if we have a sessionID, we can skip this check
            if(!shard.sessionID && Date.now() - lastConnect < 5000) {
                continue;
            }

            // Are there any connecting shards in the same bucket we should wait on?
            if(this.some((s) => s.connecting && ((s.id % this.options.maxConcurrency) || 0) === rateLimitKey)) {
                continue;
            }

            // connect the shard
            shard.connect();
            this.buckets.set(rateLimitKey, Date.now());

            // remove the shard from the queue
            const index = this.connectQueue.findIndex((s) => s.id === shard.id);
            this.connectQueue.splice(index, 1);
        }

        // set the next timeout if we have more shards to connect
        if(!this.connectTimeout && this.connectQueue.length > 0) {
            this.connectTimeout = setTimeout(() => {
                this.connectTimeout = null;
                this.tryConnect();
            }, 500);
        }
    }

    _readyPacketCB(shardID) {
        const rateLimitKey = (shardID % this.options.maxConcurrency) || 0;
        this.buckets.set(rateLimitKey, Date.now());

        this.tryConnect();
    }

    toString() {
        return `[ShardManager ${this.size}]`;
    }

    toJSON(props = []) {
        return Base.prototype.toJSON.call(this, [
            "buckets",
            "connectQueue",
            "connectTimeout",
            "options",
            ...props
        ]);
    }
}

module.exports = ShardManager;
