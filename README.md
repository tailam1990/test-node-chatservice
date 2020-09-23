# NodeJS chatbot service

This project is an attempt to provide a uniform interface for receiving and sending messages from multiple channel.  Currently, the Facebook messenger and WebSocket interfaces are implemented.  

Server initially open a DB connection and a XMPP client connection for the bot XMPP account.  On successful connections, the server is ready for incoming messages.

## Build instruction

- Modify environment variables in .env file

- Install dependencies
```sh
npm install
```

- Run
```sh
npm run
```

## Initial deployment

Certain tables needs to be initialized with data prior to running for the first time.

- At least one agent exists
    - At least one record in **user** with *user_jid* set to the XMPP ID created in Tigase
- At least one active chat routing rule exists
    - At least one record in **chat_routing**
    - At least one of (*chat_routing_channel*, *chat_routing_expert*) = 1 and *chat_routing_disable* = 0
- At least one channel is assigned to an agent
    - At least one record in **channel_user_mapping**

Bot XMPP account must exist in Tigase. Its username and password needs to be set in .env as BOT_USERNAME and BOT_PASSWORD.

googleapp_credentials.json needs to be at the project root to authenticate with google cloud for the DialogFlow service to work.

## Development note

Unimplemented features are marked with a TODO: or FIXME: tag, search or use a VSCode extension to list those out.

#### Project structure

The chatbot service has the following project structure:
    
  * api/ - API endpoints for channels utilizing HTTP bindings (GET, POST, PUT) to invoke the chatbot service
  * db/ - Data access logics
  * lib/ - Business logics
  * lib/intent/ - Intent processors for handling specific intents from NLP service response
  * models/ - Data models
  * models/table - Data models representing DB table records
  * utils/ - Utilities
  * .env - Environment variables / configuration
  * constants.js - Constants / enumurations
  * config.js - Design-time configurations and defaults
  * index.js - Program entry point.  Handles server startup

#### Intents
Certain intents may need to be handled by the chatbot service.  To implement handlers for intents, add a .js file with approriate name to lib/intent/.  The .js name needs to be the intent name with space and underscore "_" replaced by hyphen "-".  The .js is also required to export a "*process*" function. See default-fallback-intent.js for implementation details.

#### Test interface
The project includes a WebSocket client (Socket.io) for testing.  The web page can be visisted at {host}/web and its source code is at test/web.html.

#### Database entities
The projects currently uses MySQL database for data storage. The following briefly describe some notable relationships between entities:

#### customer
***customer*** represents the customer object. *customer_ref_id* is the external ID of the customer, ie. Facebook assigned unique ID.
- ***customer*** [x --- x] ***dialog_user_mapping***

#### user
***user*** represents system users.  This typically refers to agents.  Note that ***customer*** or *bot* accounts are not considered as ***user***. Each user can be associated with a list of expertise to help routing chat with specific subject to the most appropriate ***user***.  The association is stored in ***expertise_user_mapping***.
- ***user*** [x --- x] ***dialog_user_mapping***
- ***user*** [x --- x] ***expertise_user_mapping***
- ***user*** [x --- x] ***channel_user_mapping***

#### dialog
***dialog*** represents chat sessions between participants.  Participants can either be bot, customer or agent. Their relatenship is stored in ***dialog_user_mapping***.
- ***dialog*** [1 --- x] ***message***
- ***dialog*** [x --- 1] ***dialog_channel_mapping***
- ***dialog*** [1 --- x] ***dialog_subject_key***

#### message
***message*** represents each chat messages sent and received through the chatbot service.  *message_body* should contain only sanitized chat messages instead of raw chat messages.
- ***dialog*** [1 --- x] ***message***

#### chat_routing
***chat_routing*** is the rule used to determine how agent routing behaves.  In general, there should only be 1 active (*chat_routing_disable* = 0) record in the table.

#### sensitive_data_rule
***sensitive_data_rule*** contains the list of text censoring rules that applies to incoming customer chat message.  Rules are stored as regular expression in *rule_pattern* and the replace characters are specified by *rule_action*.

## Tigase configuration

Below is a sample config for Tigase 7.1.3.

Note that as of 7.1.3, the **api-keys** settings seems to be required for the Tigase REST services to work properly (even if you don't want to authenicate with such).

The **ext** component is required for the XEP-0114 external component protocal to work.  The current state of the chatbot service does not rely on the protocol, but it would be more convenient if we can get that working, in which case the chatbot service can listen on any message (incoming / outgoing) and send message on behalf of any user.  See the @xmpp/component library for more information.

```sh
config-type=--gen-config-all

--virt-hosts=localhost.xmpp
--admins=admin@localhost.xmpp

http/setup/admin-credentials=admin@localhost.xmpp:tigase


--debug=server,ext

--user-db-uri=jdbc:mysql://localhost/tigasedb?user=tigase&password=tigase12



--sm-plugins=+jabber\:iq\:auth,+urn\:ietf\:params\:xml\:ns\:xmpp-sasl,+urn\:ietf\:params\:xml\:ns\:xmpp-bind,+urn\:ietf\:params\:xml\:ns\:xmpp-session,+jabber\:iq\:register,+jabber\:iq\:roster,+presence-state,+presence-subscription,+basic-filter,+domain-filter,+jabber\:iq\:privacy,+jabber\:iq\:version,+http\://jabber.org/protocol/stats,+starttls,-msgoffline,+vcard-temp,+http\://jabber.org/protocol/commands,+jabber\:iq\:private,+urn\:xmpp\:ping,+pep,+zlib,+message-archive-xep-0136,+amp

--comp-name-1=muc
--comp-class-1=tigase.muc.MUCComponent

--comp-name-2=pubsub
--comp-class-2=tigase.pubsub.PubSubComponent

--comp-name-3=http
--comp-class-3=tigase.http.HttpMessageReceiver
--api-keys=4ec2edea84e6411cb5547c01ade7acf6

--comp-name-4=ext
--comp-class-4=tigase.server.ext.ComponentProtocol
--external=localhost.xmpp:tigase:listen:5270
#--bind-ext-hostnames=lenovo-pc
```