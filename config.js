// config.js
// Central configuration constants for the blockchain node

module.exports = {
  // Networking
  HTTP_PORT: process.env.HTTP_PORT || 3001,
  P2P_PORT: process.env.P2P_PORT || 6001,
  LIGHTNING_PORT: process.env.LIGHTNING_PORT || 9735,

  // Initial peers to connect to (comma-separated in env)
  PEERS: process.env.PEERS ? process.env.PEERS.split(',') : [],

  // Blockchain parameters
  DIFFICULTY: parseInt(process.env.DIFFICULTY) || 4,          // Leading zeros required in block hash
  BLOCK_TIME: parseInt(process.env.BLOCK_TIME) || 60000,     // Target block time in ms (1 minute for testing)
  DIFFICULTY_ADJUSTMENT_INTERVAL: 10,                        // Blocks between difficulty adjustments
  MINING_REWARD: parseInt(process.env.MINING_REWARD) || 50,  // Coinbase reward in satoshis

  // Storage
  DATA_DIR: process.env.DATA_DIR || './chaindata',

  // Transaction limits
  MAX_BLOCK_WEIGHT: 4000000,                                 // SegWit weight limit
  MAX_BLOCK_SIZE: 1000000,                                   // Legacy block size limit (1MB)
  COINBASE_MATURITY: 100,                                    // Blocks before coinbase can be spent

  // Lightning Network
  CHANNEL_RESERVE: 1000,                                     // Minimum balance to keep in a channel (sats)
  HTLC_MINIMUM: 1,                                           // Minimum HTLC value (sats)
  HTLC_EXPIRY_DELTA: 144,                                    // Blocks until HTLC expires
  MAX_PAYMENT_ATTEMPTS: 3,                                   // Routing retries

  // P2P Protocol
  PROTOCOL_VERSION: 1,
  MAX_PEERS: 125,
  PING_INTERVAL: 30000,                                      // ms between ping messages
  PEER_TIMEOUT: 60000,                                       // ms before disconnecting unresponsive peer

  // API Rate Limiting
  API_RATE_LIMIT: 100,                                       // Requests per minute
  API_RATE_WINDOW: 60000                                     // ms window for rate limiting
};