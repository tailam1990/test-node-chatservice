const db = require('./db');
const Customer = require('../models/table/customer');

/**
 * Get all customers
 * 
 * @returns list of all customers
 */
function get() {
    return db.select(Customer);
}

/**
 * Get dialog by customer_ref_id
 * 
 * @param {string} refId - customer_ref_id
 * @returns customer, null if not found
 */
function getByRefId(refId) {
    return db.selectFirst(Customer, { customer_ref_id: refId });
}

/**
 * Create customer
 * 
 * @param {string} refId - customer_ref_id
 * @returns new customer
 */
function create(refId) {
    return db.insert(new Customer({
        customer_ref_id: refId,
        customer_name: `Customer ${refId}`,   // Default hard-coded customer name
    }));
}

module.exports = {
    create,
    get,
    getByRefId
}