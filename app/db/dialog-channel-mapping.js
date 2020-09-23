const db = require('./db');
const DialogChannelMapping = require('../models/table/dialog-channel-mapping');

function create(dialogId, channelId, conn) {
    return db.insert(new DialogChannelMapping({
        dialog_id: dialogId,
        channel_id: channelId
    }), conn);
}

module.exports = {
    create
}