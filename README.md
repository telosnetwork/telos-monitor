# Telos Monitor

This project runs tasks on the Telos Network contracts, services & endpoints and notifies of errors using a Telegram bot or fallback emails.
It is the backend of the monitoring system, meant to be run with POSTGREST API and [telos-monitor-dashboard](https://github.com/telosnetwork/telos-monitor-dashboard) project for the frontend.

You can find the testnet dashboard [hosted here](https://monitor-test.telos.net/#/)

You can find the mainnet dashboard [hosted here](https://monitor.telos.net/#/)

## Requirements

This repository uses NodeJS 14+

## Installation

1. Run `npm install` from the project root directory
2. Rename `.env.sample` to `.env` and customize accordingly (be sure to fill fields like PRIVATE_KEY & database which are required)
3. Rename `database.conf.sample` to `database.conf` and customize accordingly
4. Rename `emails-to-notify.json.sample` to `emails-to-notify.json` and customize accordingly
5. Navigate to `contracts/native` and deploy the helper contracts using cleos, put the private key to the deployment account in the .env file under `PRIVATE_KEY`

## Run

Use `node index.js` from the project root directory

## Monitor Cron

Use PM2 with `pm2 start index.js --cron "*/30 * * * *" --no-autorestart --name "monitor-mainnet"` from the project root directory to set it up as a 30 minutes cron job

## Monitor API

For the API we use postgrest. To launch it you can use the command `postgrest database.conf` after installing postgrest on your machine. Make sure the configuration in `database.conf` is correct and contains a read only user.

## Add task

Add a task to the `tasks` directory to add a new task. Use existing tasks as examples.

You will need to create a new `MyTask` class that extends the generic `Task` class, or more specific classes like `Contract` or `HTTPService` according to your needs.

Add errors, alerts & infos by pushing strings and integers to that parent class' `errors`, `alerts` or `infos` arrays, ie:

```
this.errors.push('My error message');
this.alerts.push('My alert message');
this.infos.push('My info message');
```

Messages above 255 characters will be truncated but you can push as many as you want.

Use the `save()` method to save the current task errors, or lack thereof, and the `end()` method to stop the task and call the next one.

Notifications will only be sent for errors (along with alerts & infos for that errored task)