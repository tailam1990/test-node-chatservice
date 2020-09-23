const { xml, Client } = require('@xmpp/client');
const { BOT_USERNAME, BOT_PASSWORD, XMPP_CLIENT_PORT, XMPP_DOMAIN } = require('../config');
const { Channel, UserType } = require('../constant');
const logger = require('../utils/logger');
const { enumToString } = require('../utils/string');
const TextMessageEvent = require('../models/text-message-event');
const userDao = require('../db/user');
const uuid = require('uuid/v1');
const xmppApi = require('../utils/xmpp-api');

/** XMPP session cache */
const sessions = new Map();

/** Bot XMPP client */
let botClient;

// One session map for each channel
Object.keys(Channel).forEach(c => sessions.set(Channel[c], new Map()));

// +-------------+
// | Bot Account |
// +-------------+

function connectBot() {
    return getClient(Channel.XMPP, BOT_USERNAME).then(client => {
        botClient = client;
        return Promise.resolve(botClient);
    });
}

function connectAgents() {
    return userDao.get().then(users => {
        return Promise.all(users.map(user => connectClient(Channel.XMPP, user.user_name)));
    });
}

// +--------------+
// | User Account |
// +--------------+

/**
 * Send message from message handler to XMPP user.
 * 
 * This function is used to send message through the XMPP server from the 
 * message handler to an agent on behalf of a client. An XMPP user is 
 * created by the message handler for the client if none exists.
 * message.message_sender_id is the client's ID on the external messenger system, 
 * not the JID
 * 
 * @param {Message} message 
 * @returns Promise resolving to send result
 */
function send(message) {
    return getClient(message.message_from_channel_id, message.message_sender_id).then(client => {
        return client.send(
            xml('message', {
                xmlns: 'jabber:client',
                type: 'chat',
                from: client.jid.toString(),
                to: toJID(message.message_recipient_id)
            }, xml('body', {}, message.message_body))
        );
    });
}

module.exports = {
    send: send,
    connectBot: connectBot,
    connectAgents: connectAgents
}

// Circular dependency
const messageHandler = require('./message-handler');

/**
 * Get the client from cache if found. Otherwise, check if client XMPP account exists,
 * connect the XMPP user if it does, create one otherwise.
 * Client objects are cached on creation/connection, removed on disconnection/error.
 * 
 * @param {number} channelId channel ID of the client to search for
 * @param {string} clientId client ID to search for
 * @returns promise resolving to the connected client object
 */
function getClient(channelId, clientId) {
    if (hasSession(channelId, clientId)) {
        return Promise.resolve(getSession(channelId, clientId));
    } else {
        return clientExists(clientId).then(exists => {
            if (exists) {
                return connectClient(channelId, clientId);
            } else {
                return createClient(channelId, clientId);
            }
        });
    }
}

/**
 * Create XMPP client for the message sender, connect to it and cache the client object in memory.
 * Client object is removed on client error or disconnect event. 
 * 
 * @param {number} channelId channel ID of the connecting client
 * @param {string} clientId client ID for the newly created client
 * @returns promise resolving to the created client object
 */
function createClient(channelId, clientId) {
    return xmppApi.put(`/user/${toJID(clientId)}`, {
        user: {
            password: BOT_PASSWORD,
            email: ' '
        }
    }).then(_ => {
        return connectClient(channelId, clientId);
    });
}

/**
 * Check if the specified client exists in XMPP server.  
 * The clientId is converted into JID before passing to the server.
 * 
 * @param {string} clientId client ID to search for
 * @returns promise resolving to true if clientId exists in XMPP server
 */
function clientExists(clientId) {
    return xmppApi.get(`/user/${toJID(clientId)}`).then(user => {
        return Promise.resolve(user && user.user);
    }).catch(ex => {
        return Promise.resolve(false);
    });
}

/**
 * Connect XMPP client from channel ID and client ID.
 * The client to be connected can be a customer or bot
 * 
 * @param {string} channelId channel ID of the client
 * @param {string} clientId client ID to be connected
 * @returns connected client
 */
