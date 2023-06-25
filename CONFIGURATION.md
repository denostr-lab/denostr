# Configuration

# Environment variables

The following environment variables can be set:

| Name                       | Description                         | Default                                 |
| -------------------------- | ----------------------------------- | --------------------------------------- |
| SECRET                     | Long random secret.                 | abcdefghijklmnopqrstuvwxyz1234567890    |
| RELAY_PORT                 | Relay's server port                 | 8008                                    |
| RELAY_PRIVATE_KEY          | Relay's private key in hex          | (auto-generated)                        |
| API_KEY                    | With access to doshboard (dashborad)|                                         |
| MONGO_URI                  | MongoDB URI                         |                                         |
| MONGO_MIN_POOL_SIZE        | Min. connections per worker         | 0                                       |
| MONGO_MAX_POOL_SIZE        | Max. connections per worker         | 3                                       |
| MONGO_REPLICA_ENABLED      | Read Replica (RR) Toggle            | false                                   |
| MONGO_RR_MIN_POOL_SIZE     | Min. connections per worker (RR)    | 0                                       |
| MONGO_RR_MAX_POOL_SIZE     | Max. connections per worker (RR)    | 3                                       |
| TOR_HOST                   | Tor Hostname                        |                                         |
| TOR_CONTROL_PORT           | Tor control Port                    | 9051                                    |
| TOR_PASSWORD               | Tor control password                | nostr_ts_relay                          |
| HIDDEN_SERVICE_PORT        | Tor hidden service port             | 80                                      |
| REDIS_HOST                 | Redis Host                          |                                         |
| REDIS_PORT                 | Redis Port                          | 6379                                    |
| REDIS_DB                   | Redis DB                            | 0                                       |
| REDIS_USER                 | Redis User                          |                                         |
| REDIS_PASS                 | Redis Password                      |                                         |
| REDIS_TLS                  | Redis TLS                           | false                                   |
| NOSTR_CONFIG_DIR           | Configuration directory             | <project_root>/.nostr/                  |
| DEBUG                      | Debugging filter                    |                                         |
| ZEBEDEE_API_KEY            | Zebedee Project API Key             |                                         |
| LNBITS_API_KEY             | Lnbits Invoice/read Key             |                                         |
| OPENNODE_API_KEY           | API Key with Invoices Key           |                                         |
| NODELESS_API_KEY           | Nodeless API key                    |                                         |
| NODELESS_WEBHOOK_SECRET    | Nodeless webhook secret             |                                         |

# Settings

Running `denostr` for the first time creates the settings file in `<project_root>/.nostr/settings.yaml`. If the file is not created and an error is thrown ensure that the `<project_root>/.nostr` folder exists. The configuration directory
can be changed by setting the `NOSTR_CONFIG_DIR` environment variable.

