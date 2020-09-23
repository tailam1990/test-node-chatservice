const TableModel = require('./table-model');

class DialogSubject extends TableModel {
    
    constructor(o) {
        super();
        this.dialog_id = null;
        this.dialog_subject_value = null;

        if (o != null) {
            this.assignObject(o);
        }
    }
}
module.exports = DialogSubject;