function connectClient(channelId, clientId) {
    let client = new Client();

    // Incoming stanza
    client.on('stanza', el => {
        logger.debug('STANZA#', el);
        if (el.is('presence') && el.attrs.from === client.jid.toString()) {
            logger.info(`${client.jid.toString()} available, ready to receive <message/>`);
        } else if (el.is('message')) {
            logger.debug(el);
            let parsed = parseMessage(el);
            if (parsed.text) {
                messageHandler.emit(parsed.event, new TextMessageEvent({
                    channelId: channelId,
                    dialogId: null, // TODO: set dialog ID
                    messageId: uuid(),
                    messageText: parsed.text,
                    recipientId: clientId,
                    senderId: parsed.from,
                    senderType: parsed.senderType
                }));
            }
        }
    });

    let onlinePromise = new Promise(resolve => {
        client.on('online', jid => {
            client.send(xml('presence'));
            setSession(channelId, clientId, client);
            resolve(client);
        });
    });

    client.handle('authenticate', authenticate => {
        // Note: clientId is not the JID, it should be the JID with domain name removed
        return authenticate(clientId, BOT_PASSWORD);
    });

    client.on('error', err => {
        logger.error(err.toString());

        // TODO: Check if errored client can still listen on events, will leak memory otherwise
        deleteSession(channelId, clientId);
        
        // TODO: retry connection? This will probably work if erroed client no longer listen on events
        // connectClient(channelId, clientId);

        // Notify client on error
        messageHandler.sendToClient(channelId, clientId, 'Connection error');
    });

    client.on('status', (status, value) => {
        logger.debug('STATUS#', status, value);
    });

    client.on('disconnect', status => {
        // TODO: Check if disconnected client can still listen on events
        deleteSession(channelId, clientId);
        logger.info(status, 'disconnected');
    });

    client.on('input', data => logger.trace('INPUT#', data));
    client.on('output', data => logger.trace('OUTPUT#', data));
    client.on('element', data => logger.debug('ELEMENT#', data));
    client.on('send', data => logger.debug('SEND#', data));

    client.handle('bind', bind => {
        return bind(enumToString(Channel, channelId));
    });

    return client.start({
        uri: `xmpp://localhost:${XMPP_CLIENT_PORT}`,
        domain: XMPP_DOMAIN
    }).then(c => {
        logger.info(`connected`);
        return onlinePromise;
    });
}

/**
 * Convert Client ID into JID
 * 
 * @param {string} clientId 
 * @returns JID created from client ID, or the original 
 * string if it is already a JID
 */
function toJID(clientId) {
    return clientId.indexOf('@') < 0 ? `${clientId}@${XMPP_DOMAIN}` : clientId;
}

function toClientId(jid) {
    return jid.split('@')[0];
}

/**
 * Parse XMPP message object
 * 
 * @param {any} message 
 * @returns object containing message from, to, text and message event
 */
function parseMessage(message) {
    // Message stanza
    // "{"name":"message","attrs":{"xmlns":"jabber:client","type":"chat","from":"user1@localhost.xmpp/WEBSOCKET","to":"user1@localhost.xmpp"},"children":[{"name":"body","attrs":{},"children":["test"]}]}"
    // Typing message stanza, sent when client is typing
    // "{"name":"message","attrs":{"xmlns":"jabber:client","type":"chat","from":"user1@localhost.xmpp/converse.js-103085735","to":"customer1@localhost.xmpp"},"children":[{"name":"composing","attrs":{"xmlns":"http://jabber.org/protocol/chatstates"},"children":[]},{"name":"no-store","attrs":{"xmlns":"urn:xmpp:hints"},"children":[]},{"name":"no-permanent-store","attrs":{"xmlns":"urn:xmpp:hints"},"children":[]}]}"
    
    let textEvent = 'message-agent';
    if (message.attrs.to === botClient.jid.toString()) {
        textEvent = 'message-client';
    }

    let senderType = '';
    if (message.attrs.to === botClient.jid.toString()) {
        senderType = UserType.CUSTOMER;
    } else {
        senderType = UserType.BOT;  // or agent
    }

    let resource = '';
    if ((message.attrs.from || '').includes('/')) {
        resource = message.attrs.from.substring(message.attrs.from.lastIndexOf('/') + 1);
    }

    return {
        from: message.attrs.from,
        to: message.attrs.to,
        text: message.children.filter(c => c.name === 'body').reduce((s, c) => {
            return s += c.children.join(' ') + '\n';
        }, '').trim(),
        event: textEvent,
        senderType: senderType
    }
}

function getSessions() {
    return sessions;
}

function hasSession(channelId, clientId) {
    return sessions.get(channelId).has(clientId);
}

function getSession(channelId, clientId) {
    return sessions.get(channelId).get(clientId);
}

function setSession(channelId, clientId, session) {
    sessions.get(channelId).set(clientId, session);
}

function deleteSession(channelId, clientId) {
    sessions.get(channelId).delete(clientId);
}