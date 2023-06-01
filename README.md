# [Denostr](https://github.com/denostr-protocol/denostr)

<p align="center">
  <img alt="denostr logo" height="256px" width="256px" src="https://user-images.githubusercontent.com/8678079/233816217-27504e7e-b429-4388-ac69-592122fa922b.png" />
</p>

<p align="center">
  <a href="https://github.com/denostr-protocol/denostr/releases">
    <img alt="GitHub release" src="https://img.shields.io/github/v/release/denostr-protocol/denostr">
  </a>
  <a href="https://github.com/denostr-protocol/denostr/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/denostr-protocol/denostr?style=plastic" />
  </a>
  <a href="https://github.com/denostr-protocol/denostr/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/denostr-protocol/denostr" />
  </a>
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/denostr-protocol/denostr">
  <a href="https://github.com/denostr-protocol/denostr/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/denostr-protocol/denostr" />
  </a>
  <a href="https://github.com/denostr-protocol/denostr/blob/main/LICENSE">
    <img alt="GitHub license" src="https://img.shields.io/github/license/denostr-protocol/denostr" />
  </a>
  <a href='https://coveralls.io/github/denostr-protocol/denostr?branch=main'>
    <img  alt='Coverage Status' src='https://coveralls.io/repos/github/denostr-protocol/denostr/badge.svg?branch=main' />
  </a>
  <a href='https://github.com/denostr-protocol/denostr/actions'>
    <img alt='Build status' src='https://github.com/denostr-protocol/denostr/actions/workflows/checks.yml/badge.svg?branch=main&event=push' />
  </a>
</p>

💪🏻 Deno-based, cloud-native Nostr relay forked from `nostream`. Sponsored by ByteTrade and Revo.

