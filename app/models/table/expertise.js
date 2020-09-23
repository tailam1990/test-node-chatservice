const TableModel = require('./table-model');

class Expertise extends TableModel {
    
    constructor(o) {
        super();
        this.expertise_id = null;
        this.expertise_name = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['expertise_id'];
    }
}
module.exports = Expertise;