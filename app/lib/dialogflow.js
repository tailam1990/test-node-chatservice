const { DIALOGFLOW_PROJECT_ID, DIALOGFLOW_LANG } = require('../config');
const dialogflow = require('dialogflow');
const intentHandler = require('./intent-handler');
const logger = require('../utils/logger');

/**
 * Send message to DialogFlow, process intents and return its response
 * @param {Message} message 
 * @param {string} query 
 * @returns Promise resolving to AI response (fulfillment) text
 */
function send(message) {
    let sessionClient = new dialogflow.SessionsClient();
    let request = {
        session: sessionClient.sessionPath(DIALOGFLOW_PROJECT_ID, message.message_dialog_id.toString()),
        queryInput: { text: { text: message.message_body, languageCode: DIALOGFLOW_LANG } }
    };

    return sessionClient.detectIntent(request).then(responses => {
        return intentHandler.process(message, responses[0].queryResult);
    }).then(result => {
        return Promise.resolve(result.fulfillmentText);
    });
}

module.exports = {
    send: send
}