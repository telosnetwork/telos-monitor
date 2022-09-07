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

## Run

Use `node index.js` from the project root directory

## Cron

Use PM2 with `pm2 start index.js --cron "*/30 * * * *" --no-autorestart` from the project root directory to set it up as a 30 minutes cron job

## Add task

Add a task to the `tasks` directory to add a new task. Use existing tasks as examples.

You will need to create a new `MyTask` class that extends the `Task`, `Contract` or `HTTPService` class.

Add errors by pushing strings and integers to that parent class' `errors` array

Use the `save()` method to save the current task errors, or lack thereof, and the `end()` method to stop the task and call the next one
