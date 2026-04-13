// utils/validator.js
// Stateless validation helpers for transactions and blocks

const { publicKeyToAddress } = require('./crypto');
const config = require('../config');

/**
 * Validate a raw transaction object before accepting it into the mempool.
 * Does NOT verify signatures or UTXO existence (that's done in tx.verify()).
 */
function validateTransactionStructure(tx) {
  if (!tx || typeof tx !== 'object') return { valid: false, error: 'Not an object' };

  if (!Array.isArray(tx.inputs))  return { valid: false, error: 'inputs must be an array' };
  if (!Array.isArray(tx.outputs)) return { valid: false, error: 'outputs must be an array' };

  if (tx.outputs.length === 0) return { valid: false, error: 'No outputs' };

  for (const output of tx.outputs) {
    if (typeof output.amount !== 'number' || output.amount <= 0) {
      return { valid: false, error: `Invalid output amount: ${output.amount}` };
    }
    if (typeof output.address !== 'string' || output.address.length < 25) {
      return { valid: false, error: `Invalid output address` };
    }
  }

  // Non-coinbase transactions must have inputs
  if (tx.inputs.length === 0 && !tx._isCoinbase) {
    return { valid: false, error: 'Non-coinbase tx has no inputs' };
  }

  for (const input of tx.inputs) {
    if (typeof input.txid !== 'string' || input.txid.length !== 64) {
      return { valid: false, error: `Invalid input txid` };
    }
    if (typeof input.outputIndex !== 'number' || input.outputIndex < 0) {
      return { valid: false, error: `Invalid input outputIndex` };
    }
  }

  // Check total output amount doesn't overflow
  const totalOut = tx.outputs.reduce((s, o) => s + o.amount, 0);
  if (totalOut > config.MAX_BLOCK_WEIGHT) {
    return { valid: false, error: 'Output sum exceeds limit' };
  }

  return { valid: true };
}

/**
 * Validate raw block data structure (before cryptographic checks).
 */
function validateBlockStructure(block) {
  if (!block || typeof block !== 'object') return { valid: false, error: 'Not an object' };
  if (typeof block.index !== 'number')     return { valid: false, error: 'Missing index' };
  if (typeof block.timestamp !== 'number') return { valid: false, error: 'Missing timestamp' };
  if (typeof block.hash !== 'string')      return { valid: false, error: 'Missing hash' };
  if (typeof block.previousHash !== 'string') return { valid: false, error: 'Missing previousHash' };
  if (!Array.isArray(block.transactions)) return { valid: false, error: 'transactions must be array' };
  if (block.transactions.length === 0)    return { valid: false, error: 'Block has no transactions' };

  // Block must have a coinbase as first transaction
  const coinbase = block.transactions[0];
  if (!Array.isArray(coinbase.inputs) || coinbase.inputs.length !== 0) {
    return { valid: false, error: 'First transaction must be coinbase (no inputs)' };
  }
  if (!Array.isArray(coinbase.outputs) || coinbase.outputs.length === 0) {
    return { valid: false, error: 'Coinbase must have at least one output' };
  }

  return { valid: true };
}

/**
 * Check that a public key actually corresponds to a given address.
 */
function publicKeyMatchesAddress(publicKey, address) {
  try {
    return publicKeyToAddress(publicKey) === address;
  } catch {
    return false;
  }
}

module.exports = {
  validateTransactionStructure,
  validateBlockStructure,
  publicKeyMatchesAddress
};
