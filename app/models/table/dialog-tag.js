const TableModel = require('./table-model');

class DialogTag extends TableModel {
    
    constructor(o) {
        super();
        this.dialog_id = null;
        this.dialog_tags_string = null;

        if (o != null) {
            this.assignObject(o);
        }
    }
}
module.exports = DialogTag;