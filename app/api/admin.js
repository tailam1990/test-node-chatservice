const express = require('express');
const Channel = require('../constant').channel;
const Config = require('../config');
const logger = require('../utils/logger');
const xmpp = require('../lib/xmpp-handler');

const router = express.Router();

router.get('/', (req, res) => {
    res.send('admin api');
});

router.get('/getsessions', (req, res) => {
    let sessions = xmpp.getSessions();
    let s = '';
    sessions.forEach((ch, sess) => {
        s += Object.keys(Channel).filter(c => Channel[c] === ch)[0];
        sess.forEach(sessId => {
            s += sessId + '\n';
        });
    });
    res.send(`<pre>${s}</pre>`);
});

module.exports = router; 