| Name                                                     | Description                                                                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| info.relay_url                                           | Public-facing URL of your relay. (e.g. wss://relay.your-domain.com)                                                                                        |
| info.name                                                | Public name of your relay. (e.g. TBG's Public Relay)                                                                                                       |
| info.description                                         | Public description of your relay. (e.g. Toronto Bitcoin Group Public Relay)                                                                                |
| info.pubkey                                              | Relay operator's Nostr pubkey in hex format.                                                                                                               |
| info.contact                                             | Relay operator's contact. (e.g. mailto:operator@relay-your-domain.com)                                                                                     |
| network.maxPayloadSize                                   | Maximum number of bytes accepted per WebSocket frame                                                                                                       |
| network.remoteIpHeader                                   | HTTP header from proxy containing IP address from client.                                                                                                  |
| payments.enabled                                         | Enabled payments. Defaults to false.                                                                                                                       |
| payments.processor                                       | Either `zebedee`, `lnbits`, `lnurl`.                                                                                                                       |
| payments.feeSchedules.admission[].enabled                | Enables admission fee. Defaults to false.                                                                                                                  |
| payments.feeSchedules.admission[].amount                 | Admission fee amount in msats.                                                                                                                             |
| payments.feeSchedules.admission[].whitelists.pubkeys     | List of pubkeys to waive admission fee.                                                                                                                    |
| payments.feeSchedules.admission[].whitelists.event_kinds | List of event kinds to waive admission fee. Use `[min, max]` for ranges.                                                                                   |
| paymentProcessors.zebedee.baseURL                        | Zebedee's API base URL.                                                                                                                                    |
| paymentProcessors.zebedee.callbackBaseURL                | Public-facing Denostr's Zebedee Callback URL (e.g. https://relay.your-domain.com/callbacks/zebedee)                                                        |
| paymentProcessors.zebedee.ipWhitelist                    | List with Zebedee's API Production IPs. See [ZBD API Documentation](https://api-reference.zebedee.io/#c7e18276-6935-4cca-89ae-ad949efe9a6a) for more info. |
| paymentProcessors.lnbits.baseURL                         | Base URL of your Lnbits instance.                                                                                                                          |
| paymentProcessors.lnbits.callbackBaseURL                 | Public-facing Denostr's Lnbits Callback URL. (e.g. https://relay.your-domain.com/callbacks/lnbits)                                                         |
| paymentProcessors.lnurl.invoiceURL                       | [LUD-06 Pay Request](https://github.com/lnurl/luds/blob/luds/06.md) provider URL. (e.g. https://getalby.com/lnurlp/your-username)                          |
| mirroring.static[].address                               | Address of mirrored relay. (e.g. ws://100.100.100.100:8008)                                                                                                |
| mirroring.static[].filters                               | Subscription filters used to mirror.                                                                                                                       |
| mirroring.static[].secret                                | Secret to pass to relays. Denostr relays only. Optional.                                                                                                   |
| workers.count                                            | Number of workers to spin up to handle incoming connections.                                                                                               |
|                                                          | Spin workers as many CPUs are available when set to zero. Defaults to zero.                                                                                |
| limits.event.eventId.minLeadingZeroBits                  | Leading zero bits required on every incoming event for proof of work.                                                                                      |
|                                                          | Defaults to zero. Disabled when set to zero.                                                                                                               |
| limits.event.kind.whitelist                              | List of event kinds to always allow. Leave empty to allow any.                                                                                             |
| limits.event.kind.blacklist                              | List of event kinds to always reject. Leave empty to allow any.                                                                                            |
| limits.event.pubkey.minLeadingZeroBits                   | Leading zero bits required on the public key of incoming events for proof of work.                                                                         |
|                                                          | Defaults to zero. Disabled when set to zero.                                                                                                               |
| limits.event.pubkey.whitelist                            | List of public keys to always allow. Only public keys in this list will be able to post to this relay. Use for private relays.                             |
| limits.event.pubkey.blacklist                            | List of public keys to always reject. Public keys in this list will not be able to post to this relay.                                                     |
| limits.event.createdAt.maxPositiveDelta                  | Maximum number of seconds an event's `created_at` can be in the future. Defaults to 900 (15 minutes). Disabled when set to zero.                           |
| limits.event.createdAt.minNegativeDelta                  | Maximum number of secodns an event's `created_at` can be in the past. Defaults to zero. Disabled when set to zero.                                         |
| limits.event.content[].kinds                             | List of event kinds to apply limit. Use `[min, max]` for ranges. Optional.                                                                                 |
| limits.event.content[].maxLength                         | Maximum length of `content`. Defaults to 1 MB. Disabled when set to zero.                                                                                  |
| limits.event.rateLimits[].kinds                          | List of event kinds rate limited. Use `[min, max]` for ranges. Optional.                                                                                   |
| limits.event.rateLimits[].period                         | Rate limiting period in milliseconds.                                                                                                                      |
| limits.event.rateLimits[].rate                           | Maximum number of events during period.                                                                                                                    |
| limits.event.whitelists.pubkeys                          | List of public keys to ignore rate limits.                                                                                                                 |
| limits.event.whitelists.ipAddresses                      | List of IPs (IPv4 or IPv6) to ignore rate limits.                                                                                                          |
| limits.client.subscription.maxSubscriptions              | Maximum number of subscriptions per connected client. Defaults to 10. Disabled when set to zero.                                                           |
| limits.client.subscription.maxFilters                    | Maximum number of filters per subscription. Defaults to 10. Disabled when set to zero.                                                                     |
| limits.message.rateLimits[].period                       | Rate limit period in milliseconds.                                                                                                                         |
| limits.message.rateLimits[].rate                         | Maximum number of messages during period.                                                                                                                  |
| limits.message.ipWhitelist                               | List of IPs (IPv4 or IPv6) to ignore rate limits.                                                                                                          |
