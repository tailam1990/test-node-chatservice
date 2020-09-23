const TableModel = require('./table-model');

class User extends TableModel {
    
    constructor(o) {
        super();
        this.user_id = null;
        this.user_name = null;
        this.user_job_title = null;
        this.user_email = null;
        this.user_chat_limit = null;
        this.user_login_name = null;
        this.user_password = null;
        this.user_status = null;
        this.user_jid = null;
        this.user_current_chat_no = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['user_id'];
    }
}
module.exports = User;