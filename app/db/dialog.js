const db = require('./db');
const Dialog = require('../models/table/dialog');
const dialogChannelMappingDao = require('./dialog-channel-mapping');
const DialogUserMapping = require('../models/table/dialog-user-mapping');
const dialogUserMappingDao = require('./dialog-user-mapping');
const { UserType } = require('../constant');

/**
 * Get last dialog by customer ID
 * @param {string} customerId - customer_ref_id
 * @returns a single dialog if exists, null otherwise
 */
function getByCustomerRefId(customerId) {
    let columns = Dialog.properties.map(p => 'd.' + p).join(',');
    let query = `
        SELECT ${columns}
        FROM ${Dialog.tableName} d
        INNER JOIN ${DialogUserMapping.tableName} m ON m.dialog_id = d.dialog_id
        WHERE ref_id = ?
        ORDER BY d.dialog_id DESC
    `;
    return db.execute(query, [customerId]).then(rows => {
        return rows.map(r => new Dialog(r))[0] || null;
    });
}

/**
 * Get dialog by dialogId
 * @param {number} dialogId 
 */
function getById(dialogId) {
    return db.selectFirst(Dialog, { dialog_id: dialogId });
}

/**
 * Check if any agent is assigned to the dialog
 * @param {number} dialogId 
 * @returns true if at least one agent is assigned to the dialog
 */
function hasAgent(dialogId) {
    return db.exists(DialogUserMapping, {
        ref_type: UserType.AGENT,
        dialog_id: dialogId
    });
}

/**
 * Update fallback count of dialog
 * @param {number} dialogId 
 * @param {number} count increment amount, can be positive or negative
 * @returns number of rows affected
 */
function updateFallbackCount(dialogId, count) {
    let query = `
        UPDATE ${Dialog.tableName}
        SET dialog_fallback_count = dialog_fallback_count + ?
        WHERE dialog_id = ?
    `;
    return db.execute(query, [dialogId, count]);
}

/**
 * Add user / participant to dialog
 * @param {number} dialogId 
 * @param {string} userId 
 * @param {string} userType 
 * @returns number of rows affected
 */
function addUser(dialogId, userId, userType) {
    return db.insert(new DialogUserMapping({
        dialog_id: dialogId,
        ref_id: userId,
        ref_type: userType
    }));
}

/**
 * Update dialog
 * @param {Dialog} dialog
 * @returns number of row(s) updated
 */
function update(dialog) {
    return db.update(dialog);
}

function create(customerRefId, channelId) {
    return db.executeTrx(conn => {
        return db.insert(new Dialog(), conn).then(dialog => {
            return dialogUserMappingDao.create(dialog.dialog_id, customerRefId, UserType.CUSTOMER, conn).then(_ => {
                return dialogUserMappingDao.create(dialog.dialog_id, '3', UserType.BOT, conn);
            }).then(_ => {
                return dialogChannelMappingDao.create(dialog.dialog_id, channelId, conn);
            });
        });
    });
}

module.exports = {
    getByCustomerRefId,
    getById,
    hasAgent,
    updateFallbackCount,
    addUser,
    update,
    create
}