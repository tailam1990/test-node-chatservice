const logger = require('../utils/logger');
const file = require('../utils/file');
const dialogDao = require('../db/dialog');

/**
 * Intent processors are chosen based on intent names and should be placed in the 
 * intent/ directory
 * Spaces and underscores in intent names are replaced with dash, 
 * the resulting string in lowercase is then used to determine which processor to be run
 * 
 * For example, intent 'Default fallback_intent' will try load the default-fallback-intent.js
 * module in the intent/ directory
 */

/** Dynamically loaded intent processors */
const intentProcessors = file.ls(`${__dirname}/intent/`).reduce((m, f) => {
    let moduleName = file.toModuleName(f);
    m[moduleName] = require(file.joinPath(`${__dirname}/intent/`, moduleName));
    return m;
}, {});

/**
 * Handles intent and related business logic including dialog fallback handling
 * 
 * @param {Message} message 
 * @param {any} result 
 */
function process(message, result) {
    logger.debug(`  Query: ${result.queryText}`);
    logger.debug(`  Response: ${result.fulfillmentText}`);
    if (!result.intent) {
        logger.debug(`  No intent matched.`);
    } else {
        let processor = intentProcessors[file.toModuleName(result.intent.displayName)];
        if (processor) {
            return processor.process(message, result);
        }

        // Special case reset fallback count
        if (!result.intent.displayName.toUpperCase().includes('DEFAULT FALLBACK INTENT')) {
            dialogDao.updateFallbackCount(message.dialog_id, 0);
        }
    }
    return Promise.resolve(result);
}

module.exports = {
    process: process
}