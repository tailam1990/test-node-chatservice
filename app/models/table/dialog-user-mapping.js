const TableModel = require('./table-model');

class DialogUserMapping extends TableModel {
    
    constructor(o) {
        super();
        this.dialog_id = null;
        this.ref_id = null;
        this.ref_type = null;

        if (o != null) {
            this.assignObject(o);
        }
    }
}
module.exports = DialogUserMapping;