const mysql = require('./mysql');
const mongodb = require('./mongodb');
const config = require('../config');
const Where = require('../models/where');
const Query = require('../models/query');
const dbService = {
    MYSQL: mysql,
    MONGODB: mongodb
}[config.DB_SERVICE.toUpperCase()];

module.exports = {
    createPool: dbService.createPool,
    connect: dbService.connect,
    execute: dbService.execute,
    insert: dbService.insert,
    select: dbService.select,
    selectFirst: dbService.selectFirst,
    exists: dbService.exists,
    update: dbService.update,
    delete: dbService.delete,
    executeTrx: dbService.executeTrx,
    close: dbService.close,
    Where: Where,
    Query: Query
}