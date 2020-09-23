const db = require('./db');
const AfterHoursHandling = require('../models/table/after-hours-handling');

module.exports = {
    inWorkingHour: function() {
        let now = new Date();
        // FIXME: this apparently won't work
        return db.exists(AfterHoursHandling, {
            after_hours_handling_from: { $lte: now },
            after_hours_handling_to: { $gte: now },
            after_hours_handling_disable: { $ne: 1 }
        });
    }
}