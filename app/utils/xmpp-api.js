const request = require('request-promise-native');
const { XMPP_API_KEY, XMPP_API_URL } = require('../config');
const urlJoin = require('url-join');

/**
 * XMPP server HTTP API utilities
 */

function get(url) {
    return request.get({
        headers: { "Content-Type": 'application/json' },
        qs: { "api-key": XMPP_API_KEY },
        url: urlJoin(XMPP_API_URL, url),
    }).then(result => {
        return Promise.resolve(JSON.parse(result));
    });
}

function post(url, body) {
    return request.post({
        headers: { "Content-Type": 'application/json' },
        qs: { "api-key": XMPP_API_KEY },
        url: urlJoin(XMPP_API_URL, url),
        body: body,
        json: true
    }).then(result => {
        return Promise.resolve(JSON.parse(result));
    });
}

function put(url, body) {
    return request.put({
        headers: { "Content-Type": 'application/json' },
        qs: { "api-key": XMPP_API_KEY },
        url: urlJoin(XMPP_API_URL, url),
        body: body,
        json: true
    }).then(result => {
        return Promise.resolve(result);
    });
}

module.exports = {
    get: get,
    post: post,
    put: put
}