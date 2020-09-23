const TableModel = require('./table-model');

class DialogChannelMapping extends TableModel {
    
    constructor(o) {
        super();
        this.dialog_id = null;
        this.channel_id = null;

        if (o != null) {
            this.assignObject(o);
        }
    }
}
module.exports = DialogChannelMapping;