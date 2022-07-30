# Telos Monitor

This project runs tasks on the Telos Network contracts, services & endpoints and notifies alerts subscribers by email
It is the backend of the monitoring system, meant to be run with POSTGREST API and [telos-monitor-dashboard](https://github.com/telosnetwork/telos-monitor-dashboard) project for the frontend.

You can find the testnet dashboard [hosted here](https://monitor-test.telos.net/#/)

You can find the mainnet dashboard [hosted here](https://monitor.telos.net/#/)

## Requirements

This repository uses NodeJS 14+

## Installation

Run `npm install` from the project root directory

Then navigate to `contracts/native` and deploy the helper contracts using cleos, put the private key to the deployment account in the .env file under `PRIVATE_KEY`

## Build

`npm run build` from the project root directory

## Serve

`quasar serve dist/spa` from the project root directory to serve the SPA

## Dev

`quasar dev` for serving dev with hotreload, etc..
