const chatRouter = require('../chat-router');
const dialogDao = require('../../db/dialog');
const { DLG_FALLBACK } = require('../../config');
const logger = require('../../utils/logger');
const QueueClient = require('../../models/queue-client');

/**
 * Process default fallback intent.  Increment number of fallback intent 
 * detected from the dialog associated with the current message.  If the
 * fallback count exceeds threshold, route the chat session to an available agent
 * 
 * @param {Message} message 
 * @param {any} result 
 * @returns promise resolving to result
 */
async function process(message, result) {
    logger.debug(result.intent.displayName);
    try {
        let dialog = await dialogDao.getById(message.message_dialog_id);
        if (dialog) {
            dialog.dialog_fallback_count++;
            await dialogDao.update(dialog);
        }
        if (dialog.dialog_fallback_count >= DLG_FALLBACK) {
            await chatRouter.routeToAgent(
                new QueueClient(
                    message.message_dialog_id,
                    null,
                    message.message_from_channel_id,
                    message.message_sender_id,
                    `channel ${message.message_from_channel_id} customer`
                )
            );
        }
    } catch (ex) {
        logger.error('Fail to process intent', ex);
    }
    return Promise.resolve(result);
}

module.exports = {
    process: process
}