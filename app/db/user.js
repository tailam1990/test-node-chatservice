const db = require('./db');
const ChannelUserMapping = require('../models/table/channel-user-mapping');
const DialogSubjectKey = require('../models/table/dialog-subject-key');
const ExpertiseUserMapping = require('../models/table/expertise-user-mapping');
const Expertise = require('../models/table/expertise');
const User = require('../models/table/user');

module.exports = {
    get: function() {
        return db.select(User);
    },

    getById: function (id) {
        return db.selectFirst(User, { user_id: id });
    },

    getAgentByExpertiseChannel: function (dialogId, channel_id) {
        let query = `
            SELECT *
            FROM (
                SELECT u.user_id, u.user_jid, count(*) AS exp_count, MAX(u.user_current_chat_no) AS chat_no
                FROM ${User.tableName} u
                INNER JOIN ${ExpertiseUserMapping.tableName} eu ON eu.user_id = u.user_id
                INNER JOIN ${Expertise.tableName} e ON e.expertise_id = eu.expertise_id
                INNER JOIN ${DialogSubjectKey.tableName} dsk ON dsk.dialog_subject_value = e.expertise_name
                INNER JOIN ${ChannelUserMapping.tableName} cu ON cu.user_id = u.user_id;
                WHERE dsk.dialog_id = ? AND cu.channel_id = ?
                AND expertise_delete = 0 AND expertise_disable = 0 AND u.user_current_chat_no < u.user_chat_limit
                GROUP BY eu.user_id
                ORDER BY exp_count DESC, chat_no ASC
            ) t
            LIMIT 1
        `;
        return db.execute(query, [dialogId, channel_id]).then(rows => {
            return rows.length ? new User(rows[0]) : null;
        });
    },

    getAgentByExpertise: function (dialogId) {
        let query = `
            SELECT *
            FROM (
                SELECT u.user_id, u.user_jid, count(*) AS exp_count, MAX(u.user_current_chat_no) AS chat_no
                FROM user u
                INNER JOIN ${ExpertiseUserMapping.tableName} eu ON eu.user_id = u.user_id
                INNER JOIN ${Expertise.tableName} e ON e.expertise_id = eu.expertise_id
                INNER JOIN ${DialogSubjectKey.tableName} dsk ON dsk.dialog_subject_value = e.expertise_name
                WHERE dsk.dialog_id = ?
                AND expertise_delete = 0 AND expertise_disable = 0 AND u.user_current_chat_no < u.user_chat_limit
                GROUP BY eu.user_id
                ORDER BY exp_count DESC, chat_no ASC
            ) t
            LIMIT 1
        `;
        return db.execute(query, [dialogId, channel_id]).then(rows => {
            return rows.length ? new User(rows[0]) : null;
        });
    },

    getAgentByChannel: function (channel_id) {
        let query = `
            SELECT u.user_id, u.user_jid
            FROM ${User.tableName} u
            INNER JOIN ${ChannelUserMapping.tableName} cu ON cu.user_id = u.user_id
            WHERE cu.channel_id = ?
            AND u.user_current_chat_no < u.user_chat_limit
            ORDER BY user_current_chat_no ASC
            LIMIT 1
        `;
        return db.execute(query, [channel_id]).then(rows => {
            return rows.length ? new User(rows[0]) : null;
        });
    },

    updateChatNo: function (userId) {
        let query = `
            UPDATE ${User.tableName} 
            SET user_current_chat_no = user_current_chat_no + 1 
            WHERE user_id = ?
        `;
        return db.execute(query, [userId]);
    }
}
