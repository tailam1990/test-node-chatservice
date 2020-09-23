const db = require('./db');
const DialogUserMapping = require('../models/table/dialog-user-mapping');
const { UserType } = require('../constant');

function create(dialogId, refId, refType, conn) {
    return db.insert(new DialogUserMapping({
        dialog_id: dialogId,
        ref_id: refId,
        ref_type: refType
    }), conn);
}

function getAgent(dialogId, conn) {
    return db.selectFirst(DialogUserMapping, {
        dialog_id: dialogId,
        ref_type: UserType.AGENT
    }, conn);
}

module.exports = {
    create,
    getAgent
}