let zeros = '000';
function getTimeStr() {
    let date = new Date();
    let h = pad(date.getHours(), 2);
    let m = pad(date.getMinutes(), 2);
    let s = pad(date.getSeconds(), 2);
    let d = pad(date.getDate(), 2);
    let y = date.getFullYear();
    let n = pad(date.getMonth(), 2);
    let ms = pad(date.getMilliseconds(), 3);
    return `${y}-${n}-${d} ${h}:${m}:${s}:${ms}`;
}

function pad(s, n) {
    s += '';
    return n > s.length ? (zeros.substr(0, n - s.length) + s) : s;
}

/**
 * Get difference in millisecond of current and input time
 * 
 * @param {any} ts timestamp in ms
 * @returns difference in ms
 */
function dateDiff(ts) {
    return new Date().getTime() - ts;
}

module.exports = {
    getTimeStr: getTimeStr,
    dateDiff: dateDiff
}