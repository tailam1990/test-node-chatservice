const TableModel = require('./table-model');

class SensitiveDataRule extends TableModel {
    
    constructor(o) {
        super();
        this.rule_id = null;
        this.rule_name = null;
        this.rule_description = null;
        this.rule_pattern = null;
        this.rule_action = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['rule_id'];
    }
}
module.exports = SensitiveDataRule;