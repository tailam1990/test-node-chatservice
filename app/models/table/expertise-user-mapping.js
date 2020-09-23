const TableModel = require('./table-model');

class ExpertiseUserMapping extends TableModel {
    
    constructor(o) {
        super();
        this.expertise_id = null;
        this.user_id = null;

        if (o != null) {
            this.assignObject(o);
        }
    }
}
module.exports = ExpertiseUserMapping;