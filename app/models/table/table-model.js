const db = require('../../db/db');
const Query = db.Query;
const { filterToSQL } = require('../../utils/sql');
// These are cached as global variables since there are no static class variables.
// Properties are cached as Object.keys do not guarantee order
// TL: let me know if there is a better solution
var properties = {};
var tableName = {};

/** 
 * Filenames of base models derived classes must match its representing table name
 * Table names of table-models are loaded on server startup, based on filenames
 * They are not defined in their respective class declaration since it is retrived as static variables
 */
class TableModel {

    constructor() {

    }

    /**
     * Returns the name of the table represented by this class
     * @readonly
     * @static
     * @memberof TableModel
     */
    static get tableName() {
        return tableName[this.name];
    }

    /**
     * Initialize static properties of models
     * @static
     * @memberof TableModel
     */
    static init(table) {
        properties[this.name] = Object.keys(new this);
        tableName[this.name] = table;
    }

    /**
     * Returns CSV of class member names.
     * Object.keys() does not guarantee order so it is cached as global
     * @readonly
     * @static
     * @memberof TableModel
     */
    static get properties() {
        return properties[this.name];
    }

    /**
     * Generate select query for this model
     * @static
     * @param {Where[]} where - optional where clause
     * @returns query
     * @memberof TableModel
     */
    static selectQuery(where) {
        let whereClause = filterToSQL(where);
        return new Query(
            'SELECT ' + properties[this.name].join(',')
            + ' FROM ' + tableName[this.name]
            + whereClause.sql,
            whereClause.params
        );
    }

    /**
     * Generate update query for this model
     * @static
     * @param {any} obj - object to update table with
     * @param {Where[]} where - optional where clause
     * @returns query
     * @memberof TableModel
     */
    static updateQuery(obj, where) {
        let whereClause = filterToSQL(where);
        return new Query(
            'UPDATE ' + tableName[this.name]
            + ' SET ' + properties[this.name].map(p => p + '=?').join(',')
            + whereClause.sql,
            properties[this.name].map(p => obj[p]).concat(whereClause.params)
        );
    }

    /**
     * Generate insert query for this model
     * @static
     * @param {any} obj 
     * @returns query
     * @memberof TableModel
     */
    static insertQuery(obj) {
        let list = properties[this.name].filter(p => !obj.autoId || !obj.autoId.includes(p));
        return new Query(
            'INSERT INTO ' + tableName[this.name] + '(' + list.join(',') + ')'
            + ' VALUES(' + list.map(p => '?').join(',') + ')',
            list.map(p => obj[p])
        );
    }

    static deleteQuery(where) {
        let whereClause = filterToSQL(where);
        return new Query(
            'DELETE FROM ' + tableName[this.name] + whereClause.sql,
            whereClause.params
        );
    }

    /**
     * Returns class of the object
     * @returns class reference
     * @memberof TableModel
     */
    get class() {
        return this.constructor;
    }

    /**
     * Return list of primary keys for this table object for update and delete
     */
    get key() {
        return [];
    }

    /**
     * Assign target object's non-undefined properties to itself
     * @param {any} o object to assign from
     */
    assignObject(o) {
        Object.keys(o).forEach(k => {
            if (o[k] !== undefined) {
                this[k] = o[k];
            }
        });
    }
}

module.exports = TableModel;