const Config = require('../config');
const express = require('express');
const jwt = require('../utils/jwt');
const messageDao = require('../db/message');

const router = express.Router();

/**
 * Test web interface
 */

router.get('/', (req, res) => {
    res.sendFile('web.html', { root: `${Config.BASE_DIR}/test/` });
});

router.post('/login', (req, res) => {
    let body = req.body;
    let username = body.username;
    let password = body.password;

    if (verifyCredentials(username, password)) {
        res.status(200).send(JSON.stringify({
            token: jwt.generate(username)   // FIXME: replay-attack
        }));
    } else {
        res.status(401).send('unauthorized');
    }
});

router.get('/messages/:dialogId', (req, res) => {
    if (req.params.dialogId == null) {
        let messages = messageDao.getByDialogId(req.params.dialogId);
        let messageText = messages.map(m => m.message_body);
        res.json(messageText);
    } else {
        res.sendStatus(400);
    }
});

function verifyCredentials(username, password) {
    return !!username;
}

module.exports = router;
