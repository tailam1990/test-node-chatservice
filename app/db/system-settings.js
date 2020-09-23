const db = require('./db');
const SystemSetting = require('../models/table/system-setting');

module.exports = {
    getById: function(id) {
        return db.selectFirst(SystemSetting, { system_parameter_id: id });
    }
}