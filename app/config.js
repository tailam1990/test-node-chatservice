require('dotenv').config();

/**
 * Unified design configurations, system default and environment settings
 */
module.exports = {
    BOT_JID: `${process.env.BOT_USERNAME}@${process.env.XMPP_DOMAIN}`,

    DEFAULT_DB_CONNECTION_POOL_SIZE: 10,
    DEFAULT_DB_CONNECTION_TIMEOUT: 10000,

    // Facebook API
    FACEBOOK_API_URL: 'https://graph.facebook.com/v2.6/me/messages',

    // config.js must be at project root
    BASE_DIR: __dirname
}

Object.assign(module.exports, process.env);