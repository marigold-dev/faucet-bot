# Faucet Bot

> hehe, money printer go brrr

## Purpose

This is a simple HTTP server to automate
acquiring funds on Tezos test nets. With this app in place,
it's easy to automate setting up and funding new Tezos wallets,
as is done for [Deku](https://github.com/marigold-dev/deku) development.

## Implementation

The app is implemented as a NodeJS/Express app that listens to port 3000.
It uses the wonderful [Taquito](https://github.com/ecadlabs/taquito) library
to handle interactions with Tezos.

## Deployment

```
yarn install
yarn start
```

The app uses the following environmental variables:
- `TEZOS_RPC_URL` - the URL of the RPC node to connect through.
  You can find a list of available public nodes on the
  [Taquito docs](https://github.com/ecadlabs/taquito)
- `TEZOS_SECRET_KEY` - a EDSK key representing a Tezos address on the test network.
- `PORT` - the port to listen on. Defaults to 3000
