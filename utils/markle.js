const { doubleSha256 } = require('./crypto');

function merkleRoot(transactions) {
  if (transactions.length === 0) return Buffer.alloc(32).toString('hex');
  
  let layer = transactions.map(tx => {
    // For SegWit, we hash the wtxid (witness txid) - see later
    const txid = tx.getId ? tx.getId() : tx;
    return Buffer.from(txid, 'hex');
  });

  while (layer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = (i + 1 < layer.length) ? layer[i + 1] : left;
      const combined = Buffer.concat([left, right]);
      nextLayer.push(doubleSha256(combined));
    }
    layer = nextLayer;
  }
  return layer[0].toString('hex');
}

function merkleProof(transactions, targetTxid) {
  // Returns array of sibling hashes and a direction bit for each level
  // ... implementation for light client verification
}

module.exports = { merkleRoot, merkleProof };