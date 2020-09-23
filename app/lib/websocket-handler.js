const { BOT_USERNAME } = require('../config');
const { Channel, UserType } = require('../constant');
const jwt = require('../utils/jwt');
const logger = require('../utils/logger');
const TextMessageEvent = require('../models/text-message-event');
const uuid = require('uuid/v1');

/** Web socket client sessions */
const sessions = new Map();

module.exports = {
    startServer: startServer,
    send: send
}

/**
 * Send message through web socket connection
 * 
 * @returns empty promise
 */
function send(recipientId, messageText) {
    if (sessions.has(recipientId)) {
        sessions.get(recipientId).emit('message', messageText);
    } else {
        logger.warn(`Recipient ID ${recipientId} not found`)
    }
    return Promise.resolve();
}

// +------------------+
// | Websocket server |
// +------------------+

// Circular dependency
const messageHandler = require('./message-handler');

/**
 * Start web socket server instance
 * @param {any} io Socket.io instance
 */
function startServer(io) {
    io.on('connection', socket => {
        let sessionData = {};
        // Authenticate user supplied token
        socket.on('setuser', data => {
            logger.info(`Socket ${socket.id} connected`);
            sessionData.username = data;
            sessions.set(data, socket);
            socket.emit('message', `Welcome ${data}`);
        });
        // Message received
        socket.on('message', data => {
            if (!sessionData.username) {
                if (socket.handshake.query.access_token && jwt.verify(socket.handshake.query.access_token)) {
                    // Reset session
                    let data = jwt.extractData(socket.handshake.query.access_token);
                    sessionData.username = data.username;
                    sessions.set(data.username, socket);
                } else {
                    // Invalid token, notify user to reconnect
                    socket.emit('message', 'Connection lost: please reconnect');
                }
            }

            if (sessionData.username) {
                messageHandler.emit('message-client', new TextMessageEvent({
                    channelId: Channel.WEBSOCKET,
                    messageId: uuid(),
                    messageText: data,
                    recipientId: BOT_USERNAME,
                    senderId: sessionData.username,
                    senderType: UserType.CUSTOMER,
                    sessionId: socket.id
                }));
            } else {
                logger.warn(`Socket ${socket.id} Message received without username`);
            }
        });
        // Disconnect and remove client from session cache
        socket.on('disconnect', _ => {
            logger.debug(`${this.username} disconnected`);
            sessions.delete(this.username);
        });
    });
}