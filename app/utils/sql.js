/**
 * Parses simple structured NoSQL filter into SQL
 * 
 * @param {any} f MongoDB filter
 * @returns Query object
 */
function filterToSQL(f) {
    if (f != null) {
        let res = parseExpr(f);
        return {
            sql: ' WHERE ' + res.map(r => r.sql).join(' AND '),
            params: res.map(r => r.params).reduce((a, b) => [...a, ...b])
        };
    } else {
        return {
            sql: '',
            params: []
        }
    }
}

function parseExpr(expr) {
    return Object.entries(expr).map(([k, v]) => {
        let sep = '';
        let rel = '=';
        let col = '';
        let not = '';

        switch (k) {
            case '$or':
                sep = ' OR ';
                break;
            case '$and':
                sep = ' AND ';
                break;
            case '$lt':
                rel = '<';
                break;
            case '$lte':
                rel = '<=';
                break;
            case '$gt':
                rel = '>';
                break;
            case '$gte':
                rel = '>=';
                break;
            case '$eq':
                rel = '=';
                break;
            case '$ne':
                rel = '!=';
                break;
            case '$not':
                not = 'NOT ';
                break;
            case '$nor':
                not = 'NOT ';
                sep = ' OR ';
                break;
            case '$inc':
                // TODO:
                break;
            default:
                col = `\`${k}\``;
                if (typeof v === 'string' && v.includes('%')) {
                    rel = 'LIKE';
                }
        }

        if (Array.isArray(v)) {
            let parsed = v.map(x => parseExpr(x));
            return {
                sql: not + '(' + parsed.map(p => p[0].sql).join(sep) + ')',
                params: parsed.map(p => p[0].params).reduce((a, b) => [...a, ...b], [])
            };
        } else if (typeof v === 'object') {
            let parsed = parseExpr(v)[0];
            return {
                sql: `${not} ${col} ${parsed.sql}`.trim(),
                params: parsed.params
            };
        } else {
            return {
                sql: `${not} ${col} ${rel} ?`.trim(),
                params: [v]
            };
        }
    });
}

module.exports = {
    filterToSQL
}