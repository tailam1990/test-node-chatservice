const TableModel = require('./table-model');

class ChannelUserMapping extends TableModel {
    
    constructor(o) {
        super();
        this.channel_id = null;
        this.user_id = null;

        if (o != null) {
            this.assignObject(o);
        }
    }
}
module.exports = ChannelUserMapping;