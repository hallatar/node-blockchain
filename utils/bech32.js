const { sha256, ripemd160 } = require('./crypto');
const bech32 = require('bech32'); // npm install bech32

function publicKeyToSegWitAddress(publicKey) {
  const pubkeyHash = ripemd160(sha256(Buffer.from(publicKey, 'hex')));
  const words = bech32.toWords(pubkeyHash);
  words.unshift(0); // witness version 0
  return bech32.encode('bc', words);
}

function decodeSegWitAddress(address) {
  const { prefix, words } = bech32.decode(address);
  if (prefix !== 'bc') throw new Error('Invalid prefix');
  const version = words[0];
  if (version !== 0) throw new Error('Only version 0 supported');
  const program = bech32.fromWords(words.slice(1));
  return { version, program: Buffer.from(program) };
}