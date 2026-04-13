const Block = require('./block');
const Transaction = require('./transaction');
const db = require('../storage/db');

class Blockchain {
  constructor() {
    this.chain = [];
    this.utxoSet = new Map(); // key: `${txid}:${outputIndex}` => { address, amount }
    this.mempool = [];
    this.difficulty = 4;
    this.miningReward = 50;
  }

  async initialize() {
    const storedChain = await db.get('chain');
    if (storedChain) {
      this.chain = storedChain;
      await this.rebuildUTXOSet();
    } else {
      this.createGenesisBlock();
    }
  }

  createGenesisBlock() {
    const genesisTx = new Transaction({
      inputs: [],
      outputs: [{ address: 'genesis', amount: 100 }] // pre-mined
    });
    const genesisBlock = new Block({
      index: 0,
      timestamp: Date.now(),
      transactions: [genesisTx],
      previousHash: '0'
    });
    this.chain.push(genesisBlock);
    this.updateUTXOSet(genesisBlock);
  }

  // Update UTXO set when a block is added
  updateUTXOSet(block) {
    for (const tx of block.transactions) {
      // Remove spent outputs
      for (const input of tx.inputs) {
        const key = `${input.txid}:${input.outputIndex}`;
        this.utxoSet.delete(key);
      }
      // Add new outputs
      for (let i = 0; i < tx.outputs.length; i++) {
        const key = `${tx.getId()}:${i}`;
        this.utxoSet.set(key, {
          address: tx.outputs[i].address,
          amount: tx.outputs[i].amount
        });
      }
    }
  }

  async rebuildUTXOSet() {
    this.utxoSet.clear();
    for (const block of this.chain) {
      this.updateUTXOSet(block);
    }
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(tx) {
    if (!tx.verify(this.utxoSet)) return false;
    this.mempool.push(tx);
    return true;
  }

  // Mine pending transactions
  async minePendingTransactions(minerAddress) {
    const coinbaseTx = new Transaction({
      inputs: [],
      outputs: [{ address: minerAddress, amount: this.miningReward }]
    });
    
    const blockTransactions = [coinbaseTx, ...this.mempool];
    const newBlock = new Block({
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: blockTransactions,
      previousHash: this.getLatestBlock().hash
    });
    
    newBlock.mineBlock(this.difficulty);
    
    // Validate and add
    if (newBlock.isValid(this, this.utxoSet)) {
      this.chain.push(newBlock);
      this.updateUTXOSet(newBlock);
      this.mempool = [];
      await db.put('chain', this.chain);
      return newBlock;
    }
    return null;
  }

  // Validate entire chain
  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i-1];
      if (currentBlock.previousHash !== previousBlock.hash) return false;
      if (currentBlock.hash !== currentBlock.calculateHash()) return false;
      // Validate transactions (would need a UTXO snapshot at that block)
    }
    return true;
  }
}