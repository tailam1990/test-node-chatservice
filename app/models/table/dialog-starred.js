const TableModel = require('./table-model');

class DialogStarred extends TableModel {
    
    constructor(o) {
        super();
        this.dialog_starred_id = null;
        this.dialog_id = null;
        this.user_id = null;
        this.dialog_starred_status = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['dialog_starred_id'];
    }
}
module.exports = DialogStarred;