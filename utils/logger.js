// utils/logger.js
// Simple structured logger with timestamps and log levels

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function log(level, module, message, data) {
  if (LEVELS[level] < CURRENT_LEVEL) return;
  const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${module}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, typeof data === 'object' ? JSON.stringify(data) : data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

function createLogger(module) {
  return {
    debug: (msg, data) => log('debug', module, msg, data),
    info:  (msg, data) => log('info',  module, msg, data),
    warn:  (msg, data) => log('warn',  module, msg, data),
    error: (msg, data) => log('error', module, msg, data)
  };
}

module.exports = { createLogger };
