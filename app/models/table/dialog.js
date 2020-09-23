const TableModel = require('./table-model');

class Dialog extends TableModel {

    constructor(o) {
        super();
        this.dialog_id = null;
        this.dialog_ref_id = null;
        this.dialog_is_urgent = 0;
        this.dialog_name = null;
        this.dialog_fallback_count = 0;
        this.dialog_request_help = 0;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['dialog_id'];
    }
}
module.exports = Dialog;