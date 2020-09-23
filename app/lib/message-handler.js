const aiHandler = require('./ai-handler');
const afterHoursHandlingDao = require('../db/after-hours-handling');
const chatRouter = require('../lib/chat-router');
const { BOT_USERNAME, FACEBOOK_API_URL, FB_ACCESS_TOKEN, DLG_FALLBACK } = require('../config');
const { Channel, FBMessageType, UserType } = require('../constant');
const customerDao = require('../db/customer');
const { dateDiff } = require('../utils/datetime');
const dialogDao = require('../db/dialog');
const dialogUserMappingDao = require('../db/dialog-user-mapping');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const logger = require('../utils/logger');
const messageDao = require('../db/message');
const QueueClient = require('../models/queue-client');
const request = require('request-promise-native');
const sensitiveDataFilter = require('./sensitive-data-filter');
const TextMessageEvent = require('../models/text-message-event');
const xmpp = require('./xmpp-handler');

eventEmitter.on('message-client', event => {
    logger.info(`Client message arrived: ${event.timestamp}, ${dateDiff(event.timestamp)} ms`);
    handleClientMessage(event).then(result => {
        if (event.response) {
            event.response.sendStatus(200);
        }
    }).catch(ex => {
        logger.error(ex);
        if (event.response) {
            event.response.status(500).send(`Unable to handle message <pre>${ex.stack}</pre>`);
        }
    });
});

eventEmitter.on('message-agent', event => {
    logger.info(`Agent message arrived: ${event.timestamp}, ${dateDiff(event.timestamp)} ms`);
    handleAgentMessage(event).then(result => {
        // TODO: handle result?
    }).catch(ex => {
        logger.error(ex);
    });
});

function validateMessage(event) {
    let valid = true;
    if (event.messageId == null) {
        logger.warn('Missing message ID');
        valid = false;
    }
    if (event.senderId == null) {
        logger.warn('Missing sender ID');
        valid = false;
    }
    if (event.channelId == null) {
        logger.warn('Missing channel ID');
        valid = false;
    }
    if (event.recipientId == null) {
        logger.warn('Missing recipient ID');
        valid = false;
    }
    if (event.messageText == null) {
        logger.warn('Missing message text');
        valid = false;
    }
    return valid;
}

/**
 * Customer message handler, raised when messages are received from customer
 * 
 * Messages are saved to the database for archiving purpose. The following
 * cases are handled by this handler:
 * 
 * - Webhook / Websocket client -> Bot
 *  - No XMPP traffic involved
 * - Webhook / Websocket client -> XMPP agent
 *  - Client messages arrive from POST / web socket and are sent to agent using XMPP protocol
 * - XMPP client -> XMPP agent
 *  - Messages between the two parties require no handling
 * - XMPP client -> XMPP Bot
 *  - Client messages are sent to bot XMPP client directly
 * 
 * @param {TextMessageEvent} event 
 */
async function handleClientMessage(event) {
    let message = await messageDao.getByRefId(event.messageId);

    // Ignore already handled message
    if (message == null) {
        if (!validateMessage(event)) { return Promise.reject('Invalid message'); }

        // Get client by ref ID, create one if none found
        let customer =
            await customerDao.getByRefId(event.senderId) ||
            await customerDao.create(event.senderId);

        // Get previous dialogs from this customer or create dialog if none exists
        let dialog =
            (event.dialogId ? await dialogDao.getById(event.dialogId) : null) ||
            await dialogDao.getByCustomerRefId(customer.customer_ref_id) ||
            await dialogDao.create(customer.customer_ref_id, event.channelId);

        // Get assigned agent for this dialog
        let agentId = (await dialogUserMappingDao.getAgent(dialog.dialog_id) || {}).ref_id;

        // Apply sensitive data filtering before and send to AI
        event.messageText = await sensitiveDataFilter.filter(event.messageText);
        event.inWorkingHour = await afterHoursHandlingDao.inWorkingHour();
        event.recipientId = agentId || BOT_USERNAME;

        message = await messageDao.createFromEvent(dialog.dialog_id, event);
        message.timestamp = event.timestamp;

        // If message is XMPP and has assigned agent, no handling is required
        // If help required or fallback intent threshold exceeded, route to agent
        // Otherwise, send message to AI
        if (agentId) {
            return event.channelId === Channel.XMPP ? Promise.resolve() : sendToAgent(message);
        } else if (dialog.dialog_request_help || dialog.dialog_fallback_count >= DLG_FALLBACK) {
            return routeToAgent(dialog, customer, event.channelId);
        } else {
            return sendToAI(message);
        }
    } else {
        logger.warn(`Message ignored: Duplicate message ID ${event.messageId}`)
    }
}

