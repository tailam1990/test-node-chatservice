module.exports = {
    Channel: {
        WEBSOCKET: 1,
        FACEBOOK: 2,
        WECHAT: 3,
        XMPP: 4
    },
    UserType: {
        CUSTOMER: 'customer',
        AGENT: 'agent',
        BOT: 'bot'
    },
    MessageType: {
        TEXT: 'text'
    },
    MessageEventType: {
        CLIENT: 'message-client',
        AGENT: 'message-agent',
        SYSTEM: 'message-system'
    },    
    /** https://developers.facebook.com/docs/messenger-platform/send-messages/#messaging_types */
    FBMessageType: {
        /** 
         * Message is being sent proactively and is not in response to a received message. 
         * This includes promotional and non-promotional messages sent inside the the 24-hour 
         * standard messaging window or under the 24+1 policy. 
         */
        UPDATE: 'UPDATE',

        /** 
         * Message is in response to a received message. This includes promotional and non-promotional messages sent 
         * inside the 24-hour standard messaging window or under the 24+1 policy. For example, 
         * use this tag to respond if a person asks for a reservation confirmation or an status update. 
         */
        RESPONSE: 'RESPONSE',

        /** 
         * Message is non-promotional and is being sent outside the 24-hour standard messaging window with a message tag. 
         * The message must match the allowed use case for the tag.
         */
        MESSAGE_TAG: 'MESSAGE_TAG'
    },
    LogLevel: {
        TRACE: 4,
        DEBUG: 3,
        INFO: 2,
        WARN: 1,
        ERROR: 0
    }
}