// utils/crypto.js
// Core cryptographic primitives — Bitcoin-style secp256k1 + hashing

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// ── Hashing ──────────────────────────────────────────────────────────────────

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function doubleSha256(data) {
  return sha256(sha256(data));
}

function ripemd160(data) {
  return crypto.createHash('ripemd160').update(data).digest();
}

// HASH160 = RIPEMD160(SHA256(data)) — used in P2PKH addresses
function hash160(data) {
  return ripemd160(sha256(data));
}

// ── Base58 ───────────────────────────────────────────────────────────────────

function base58Encode(buffer) {
  // Count leading zero bytes
  let leadingZeros = 0;
  for (const byte of buffer) {
    if (byte === 0) leadingZeros++;
    else break;
  }

  let num = BigInt('0x' + buffer.toString('hex'));
  let result = '';

  while (num > 0n) {
    const remainder = Number(num % 58n);
    result = BASE58_ALPHABET[remainder] + result;
    num = num / 58n;
  }

  // Each leading zero byte → leading '1' character
  return '1'.repeat(leadingZeros) + result;
}

function base58Decode(str) {
  let num = 0n;
  for (const char of str) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * 58n + BigInt(index);
  }

  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = Buffer.from(hex, 'hex');

  // Count leading '1's → leading zero bytes
  let leadingZeros = 0;
  for (const char of str) {
    if (char === '1') leadingZeros++;
    else break;
  }

  return Buffer.concat([Buffer.alloc(leadingZeros), bytes]);
}

// Base58Check encode (with 4-byte checksum)
function base58CheckEncode(buffer) {
  const checksum = doubleSha256(buffer).slice(0, 4);
  return base58Encode(Buffer.concat([buffer, checksum]));
}

// Base58Check decode — throws if checksum is invalid
function base58CheckDecode(str) {
  const buffer = base58Decode(str);
  const payload = buffer.slice(0, -4);
  const checksum = buffer.slice(-4);
  const expectedChecksum = doubleSha256(payload).slice(0, 4);
  if (!checksum.equals(expectedChecksum)) throw new Error('Invalid checksum');
  return payload;
}

// ── Key Generation ───────────────────────────────────────────────────────────

function generateKeyPair() {
  const key = ec.genKeyPair();
  return {
    privateKey: key.getPrivate('hex'),
    publicKey: key.getPublic(true, 'hex') // compressed public key
  };
}

// Derive compressed public key from private key
function getPublicKey(privateKey) {
  return ec.keyFromPrivate(privateKey, 'hex').getPublic(true, 'hex');
}

// ── Address Generation (P2PKH, Bitcoin mainnet) ───────────────────────────────

function publicKeyToAddress(publicKey) {
  const pubKeyBuffer = Buffer.from(publicKey, 'hex');
  const pubKeyHash = hash160(pubKeyBuffer);
  // Version byte 0x00 = mainnet P2PKH
  const versioned = Buffer.concat([Buffer.from([0x00]), pubKeyHash]);
  return base58CheckEncode(versioned);
}

// Validate a base58check address and return its hash160 payload, or null
function addressToHash160(address) {
  try {
    const decoded = base58CheckDecode(address);
    if (decoded.length !== 21) return null;
    return decoded.slice(1); // strip version byte
  } catch {
    return null;
  }
}

// ── Signing / Verification ───────────────────────────────────────────────────

// Sign a Buffer hash with a hex private key; returns DER-encoded hex signature
function sign(privateKey, hash) {
  const key = ec.keyFromPrivate(privateKey, 'hex');
  const signature = key.sign(hash);
  return signature.toDER('hex');
}

// Verify a DER-encoded hex signature against a hash using the hex public key
function verify(publicKey, hash, signature) {
  try {
    const key = ec.keyFromPublic(publicKey, 'hex');
    return key.verify(hash, signature);
  } catch {
    return false;
  }
}

module.exports = {
  sha256,
  doubleSha256,
  ripemd160,
  hash160,
  base58Encode,
  base58Decode,
  base58CheckEncode,
  base58CheckDecode,
  generateKeyPair,
  getPublicKey,
  publicKeyToAddress,
  addressToHash160,
  sign,
  verify,
  ec
};
