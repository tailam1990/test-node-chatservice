const db = require('./db');
const DialogSubject = require('../models/table/dialog-subject-key');

module.exports = {
    /**
     * Get dialog subject by dialog_id
     * @param {number} dialogId - dialog_id
     * @returns list of DialogSubject
     */
    getByDialogId: function(dialogId) {
        return db.select(DialogSubject, { dialog_id: dialogId });
    }
}