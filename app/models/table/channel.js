const TableModel = require('./table-model');

class Channel extends TableModel {
    
    constructor(o) {
        super();
        this.channel_id = null;
        this.channel_name = null;
        this.channel_create_time = null;
        this.channel_creator_id = null;
        this.channel_last_modified_time = null;
        this.channel_last_modifier = null;
        this.channel_disable = null;
        this.channel_delete = null;
        this.channel_code = null;
        this.channel_type = null;
        this.channel_app_secret = null;
        this.channel_verify_token = null;
        this.channel_page_access_token = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['channel_id'];
    }
}
module.exports = Channel;