const chatRoutingDao = require('../db/chat-routing');
const { AGENT_RETRY_TIME } = require('../config');
const { UserType } = require('../constant');
const dialogUserMappingDao = require('../db/dialog-user-mapping');
const logger = require('../utils/logger');
const { setTimeout } = require('timers');
const userDao = require('../db/user');
const xmpp = require('./xmpp-handler');

const queue = [];
let isRunning = false;
let timer;

function startScheduler() {
    if (!isRunning && queue.length > 0) {
        timer = setTimeout(_ => run(), AGENT_RETRY_TIME);
        isRunning = true;
    }
}

function stopScheduler() {
    isRunning = false;
    if (timer) {
        timer.clearTimeout();
    }
}

/**
 * Run routing process on schedule (setTimeout)
 */
async function run() {
    logger.info('Chat router running...');

    let i = 0;
    let chatRouting = await chatRoutingDao.get();

    // Chat routing rule is required
    // Only one chat routing rule should be active, in the case of multiple
    // active rules, the first one returned from chat routing rule table will be chosen
    if (chatRouting == null) {
        logger.warn('No chat routing rules set up.  No agent chat routing will be done.');
    } else {
        while (queue[i] != null) {
            let assigned = await assignAgent(chatRouting, queue[i]);
            if (assigned) {
                dequeue(i);
            } else {
                i++;
            }
        }

        logger.info('Chat router finsihed...');
    }

    // Re-schedule only if the queue is not empty
    if (queue.length === 0) {
        stopScheduler();
    } else {
        timer = setTimeout(_ => run(), AGENT_RETRY_TIME);
    }
}

/**
 * Find the best matching agent based on chat routing rule:
 * - by expertise and channel
 * - by expertise only
 * - by channel only
 * 
 * All routing rules try to match the agent with the fewest active chat sessions
 * 
 * @param {QueueClient} client 
 * @returns promise resolving to true if agent assigment is successful
 */
function assignAgent(chatRouting, client) {
    return new Promise(async resolve => {
        let agent = null;

        try {
            logger.info(`Search agent for ${client.customerRefId}`);

            if (chatRouting.chat_routing_channel && chatRouting.chat_routing_expert) {
                agent = await userDao.getAgentByExpertiseChannel(client.dialogId, client.channelId);
            } else if (chatRouting.chat_routing_expert) {
                agent = await userDao.getAgentByExpertise(client.dialogId);
            } else if (chatRouting.chat_routing_channel) {
                agent = await userDao.getAgentByChannel(client.channelId);
            }

            if (agent) {
                await xmpp.send({
                    message_from_channel_id: client.channelId,
                    message_sender_id: client.customerRefId,
                    message_recipient_id: agent.user_jid,
                    message_body: `Chat routing from ${client.customerName}`
                });
                await dialogUserMappingDao.create(client.dialogId, agent.user_jid, UserType.AGENT);
                await userDao.updateChatNo(agent.user_id);

                logger.info(`Assiging agent ${agent.user_id} to ${client.customerRefId}`);
            } else {
                logger.info(`No agent found for ${client.customerRefId}`);
            }
        } catch (ex) {
            logger.error(ex);
        }
        resolve(agent != null);
    });
}

/**
 * Attempt to route the chat session to an agent if available.  If no
 * agent is available, enqueue the session for scheduled retries.
 * 
 * @param {QueueClient} client 
 * @returns promise resolving true if an agent is assigned
 */
function routeToAgent(client) {
    // Ignore client who are already in queue
    if (inQueue(client)) {
        return Promise.resolve(false);
    }

    return chatRoutingDao.get().then(chatRouting => {
        return chatRouting ? assignAgent(chatRouting, client) : Promise.resolve(false);
    }).then(success => {
        if (!success) {
            enqueue(client);
        }
        return Promise.resolve(success);
    });
}

/**
 * Enqueue client if not already in queue
 * 
 * @param {QueueClient} client 
 */
function enqueue(client) {
    startScheduler();
    if (!inQueue(client)) {
        queue.push(client);
        logger.info(`${client.customerRefId} enqueued for chat routing`);
    }
}

/**
 * Remove client at index i from queue
 * 
 * @param {number} i index in queue
 * @returns removed client
 */
function dequeue(i) {
    return queue.splice(i, 1)[0];
}

/**
 * Check if client is in queue, linearly check for customerRefId and channelId
 * 
 * @param {QueueClient} client 
 * @returns true if client is in queue
 */
function inQueue(client) {
    let exists = false;
    for (let i = 0; i < queue.length; i++) {
        if (queue[i].customerRefId === client.customerRefId && queue[i].channelId === client.channelId) {
            exists = true;
            break;
        }
    }
    return exists;
}

/**
 * Dequeue by client ID
 * 
 * @param {string} clientId 
 * @returns true if client is found and dequeued
 */
function dequeueClientId(clientId) {
    let client = null;
    for (let i = 0; i < queue.length; i++) {
        if (queue[0].customerRefId === clientId) {
            client = dequeue(i);
            break;
        }
    }
    return client != null;
}

// Start scheduler on startup
startScheduler();

module.exports = {
    startScheduler: startScheduler,
    stopScheduler: stopScheduler,
    routeToAgent: routeToAgent
}