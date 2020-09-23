const TableModel = require('./table-model');
const { MessageType } = require('../../constant');

class Message extends TableModel {

    constructor(o) {
        super();
        this.message_id = null;
        this.message_ref_id = null;
        this.message_dialog_id = null;
        this.message_from_channel_id = null;
        this.message_sender_id = null;
        this.message_sender_type = null;
        this.message_recipient_id = null;
        this.message_recipient_type = null;
        this.message_body = null;
        this.message_type = MessageType.TEXT;
        this.message_in_working_hours = 0;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['message_id'];
    }
}
module.exports = Message;