This is a [nostr](https://github.com/fiatjaf/nostr) relay, written in Typescript.

This implementation is production-ready. See below for supported features.

The project main repository is available on [GitHub](https://github.com/denostr-protocol/denostr).

## Features

NIPs with a relay-specific implementation are listed here.

- [x] NIP-01: Basic protocol flow description
- [x] NIP-02: Contact list and petnames
- [x] NIP-04: Encrypted Direct Message
- [ ] NIP-05: Mapping Nostr keys to DNS-based internet identifiers
- [x] NIP-09: Event deletion
- [x] NIP-11: Relay information document
- [x] NIP-12: Generic tag queries
- [x] NIP-13: Proof of Work
- [x] NIP-15: End of Stored Events Notice
- [x] NIP-16: Event Treatment
- [x] NIP-20: Command Results
- [x] NIP-22: Event `created_at` Limits
- [x] NIP-26: Delegated Event Signing
- [x] NIP-28: Public Chat
- [x] NIP-33: Parameterized Replaceable Events
- [x] NIP-38: [Encrypted Group Chat with Megolm group ratchet (Draft)](https://oi5l5umbjx.feishu.cn/docx/TW7Ndb6Imoj3n7x08MTcleqanad)
- [x] NIP-40: Expiration Timestamp
- [ ] NIP-42: Authentication of clients to relays
- [ ] NIP-45: Event Counts

## Architecture

Todo

## Requirements

- Deno v1.30.x or v1.31.x
- Typescript
- MongoDB 4.4, 5.0, 6.0
- Redis (Standalone Optional, Cluster Required)

### kubernetes setups

- v1.18.8 or later

## Full Guide

> NOTE: If the payment is enabled, it is recommended to start another instance with `WORKER_TYPE=maintenance` following the "Quick Start" guide.

### Accepting payments

1. Before you begin
   - Complete one of the Quick Start guides in this document
   - Create a `.env` file
   - On `.nostr/settings.yaml` file make the following changes:
     - Set `payments.enabled` to `true`
     - Set `payments.feeSchedules.admission.enabled` to `true`
     - Set `limits.event.pubkey.minBalance` to the minimum balance in msats required to accept events (i.e. `1000000` to require a balance of `1000` sats)
   - Choose one of the following payment processors: `lnbits`, `lnurl`, `zebedee`

2. [LNbits](https://lnbits.com/)
    - Complete the step "Before you begin"
    - Create a new wallet on you public LNbits instance
      - [Demo](https://legend.lnbits.com/) server must not be used for production
      - Your instance must be accessible from the internet and have a valid SSL/TLS certificate
    - Get wallet "Invoice/read key" (in Api docs section of your wallet)
    - set `LNBITS_API_KEY` environment variable with the "Invoice/read key" Key above on your `.env` file

      ```
      LNBITS_API_KEY={YOUR_LNBITS_API_KEY_HERE}
      ```
    - On your `.nostr/settings.yaml` file make the following changes:
      - Set `payments.processor` to `lnbits`
      - set `lnbits.baseURL` to your LNbits instance URL (e.g. `https://{YOUR_LNBITS_DOMAIN_HERE}/`)
      - Set `paymentsProcessors.lnbits.callbackBaseURL` to match your callbcak URL (e.g. `https://{YOUR_DOMAIN_HERE}/callbacks/lnbits`)
    - Restart Denostr

3. [ZEBEDEE](https://zebedee.io)
   - Complete the step "Before you begin"
   - [Sign up for a ZEBEDEE Developer Dashboard account](https://dashboard.zebedee.io/signup), create a new LIVE Project, and get that Project's API Key
   - Set `ZEBEDEE_API_KEY` environment variable with the API Key above on your `.env` file

    ```
    ZEBEDEE_API_KEY={YOUR_ZEBEDEE_API_KEY_HERE}
    ```

   - Follow the required steps for all payments processors
   - On `.nostr/settings.yaml` file make the following changes:
     - `payments.processor` to `zebedee`
     - `paymentsProcessors.zebedee.callbackBaseURL` to match your callback URL (e.g. `https://{YOUR_DOMAIN_HERE}/callbacks/zebedee`)
   - Restart Denostr

4. Ensure payments are required for your public key
   - Visit https://{YOUR-DOMAIN}/
   - You should be presented with a form requesting an admission fee to be paid
   - Fill out the form and take the necessary steps to pay the invoice
   - Wait until the screen indicates that payment was received
   - Add your relay URL to your favorite Nostr client (wss://{YOUR-DOMAIN}) and wait for it to connect
   - Send a couple notes to test
   - Go to https://websocketking.com/ and connect to your relay (wss://{YOUR_DOMAIN})
   - Convert your npub to hexadecimal using a [Key Converter](https://damus.io/key/)
   - Send the following JSON message: `["REQ", "payment-test", {"authors":["your-pubkey-in-hexadecimal"]}]`
   - You should get back the few notes you sent earlier


### Quick Start (Standalone)

Clone repository and enter directory:

```sh
git clone https://github.com/denostr-protocol/denostr.git --depth 1 && cd denostr
```

Create `.env` file inside denostr project folder

Set the following environment variables:

```ini
WORKER_TYPE=worker
MONGO_URI=mongodb://user:pass@host:port/db?replicaSet=rs0&authSource=admin
```

Generate a long random secret and set SECRET:

You may want to use `openssl rand -hex 128` to generate a secret.

```ini
SECRET=aaabbbccc...dddeeefff
# Secret shortened for brevity
```

In addition, if using API Key for payments, You must also use the API key of each payment service to set the.

Create `.nostr` folder inside **denostr project folder** and copy over the settings file:

```sh
mkdir .nostr
cp resources/default-settings.yaml .nostr/settings.yaml
```

To start in development mode:

```sh
deno task dev
```

Or, start in production mode:

```sh
deno task start
```

### Apply for kubernetes

Please refer to [this document](./docs/apply-for-k8s.md)

## Tests

### Unit tests

Run unit tests with:

```sh
deno task test:unit
```

### Integration tests

Run integration tests with:

```sh
deno task test:integration
```

## Configuration

You can change the default folder by setting the `NOSTR_CONFIG_DIR` environment variable to a different path.

Run denostr using one of the quick-start guides at least once and `denostr/.nostr/settings.json` will be created. Any changes made to the settings file will be read on the next start.

Default settings can be found under `resources/default-settings.yaml`. Feel free to copy it to `denostr/.nostr/settings.yaml` if you would like to have a settings file before running the relay first.

See [CONFIGURATION.md](CONFIGURATION.md) for a detailed explanation of each environment variable and setting.

## Dev Channel

For development discussions, please use the [Nostr Typescript Relay Dev Group](https://t.me/denostr_dev).

For discussions about the protocol, please feel free to use the [Nostr Telegram Group](https://t.me/nostr_protocol).

## License

This project is MIT licensed.
