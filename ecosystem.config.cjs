module.exports = {
    apps: [
      {
        name: "Telos Monitor Mainnet",
        script: "./index.js",
        instances: 1,
        max_memory_restart: "300M",
  
        // Logging
        out_file: "./monitor-mainnet-out.log",
        error_file: "./monitor-mainnet-error.log",
        merge_logs: true,
        log_date_format: "DD-MM HH:mm:ss Z",
        log_type: "json",
  
        // Advanced features
        autorestart: false,
        cron_restart: "*/30 * * * *", 
      },
    ],
  };