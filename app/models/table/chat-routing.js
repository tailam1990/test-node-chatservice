const TableModel = require('./table-model');

class ChatRouting extends TableModel {
    
    constructor(o) {
        super();
        this.chat_routing_id = null;
        this.chat_routing_channel = null;
        this.chat_routing_expert = null;
        this.chat_routing_behavior = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['chat_routing_id'];
    }
}
module.exports = ChatRouting;