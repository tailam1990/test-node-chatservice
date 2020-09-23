const db = require('./db');
const Message = require('../models/table/message');

function createFromEvent(dialogId, messageEvent) {
    return create(
        dialogId,
        messageEvent.messageId,
        messageEvent.channelId,
        messageEvent.senderId,
        messageEvent.recipientId,
        messageEvent.messageText,
        messageEvent.inWorkingHours
    )
}

function create(dialogId, refId, channelId, senderId, recipientId, messageText, workingHours) {
    return db.insert(new Message({
        message_ref_id: refId,
        message_dialog_id: dialogId,
        message_from_channel_id: channelId,
        message_sender_id: senderId,
        message_body: messageText,
        message_type: 'text',
        message_recipient_id: recipientId,
        message_in_working_hours: workingHours ? 1 : 0
    }));
}

function getByRefId(refId) {
    return db.selectFirst(Message, { message_ref_id: refId });
}

function getByDialogId(dialogId) {
    return db.selectFirst(Message, { dialog_id: dialogId });
}

module.exports = {
    createFromEvent,
    create,
    getByRefId,
    getByDialogId
}
