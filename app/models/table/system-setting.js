const TableModel = require('./table-model');

class SystemSetting extends TableModel {
    
    constructor(o) {
        super();
        this.system_setting_id = null;
        this.system_setting_value = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['system_setting_id'];
    }
}
module.exports = SystemSetting;