const TableModel = require('./table-model');

class Team extends TableModel {
    
    constructor(o) {
        super();
        this.team_id = null;
        this.team_name = null;
        this.team_description = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['team_id'];
    }
}
module.exports = Team;