/**
 * Agent message handler, raised when messages are received from agents or bot
 * 
 * Messages are saved to the database for archiving purpose. The following
 * cases are handled by this handler:
 * 
 * - Bot/Agent -> Webhook / Websocket client
 *  - Messages are redirected to client through POST / web socket
 * - Bot/Agent -> XMPP client
 *  - Direct XMPP communications, requires no handling
 * 
 * @param {TextMessageEvent} event 
 * @returns promise resolving to the the send result if customer is not an 
 * XMPP client, otherwise return an empty promise
 */
async function handleAgentMessage(event) {
    if (!validateMessage(event)) { return Promise.reject('Invalid message'); }

    // Get customer from recipient ID.  Agent is assumed to never proactively initiate a dialog and send message to 
    // customer, a customer must already exists prior to receiving response from agent
    let customer = await customerDao.getByRefId(event.recipientId);
    if (customer == null) {
        throw new Error(`No customer found for ID ${event.recipientId}`);
    }

    // Get previous dialogs from this customer or create dialog if none exists
    let dialog =
        await dialogDao.getByCustomerRefId(customer.customer_ref_id) ||
        await dialogDao.create(customer.customer_ref_id, channelId);

    // Archive message
    await messageDao.createFromEvent(dialog.dialog_id, event);

    // If client is XMPP client, no handling is required
    if (event.channelId === Channel.XMPP) {
        return Promise.resolve();
    } else {
        return sendToClient(event.channelId, event.recipientId, event.messageText);
    }
}

function sendToAgent(message) {
    return xmpp.send(message);
}

function routeToAgent(dialog, customer, channelId) {
    return chatRouter.routeToAgent(
        new QueueClient(
            dialog.dialog_id,
            dialog.dialog_ref_id,
            channelId,
            customer.customer_ref_id,
            customer.customer_name
        )
    );
}

function sendToAI(message) {
    return aiHandler.send(message).then(aiResponse => {
        logger.info(`MID ${message.message_id} AI Response: ` + (new Date().getTime() - message.timestamp + ' ms'));
        eventEmitter.emit('message-agent', new TextMessageEvent({
            channelId: message.message_from_channel_id,
            messageId: message.message_ref_id,
            messageText: aiResponse,
            recipientId: message.message_sender_id,
            senderId: BOT_USERNAME,
            senderType: UserType.BOT
        }));
        return Promise.resolve();
    });
}

function emit(event, data) {
    eventEmitter.emit(event, data);
}

module.exports = {
    emit: emit,
    sendToClient: sendToClient
}

// +-------------------------+
// | Client message delivery |
// +-------------------------+

// Circular dependency
const webSocket = require('./websocket-handler');

/**
 * Send message to client on specified channel
 * 
 * @param {number} channelId 
 * @param {string} recipientId the recipient ID recognized by the specified channel, not the JID
 * @param {string} messageText 
 * @returns promise resolving to send message result
 */
function sendToClient(channelId, recipientId, messageText) {
    switch (channelId) {
        case Channel.WEBSOCKET:
            return sendToWebSocket(recipientId, messageText);
        case Channel.FACEBOOK:
            return sendToFacebook(recipientId, messageText);
        case Channel.WECHAT:
            return sendToWechat(recipientId, messageText);
        case Channel.XMPP:
            return sendToXMPP(recipientId, messageText);
        default:
            return Promise.reject(`No channel found for message_id: ${message.message_id}`);
    }
}

function sendToFacebook(recipientId, messageText) {
    return request.post(FACEBOOK_API_URL, {
        qs: {
            access_token: FB_ACCESS_TOKEN
        },
        body: {
            messaging_type: FBMessageType.UPDATE,   // TODO: determine correct FB messagetype
            recipient: { id: recipientId },   //sender_psid
            message: { text: messageText }
        }
    });
}

function sendToWechat(recipientId, messageText) {
    // TODO: implement this
    return Promise.resolve();
}

function sendToWebSocket(recipientId, messageText) {
    return webSocket.send(recipientId, messageText);
}

function sendToXMPP(recipientId, messageText) {
    // TODO: implement this
    return Promise.resolve();
}