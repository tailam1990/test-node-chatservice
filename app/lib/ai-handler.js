/**
 * Enable switching between multiple AI services by modifying the AI_SERVICE .env setting. 
 * New service interface modules can be added to the aiService object map.
 */

const dialogflow = require('./dialogflow');
const { AI_SERVICE } = require('../config');
const aiService = {
    DIALOGFLOW: dialogflow
}[AI_SERVICE.toUpperCase()];

module.exports = {
    aiService: aiService,
    send: aiService.send
}