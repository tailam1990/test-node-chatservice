class Where {
    /**
     * Creates an instance of where clause.
     * @param {any} col - column name
     * @param {any} val - column value for comparison
     * @param {any} rel - optional, relation for comparison, defaults to '='
     * @memberof Where
     */
    constructor(col, val, rel) {
        this.col = col;
        this.val = val;
        this.rel = rel || '=';
        if (val == null) {
            throw new Error('Where clause value is null: ' + col);
        }
    }
}

module.exports = Where;