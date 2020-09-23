const TableModel = require('./table-model');

class Role extends TableModel {

    constructor(o) {
        super();
        this.role_id = null;
        this.role_name = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['role_id'];
    }
}
module.exports = Role;