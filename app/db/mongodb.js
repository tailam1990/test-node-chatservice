const MongoClient = require('mongodb').MongoClient;
const Config = require('../config');
let dbClient;
let dbo;

/**
 * Open a new connection
 *
 * @returns Promise resolving to the connection instance
 */
function connect() {
    return MongoClient.connect(`mongodb://${Config.MONGODB_DB_USER}:${Config.MONGODB_DB_PASS}@${Config.MONGODB_DB_HOST}:${Config.MONGODB_DB_PORT}/${Config.MONGODB_DB_NAME}`, { useNewUrlParser: true });
}

/**
 * Open a new connection and cache the connection instance. This instance is
 * shared by all queries unless a separate instance is passed to the query function
 *
 * @returns Promise resolving to the DB client instance
 */
function createPool() {
    return connect().then(db => {
        dbClient = db;
        dbo = db.db(Config.MONGODB_DB_NAME);
        return dbClient;
    });
}

function insert(obj, conn = dbo) {
    return conn.collection(obj.class.tableName).insert(obj);
}

function select(cls, where, conn = dbo) {
    return conn.collection(cls.tableName).find(where).toArray();
}

function selectFirst(cls, where, conn = dbo) {
    return conn.collection(cls.tableName).findOne(where).then(result => {
        return result != null ? new cls(result) : null;
    });
}

function exists(cls, where, conn = dbo) {
    return selectFirst(cls, where, conn).then(result => result != null);
}

function update(obj, conn = dbo) {
    let set = Object.assign({}, obj);
    let where = {};

    obj.key.forEach(k => {
        delete set[k];
        where[k] = obj[k];
    });

    return updateCls(obj.class, set, where, conn);
}

function updateCls(cls, set, where, conn = dbo) {
    return conn.collection(cls.tableName).update(where, { $set: set }).then(result => {
        return result.result.n;
    });
}

function deleteFn(cls, where, conn = dbo) {
    return conn.collection(cls.tableName).deleteMany(where);
}

function executeTrx(fn) {
    const session = dbClient.startSession();
    const opts = { session, returnOriginal: false };
    session.startTransaction();

    return Promise.resolve(fn(dbo, opts)).then(result => {
        return session.commitTransaction().then(_ => result);
    }).catch(ex => {
        return session.abortTransaction().then(_ => Promise.reject(ex));
    }).finally(async _ => {
        session.endSession();
    });
}

function close() {
    return dbClient != null ? dbClient.close() : Promise.resolve();
}

module.exports = {
    createPool,
    connect,
    insert,
    select,
    selectFirst,
    exists,
    update,
    delete: deleteFn,
    executeTrx,
    close
}