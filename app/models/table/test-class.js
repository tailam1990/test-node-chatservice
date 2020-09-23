const TableModel = require('./table-model');

class TestClass extends TableModel {
    
    constructor(o) {
        super();
        this.id = null;
        this.name = null;
        this.serial = null;
        this.description = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['id'];
    }
}
module.exports = TestClass;