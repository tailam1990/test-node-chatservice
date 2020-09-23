const mysql = require('mysql2/promise');
const Config = require('../config');

/** Global connection pool */
let pool;

/**
 * Create connection pool and test connection
 * 
 * @returns promise resolving to the test query result
 */
function createPool() {
    pool = mysql.createPool({
        host: Config.MYSQL_DB_HOST,
        port: Config.MYSQL_DB_PORT,
        user: Config.MYSQL_DB_USER,
        password: Config.MYSQL_DB_PASS,
        database: Config.MYSQL_DB_NAME,
        connectionLimit: Config.MYSQL_DB_CONNECTION_POOL_SIZE || Config.DEFAULT_DB_CONNECTION_POOL_SIZE,
        acquireTimeout: Config.MYSQL_DB_CONNECTION_TIMEOUT || Config.DEFAULT_DB_CONNECTION_TIMEOUT
    });
    
    // Test connection
    return pool.execute('SELECT 1');
}

/**
 * Get connection from pool
 * 
 * @returns promise resolving to the new connection
 */
function connect() {
    return pool.getConnection();
}

/**
 * Execute a prepared statement and release connection back to pool
 * 
 * @param {string} sql - SQL to execute as prepared statement
 * @param {any[]} param - array of parameters to be bound to prepared statement
 * @returns promise resolving to query result
 */
function execute(sql, param, conn) {
    return (conn || pool).execute(sql, param).then(([result, fields]) => {
        return result;
    });
}

/**
 * Insert record into table represented by cls.
 * First key defined in cls will be filled with the insert ID if insert table has auto increment column
 * 
 * @param {any} cls - class reference
 * @param {any} obj - columns to be inserted into
 * @returns values
 */
function insertCls(cls, obj, conn) {
    let query = cls.insertQuery(obj);
    return execute(query.sql, query.param, conn).then(result => {
        if (obj.key && obj.key.length > 0 && result.insertId != null) {
            obj[obj.key[0]] = result.insertId;
        }
        return obj;
    });
}

/**
 * Insert record into table represented by cls.
 * All properties of obj are inserted into their corresponding columns
 * The first key defined in obj will be filled with the insert ID if insert table has auto increment column
 * 
 * @param {any} obj - object to be inserted
 * @returns number of rows affected
 */
function insert(obj, conn) {
    return insertCls(obj.class, obj, conn);
}

/**
 * Select all properties of cls from table. The where clause is specified by cols
 * 
 * @param {any} cls - class reference to map query result
 * @param {any} where - where clause object
 * @returns array of cls instances
 */
function select(cls, where, conn) {
    let query = cls.selectQuery(where);
    return execute(query.sql, query.param, conn).then(result => {
        return result.map(r => new cls(r));
    });
}

/**
 * Select all properties of cls from table. The where clause is specified by cols.
 * 
 * @param {any} cls - class reference to map query result
 * @param {any} where - where clause object
 * @returns first record returned from query, null if none found
 */
function selectFirst(cls, where, conn) {
    return select(cls, where, conn).then(result => result[0] || null);
}

/**
 * Determines if record exists
 * 
 * @param {any} cls - class reference
 * @param {any} where - where clause object
 * @returns true if exists, false otherwise
 */
function exists(cls, where, conn) {
    let query = cls.selectQuery(where);
    return execute('SELECT EXISTS(' + query.sql + ')', query.param, cls, conn).then(result => {
        return result[0] > 0;
    });
}

/**
 * Update rows in table represented by cls. The where clause is specified by cols
 * 
 * @param {any} cls - class reference
 * @param {any} set - set property object
 * @param {any} where - where clause object
 * @returns number of rows updated
 */
function updateCls(cls, set, where, conn) {
    let query = cls.updateQuery(set, where);
    return execute(query.sql, query.param, conn).then(result => {
        return result.affectedRows;
    });
}

/**
 * Update a single row specified by all properties of obj
 * 
 * @param {any} obj - object to update in table
 * @returns number of rows updated
 */
function update(obj, conn) {
    if (obj.key == null || !obj.key.length) {
        throw new Error('No key to update object with');
    }
    let where = {};
    obj.key.forEach(k => where[k] = obj[k]);
    return updateCls(obj.class, obj, where, conn);
}
 
function deleteFn(cls, where, conn) {
    let query = cls.deleteQuery(where);
    return execute(query.sql, query.param, conn).then(result => {
        return result.affectedRows;
    });
}

/**
 * Executes input function within a transaction, commit on success, rollback on error
 * 
 * @param {Function} fn 
 * @returns promise resolving to return value of fn
 */
function executeTrx(fn) {
    return connect().then(conn => {
        return conn.beginTransaction().then(_ => {
            return Promise.resolve(fn(conn)).then(result => {
                return conn.commit().then(_ => result);
            }).catch(ex => {
                return conn.rollback().then(_ => Promise.reject(ex));
            });
        }).finally(_ => {
            conn.release();
        });
    });
}

function close() {
    return pool ? pool.end() : Promise.resolve();
}

module.exports = {
    createPool,
    connect,
    execute,
    insert,
    select,
    selectFirst,
    exists,
    update,
    delete: deleteFn,
    executeTrx,
    close
}