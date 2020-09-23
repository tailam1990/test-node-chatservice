const crypto = require('crypto');
const logger = require('../utils/logger');
const JWT_HEADER = { alg: 'HS256', typ: 'JWT' };
const { SERVER_SECRET } = require('../config');
const uuid = require('uuid/v1');

function generate(username) {
    let data = {
        sessionId: uuid(),
        username: username
    };
    var encodedHeader = base64url(JSON.stringify(JWT_HEADER));
    var encodedData = base64url(JSON.stringify(data));
    var headerData = encodedHeader + '.' + encodedData;

    var hmac = crypto.createHmac('sha256', SERVER_SECRET);
    var signature = hmac.update(headerData).digest('hex');

    return headerData + '.' + signature;
}

function verify(token) {
    [encodedHeader, encodedData, signature] = token.split('.');

    var hmac = crypto.createHmac('sha256', SERVER_SECRET);
    var verifySign = hmac.update(encodedHeader + '.' + encodedData).digest('hex');

    return signature === verifySign;
}

function extractData(token) {
    [encodedHeader, encodedData, signature] = token.split('.');
    let data = Buffer.from(encodedData, 'base64');  // Base 64 decode
    return JSON.parse(data);
}

function base64url(source) {
    // Encode in classical base64
    encodedSource = Buffer.from(source).toString('base64');

    // Remove padding equal characters
    encodedSource = encodedSource.replace(/=+$/, '');

    // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');

    return encodedSource;
}

module.exports = {
    generate: generate,
    verify: verify,
    extractData: extractData
};