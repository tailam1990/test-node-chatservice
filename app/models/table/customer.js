const TableModel = require('./table-model');

class Customer extends TableModel {
    
    constructor(o) {
        super();
        this.customer_id = null;
        this.customer_ref_id = null;
        this.customer_name = null;
        this.customer_jid = null;
        
        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['customer_id'];
    }
}
module.exports = Customer;