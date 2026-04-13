const { doubleSha256 } = require('../utils/crypto');

class Channel {
  constructor({ channelId, funder, fundee, capacity, fundingTxid, fundingOutputIndex }) {
    this.channelId = channelId;
    this.funder = funder;       // public key
    this.fundee = fundee;
    this.capacity = capacity;
    this.fundingTxid = fundingTxid;
    this.fundingOutputIndex = fundingOutputIndex;
    
    // Current balances (in satoshis)
    this.localBalance = (funder === localNodeId) ? capacity : 0;
    this.remoteBalance = capacity - this.localBalance;
    
    this.commitmentNumber = 0;
    this.localCommitmentTx = null;  // latest signed commitment from remote
    this.remoteCommitmentTx = null;
    this.revocationKeys = new Map(); // for punishment
  }

  // Create a new commitment transaction reflecting new balances
  createCommitmentTx() {
    // Build transaction spending the funding output
    const tx = new Transaction({
      inputs: [{ txid: this.fundingTxid, outputIndex: this.fundingOutputIndex }],
      outputs: [
        { address: this.funder, amount: this.localBalance },
        { address: this.fundee, amount: this.remoteBalance }
      ]
    });
    // Add timelock and revocation scripts (simplified)
    return tx;
  }

  // Update balances after a payment
  updateBalances(amount, direction) {
    if (direction === 'to_remote') {
      this.localBalance -= amount;
      this.remoteBalance += amount;
    } else {
      this.localBalance += amount;
      this.remoteBalance -= amount;
    }
    this.commitmentNumber++;
  }
}
