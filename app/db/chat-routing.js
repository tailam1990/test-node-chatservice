const db = require('./db');
const ChatRouting = require('../models/table/chat-routing');

module.exports = {
    get: function() {
        return db.select(ChatRouting, { chat_routing_disable: { $ne: 1 } }).then(rows => {
            return rows[0] || null;
        });
    }
}