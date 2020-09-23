require('dotenv').config();

const express = require('express');
const app = express();

const adminApi = require('./api/admin');
const bodyParser = require('body-parser');
const { SERVER_PORT } = require('./config');
const db = require('./db/db');
const facebookApi = require('./api/facebook');
const httpServer = require('http').Server(app);
const io = require('socket.io')(httpServer);
const { initModels, initDBConnection, initXMPP } = require('./utils/init');
const logger = require('./utils/logger');
const webSocket = require('./lib/websocket-handler');
const webApi = require('./api/web');
const wechatApi = require('./api/wechat');

// Post body parser
app.use(bodyParser.json());

// API/Webhook endpoints
app.use('/admin', adminApi);
app.use('/facebook', facebookApi);
app.use('/web', webApi);
app.use('/wechat', wechatApi);

// Default route
app.get('/', (req, res) => {
	res.send('Chatbot service online: ' + new Date());
});

// Start server on successful DB connection
logger.log('[SERVER]', 'Starting chatbot service...');

// Initialize models
initModels().then(_ => {
    logger.log('[SERVER]', 'Connecting to database...');
    return initDBConnection();
}).then(_ => {
	logger.log('[SERVER]', 'Connecting bot XMPP client...');
	return initXMPP();
}).then(_ => {
	// Pre-initialization settings
	logger.log('[SERVER]', 'Initializing web socket server...');
	webSocket.startServer(io);
	logger.log('[SERVER]', 'HTTP server starting...');
	// Server startup
	httpServer.listen(SERVER_PORT, _ => {
		logger.log('[SERVER]', `Chatbot service listening on port ${SERVER_PORT}`);
	});
}).catch(ex => {
    logger.error(`Server startup failed: ${ex}`);
    shutdown();
	process.exit(1);
});

process.on('unhandledRejection', (reason, p) => {
	logger.warn(`Unhandled Rejection at: Promise ${p} reason: ${reason}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
    logger.log('[SERVER]', `Closing DB connection...`);
    db.close().then(_ => {
        logger.log('[SERVER]', `DB connection closed`);
    });
}
