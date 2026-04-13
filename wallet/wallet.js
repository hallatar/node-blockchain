const { generateKeyPair, publicKeyToAddress } = require('../utils/crypto');
const Transaction = require('../blockchain/transaction');

class Wallet {
  constructor() {
    const keys = generateKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;
    this.address = publicKeyToAddress(this.publicKey);
  }

  getBalance(blockchain) {
    let balance = 0;
    for (let [key, utxo] of blockchain.utxoSet.entries()) {
      if (utxo.address === this.address) {
        balance += utxo.amount;
      }
    }
    return balance;
  }

  createTransaction(toAddress, amount, blockchain) {
    // Find UTXOs belonging to this wallet
    const myUTXOs = [];
    for (let [key, utxo] of blockchain.utxoSet.entries()) {
      if (utxo.address === this.address) {
        const [txid, outputIndex] = key.split(':');
        myUTXOs.push({ txid, outputIndex: parseInt(outputIndex), amount: utxo.amount });
      }
    }

    let accumulated = 0;
    const inputs = [];
    for (let utxo of myUTXOs) {
      accumulated += utxo.amount;
      inputs.push({ txid: utxo.txid, outputIndex: utxo.outputIndex });
      if (accumulated >= amount) break;
    }
    
    if (accumulated < amount) throw new Error('Insufficient balance');

    const outputs = [{ address: toAddress, amount }];
    const change = accumulated - amount;
    if (change > 0) {
      outputs.push({ address: this.address, amount: change });
    }

    const tx = new Transaction({ inputs, outputs });
    
    // Sign each input with corresponding output script (simplified: address holds pubkey)
    for (let i = 0; i < inputs.length; i++) {
      const utxo = myUTXOs[i];
      const prevScript = utxo.amount.toString(); // in reality, it's the locking script
      tx.signInput(i, this.privateKey, prevScript);
    }
    
    return tx;
  }
}