class Query {
    /**
     * Creates an instance of Query.
     * @param {any} sql - SQL query
     * @param {any} param - array of values to bind to the query
     * @memberof Statement
     */
    constructor(sql, param) {
        this.sql = sql;
        this.param = param;
        if (sql == null || param == null) {
            throw new Error('SQL or param is null: ' + col);
        }
    }
}

module.exports = Query;