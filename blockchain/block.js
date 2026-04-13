const { doubleSha256 } = require('../utils/crypto');

class Block {
  constructor({ index, timestamp, transactions, previousHash, nonce = 0, hash = '' }) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.merkleRoot = merkleRoot(transactions);
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = hash || this.calculateHash();
  }

  calculateHash() {
    const header = {
      index: this.index,
      timestamp: this.timestamp,
      merkleRoot: this.merkleRoot,
      previousHash: this.previousHash,
      nonce: this.nonce
    };
    return doubleSha256(Buffer.from(JSON.stringify(header))).toString('hex');
  }

  // Proof-of-work: hash must start with DIFFICULTY zeros
  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }

  // Validate block structure and transactions
  isValid(chain, utxoSet) {
    if (this.index !== 0 && this.previousHash !== chain.getLatestBlock().hash) {
      return false;
    }
    if (this.hash !== this.calculateHash()) return false;
    
    // Verify all transactions (except coinbase)
    for (let i = 1; i < this.transactions.length; i++) {
      if (!this.transactions[i].verify(utxoSet)) return false;
    }
    return true;
  }
}