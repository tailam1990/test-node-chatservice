const sensitiveDataFilterDao = require('../db/sensitive-data-filter');

module.exports = {
    /**
     * Censors input string by applying all active sensitive data rules
     * 
     * @param {string} data - Data string to be censored
     * @returns promise resolving to the censored string
     */
    filter: function (data) {
        return sensitiveDataFilterDao.get().then(ruleList => {
            return Promise.resolve(ruleList.reduce((d, r) => {
                return d.replace(new RegExp(r.rule_pattern, 'g'), r.rule_action);
            }, data));
        });
    }
}