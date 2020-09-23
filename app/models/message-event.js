module.exports = {
    MessageEvent: MessageEvent
}

class MessageEvent {
    constructor(messageId, messageText, senderId, timestamp, channel, response) {
        this.messageId = messageId;
        this.messageText = messageText;
        this.senderId = senderId;
        this.channel = channel;
        this.response = response;
    }
}