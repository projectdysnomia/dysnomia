"use strict";

const Interaction = require("./Interaction");
const {InteractionResponseTypes} = require("../Constants");

/**
* Represents a ping interaction. See Interaction for more properties.
* @extends Interaction
*/
class PingInteraction extends Interaction {
    #client;
    constructor(data, client) {
        super(data, client);
        this.#client = client;
    }

    /**
    * Acknowledges the ping interaction with a pong response.
    * Note: You can **not** use more than 1 initial interaction response per interaction.
    * @returns {Promise}
    */
    acknowledge() {
        return this.pong();
    }

    /**
    * Acknowledges the ping interaction with a pong response.
    * Note: You can **not** use more than 1 initial interaction response per interaction.
    * @returns {Promise}
    */
    pong() {
        if(this.acknowledged === true) {
            throw new Error("You have already acknowledged this interaction.");
        }
        return this.#client.createInteractionResponse.call(this.#client, this.id, this.token, {
            type: InteractionResponseTypes.PONG
        }).then(() => this.update());
    }

}

module.exports = PingInteraction;
