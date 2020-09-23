class QueueClient {
    constructor(dialogId, refDialogId, channelId, customerRefId, customerName) {
        this.dialogId = dialogId;
        this.refDialogId = refDialogId;
        this.channelId = channelId;
        this.customerRefId = customerRefId;
        this.customerName = customerName;
    }
}
module.exports = QueueClient;