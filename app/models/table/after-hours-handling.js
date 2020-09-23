const TableModel = require('./table-model');

class AfterHoursHandling extends TableModel {
    
    constructor(o) {
        super();
        this.after_hours_handling_id = null;
        this.after_hours_handling_from = null;
        this.after_hours_handling_to = null;
        this.after_hours_handling_creator_id = null;
        this.after_hours_handling_create_time = null;
        this.after_hours_handling_disable = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['after_hours_handling_id'];
    }
}
module.exports = AfterHoursHandling;