const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function doubleSha256(data) {
  return sha256(sha256(data));
}

function ripemd160(data) {
  return crypto.createHash('ripemd160').update(data).digest();
}

// Generate key pair
function generateKeyPair() {
  const key = ec.genKeyPair();
  return {
    privateKey: key.getPrivate('hex'),
    publicKey: key.getPublic('hex')
  };
}

// Sign hash with private key
function sign(privateKey, hash) {
  const key = ec.keyFromPrivate(privateKey);
  const signature = key.sign(hash);
  return signature.toDER('hex');
}

// Verify signature
function verify(publicKey, hash, signature) {
  const key = ec.keyFromPublic(publicKey, 'hex');
  return key.verify(hash, signature);
}

// Public key hash -> address (Bitcoin style)
function publicKeyToAddress(publicKey) {
  const hash = ripemd160(sha256(Buffer.from(publicKey, 'hex')));
  // Add version byte (0x00 for mainnet)
  const versioned = Buffer.concat([Buffer.from([0x00]), hash]);
  const checksum = doubleSha256(versioned).slice(0, 4);
  return base58Encode(Buffer.concat([versioned, checksum]));
}

// Base58 encoding (simplified)
function base58Encode(buffer) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  // ... implementation
}

module.exports = {
  sha256, doubleSha256, ripemd160,
  generateKeyPair, sign, verify, publicKeyToAddress
};