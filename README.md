# [denostr](https://github.com/Guakamoli/denostr)

<p align="center">
  <img alt="Denostr logo" height="256px" width="256px" src="https://user-images.githubusercontent.com/378886/198158439-86e0345a-adc8-4efe-b0ab-04ff3f74c1b2.jpg" />
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

This is a [nostr](https://github.com/fiatjaf/nostr) relay, written in Typescript.

This implementation is production-ready. See below for supported features.

The project master repository is available on [GitHub](https://github.com/Guakamoli/denostr).

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/Xfk5F7?referralCode=Kfv2ly)

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

## Requirements

### Standalone setup

- Mongodb 6.0
- Deno v1.31.1
- Typescript

### Docker setups

- Docker v20.10
- Docker Compose v2.10

### Local Docker setup

- Docker Desktop v4.2.0 or newer
- [mkcert](https://github.com/FiloSottile/mkcert)

WARNING: Docker distributions from Snap, Brew or Debian repositories are NOT SUPPORTED and will result in errors. Install Docker from their [official guide](https://docs.docker.com/engine/install/) ONLY.

## Full Guide

- [Set up a Nostr relay in under 5 minutes](https://andreneves.xyz/p/set-up-a-nostr-relay-server-in-under) by [André Neves](https://twitter.com/andreneves) (CTO & Co-Founder at [ZEBEDEE](https://zebedee.io/))

## Quick Start (Standalone)

Set the following environment variables:

```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=nostr_ts_relay
DB_USER=DB_USER
DB_PASSWORD=DB_PASSWORD
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
WORKER_TYPE=worker
```

Clone repository and enter directory:

```
git clone git@github.com:Guakamoli/denostr.git
cd denostr
```



Create .nostr folder inside denostr project folder and copy over the settings file:

```
mkdir .nostr
cp resources/default-settings.yaml .nostr/settings.yaml
```

To start in development mode:

```
deno task dev
```

Or, start in production mode:

```
deno task start
```

## Tests

### Unit tests

Run unit tests with:

```
deno task test_unit
```

### Integration tests
Run integration tests with:

```
deno task test_integration
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
