const { LOG_LEVEL, LOG_STACKTRACE } = require('../config');
const { getTimeStr } = require('./datetime');
const { LogLevel } = require('../constant');
const LOG_LEVEL_INT = LogLevel[LOG_LEVEL.toUpperCase()];
const LOG_FN_NAME = false;

function log(...message) {
    // Replace with new logging method / library if necessary
    console.log.apply(console, [getTimeStr(), ...message]);
}

function warn(...message) {
    console.warn.apply(console, [getTimeStr(), '[WARN]', ...message]);
}

function info(...message) {
    console.log.apply(console, [getTimeStr(), '[INFO]', ...message]);
}

function error(...message) {
    console.error.apply(console, [getTimeStr(), '[ERROR]', ...message]);
}

function debug(...message) {
    console.debug.apply(console, [getTimeStr(), '[DEBUG]', ...message]);
}

function trace(...message) {
    console.trace.apply(console, [getTimeStr(), '[TRACE]', ...message]);
}

function getStackTraceInfo(offset = 3) {
    if (LOG_STACKTRACE) {
        let error = (new Error().stack).split('\n')[offset];
        let [, functionName, filePath] = /([^\s]*)\s+\(?([^\s]+:[0-9]+:[0-9]+)\)?/.exec(error.trim().substring(2)) || [, '', ''];
        let paths = filePath.split('/');
        return {
            functionName: LOG_FN_NAME ? trim(functionName) : '',
            fileName: trim(paths[paths.length - 1])
        };
    } else {
        return [];
    }
}

module.exports = {
    trace: LogLevel.TRACE <= LOG_LEVEL_INT ? trace : function () { },
    debug: LogLevel.DEBUG <= LOG_LEVEL_INT ? debug : function () { },
    error: LogLevel.ERROR <= LOG_LEVEL_INT ? error : function () { },
    warn: LogLevel.WARN <= LOG_LEVEL_INT ? warn : function () { },
    info: LogLevel.INFO <= LOG_LEVEL_INT ? info : function () { },
    log: log
}