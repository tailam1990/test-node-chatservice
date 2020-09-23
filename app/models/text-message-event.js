class TextMessageEvent {
    constructor(o) {
        this.channelId = null;
        this.dialogId = null;
        this.messageId = null;
        this.messageText = null;
        this.senderId = null;
        this.recipientId = null;
        this.response = null;
        this.timestamp = new Date().getTime();

        if (o != null) {
            Object.assign(this, o);
        }
    }
}

module.exports = TextMessageEvent;