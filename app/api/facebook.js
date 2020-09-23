const { FB_VERIFY_TOKEN } = require('../config');
const { Channel, UserType } = require('../constant');
const express = require('express');
const logger = require('../utils/logger');
const messageHandler = require('../lib/message-handler');
const router = express.Router();
const TextMessageEvent = require('../models/text-message-event');

// Webhook authenication
router.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
        logger.info('Facebook webhook verified');
        res.status(200).send(req.query['hub.challenge']);
    } else {
        logger.error('Facebook webhook verification failed');
        res.status(403).end();
    }
});

// Incoming messages
router.post('/webhook', (req, res) => {
    logger.trace(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            let webhookEvent = entry.messaging[0];
            if (webhookEvent && webhookEvent.message) {
                logger.debug(webhookEvent);
                logger.info(`Received text from FB ${webhookEvent.message.text}`);
                messageHandler.emit('message-client', new TextMessageEvent({
                    channelId: Channel.FACEBOOK,
                    messageId: webhookEvent.message.mid,
                    recipientId: (webhookEvent.recipient || { id: null }).id,
                    response: res,
                    senderId: webhookEvent.sender.id,
                    senderType: UserType.CUSTOMER,
                    messageText: webhookEvent.message.text,
                    timestamp: webhookEvent.timestamp,
                }));
            } else {
                logger.info('Received empty FB webhook event');
            }
        });
    }
    res.sendStatus(200);
});

module.exports = router; 