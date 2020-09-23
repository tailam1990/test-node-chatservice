const db = require('./db');
const SensitiveDataRule = require('../models/table/sensitive-data-rule');

module.exports = {
    get: function() {
        return db.select(SensitiveDataRule, {
            rule_delete: { $ne: 1 },
            rule_disable: { $ne: 1 }
        });
    }
}