const fs = require('fs');
const path = require('path');
const { BASE_DIR } = require('../config');

function ls(dir) {
    return fs.readdirSync(dir || BASE_DIR);
}

function joinPath(...p) {
    return path.join.apply(null, p);
}

function toModuleName(s) {
    return (s || '').toLowerCase().replace(/[ _]/g, '-').replace('.js', '');
}

module.exports = {
    ls: ls,
    joinPath: joinPath,
    toModuleName: toModuleName
}