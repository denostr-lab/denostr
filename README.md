# [Denostr](https://github.com/Guakamoli/denostr)

<p align="center">
  <img alt="denostr logo" height="256px" width="256px" src="https://user-images.githubusercontent.com/8678079/233816217-27504e7e-b429-4388-ac69-592122fa922b.png" />
</p>

<p align="center">
  <a href="https://github.com/Guakamoli/denostr/releases">
    <img alt="GitHub release" src="https://img.shields.io/github/v/release/Guakamoli/denostr">
  </a>
  <a href="https://github.com/Guakamoli/denostr/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/Guakamoli/denostr?style=plastic" />
  </a>
  <a href="https://github.com/Guakamoli/denostr/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/Guakamoli/denostr" />
  </a>
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/Guakamoli/denostr">
  <a href="https://github.com/Guakamoli/denostr/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/Guakamoli/denostr" />
  </a>
  <a href="https://github.com/Guakamoli/denostr/blob/main/LICENSE">
    <img alt="GitHub license" src="https://img.shields.io/github/license/Guakamoli/denostr" />
  </a>
  <a href='https://coveralls.io/github/Guakamoli/denostr?branch=main'>
    <img  alt='Coverage Status' src='https://coveralls.io/repos/github/Guakamoli/denostr/badge.svg?branch=main' />
  </a>
  <a href='https://github.com/Guakamoli/denostr/actions'>
    <img alt='Build status' src='https://github.com/Guakamoli/denostr/actions/workflows/checks.yml/badge.svg?branch=main&event=push' />
  </a>
</p>

💪🏻 Deno-based, cloud-native Nostr relay forked from `nostream`. Sponsored by ByteTrade and Revo.

This is a [nostr](https://github.com/fiatjaf/nostr) relay, written in Typescript.

This implementation is production-ready. See below for supported features.

The project main repository is available on [GitHub](https://github.com/Guakamoli/denostr).

## Features

NIPs with a relay-specific implementation are listed here.

- [x] NIP-01: Basic protocol flow description
- [x] NIP-02: Contact list and petnames
- [x] NIP-04: Encrypted Direct Message
- [x] NIP-09: Event deletion
- [x] NIP-11: Relay information document
- [x] NIP-11a: Relay Information Document Extensions
- [x] NIP-12: Generic tag queries
- [x] NIP-13: Proof of Work
- [x] NIP-15: End of Stored Events Notice
- [x] NIP-16: Event Treatment
- [x] NIP-20: Command Results
- [x] NIP-22: Event `created_at` Limits
- [x] NIP-26: Delegated Event Signing
- [x] NIP-28: Public Chat
- [x] NIP-33: Parameterized Replaceable Events
- [x] NIP-40: Expiration Timestamp

## Architecture

Todo

## Requirements

- Deno v1.30.x or later
- Typescript
- MongoDB 4.4, 5.0, 6.0
- Redis (Optional)

### kubernetes setups

- v1.18.8 or later

## Full Guide

### Quick Start (Standalone)

Clone repository and enter directory:

```sh
git clone git@github.com:Guakamoli/denostr.git && cd denostr
```

Create `.env` file inside denostr project folder

Set the following environment variables:

```ini
WORKER_TYPE=worker
MONGO_URI=mongodb://user:pass@host:port/db?replicaSet=rs0&authSource=admin
```

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
