const file = require('./file');
const { BASE_DIR } = require('../config');
const db = require('../db/db');
const xmpp = require('../lib/xmpp-handler');
require('promise.prototype.finally').shim();

/**
 * Initialize static properties of models
 * All DB entities are required to extend table-model
 * Table names of table-model are taken from the model's filenames 
 * with '-' replaced by '_' and .js stripped
 */
function initModels() {
    return new Promise((resolve, reject) => {
        try {
            let path = file.joinPath(BASE_DIR, '/models/table');
            file.ls(path).forEach(f => {
                if (f.indexOf('table-model') < 0) {
                    require(file.joinPath(path, f)).init(f.replace(/-/g, '_').replace('.js', ''));
                }
            });
            resolve();
        } catch (ex) {
            reject(ex);
        }
    });
}

function initDBConnection() {
    return db.createPool();
}

function initXMPP() {
    return xmpp.connectBot();
}

module.exports = {
    initModels,
    initDBConnection,
    initXMPP
}