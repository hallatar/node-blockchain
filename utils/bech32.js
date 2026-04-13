// utils/bech32.js
// Bech32 / SegWit address helpers (uses bech32 v2 npm package)

const { bech32 } = require('bech32');
const { hash160 } = require('./crypto');

const NETWORK_PREFIX = process.env.NETWORK === 'testnet' ? 'tb' : 'bc';

/**
 * Convert a compressed public key (hex) → native SegWit P2WPKH bech32 address.
 * Witness version 0, 20-byte program = HASH160(pubkey).
 */
function publicKeyToSegWitAddress(publicKey) {
  const pubkeyHash = hash160(Buffer.from(publicKey, 'hex'));
  const words = bech32.toWords(pubkeyHash);
  words.unshift(0); // witness version 0
  return bech32.encode(NETWORK_PREFIX, words);
}

/**
 * Decode a bech32 SegWit address.
 * Returns { version, program } where program is a Buffer.
 * Throws on invalid address.
 */
function decodeSegWitAddress(address) {
  const { prefix, words } = bech32.decode(address);
  if (prefix !== NETWORK_PREFIX) {
    throw new Error(`Invalid network prefix: expected ${NETWORK_PREFIX}, got ${prefix}`);
  }
  const version = words[0];
  if (version !== 0) throw new Error(`Unsupported witness version: ${version}`);
  const program = Buffer.from(bech32.fromWords(words.slice(1)));
  if (program.length !== 20 && program.length !== 32) {
    throw new Error(`Invalid witness program length: ${program.length}`);
  }
  return { version, program };
}

/**
 * Return true if the string looks like a valid bech32 SegWit address.
 */
function isSegWitAddress(address) {
  try {
    decodeSegWitAddress(address);
    return true;
  } catch {
    return false;
  }
}

module.exports = { publicKeyToSegWitAddress, decodeSegWitAddress, isSegWitAddress };
