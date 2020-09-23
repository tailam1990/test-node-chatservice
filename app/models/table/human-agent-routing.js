const TableModel = require('./table-model');

class HumanAgentRouting extends TableModel {
    
    constructor(o) {
        super();
        this.human_agent_routing_id = null;
        this.human_agent_routing_auto = null;
        this.human_agent_routing_event = null;
        this.human_agent_routing_event_option = null;

        if (o != null) {
            this.assignObject(o);
        }
    }

    get key() {
        return ['human_agent_routing_id'];
    }
}
module.exports = HumanAgentRouting;