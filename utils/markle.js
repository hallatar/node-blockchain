// utils/markle.js  (intentional project filename spelling)
// Bitcoin-style Merkle tree: double-SHA256, duplicate last node on odd layers

const { doubleSha256 } = require('./crypto');

/**
 * Compute the Merkle root of an array of transactions (or hex txids).
 * Returns a 64-char hex string.
 */
function merkleRoot(transactions) {
  if (!transactions || transactions.length === 0) {
    return Buffer.alloc(32).toString('hex');
  }

  let layer = transactions.map(tx => {
    const txid = tx.getId ? tx.getId() : tx;
    return Buffer.from(txid, 'hex');
  });

  while (layer.length > 1) {
    if (layer.length % 2 !== 0) {
      // Duplicate last element (Bitcoin rule)
      layer.push(layer[layer.length - 1]);
    }
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      nextLayer.push(doubleSha256(Buffer.concat([layer[i], layer[i + 1]])));
    }
    layer = nextLayer;
  }

  return layer[0].toString('hex');
}

/**
 * Compute a Merkle inclusion proof for a given txid.
 * Returns an array of { hash, direction } objects, or null if txid not found.
 * direction = 'left' | 'right' — the sibling's position relative to the target.
 */
function merkleProof(transactions, targetTxid) {
  if (!transactions || transactions.length === 0) return null;

  let layer = transactions.map(tx => {
    const txid = tx.getId ? tx.getId() : tx;
    return Buffer.from(txid, 'hex');
  });

  let idx = transactions.findIndex(tx => {
    const txid = tx.getId ? tx.getId() : tx;
    return txid === targetTxid;
  });

  if (idx === -1) return null;

  const proof = [];

  while (layer.length > 1) {
    if (layer.length % 2 !== 0) {
      layer.push(layer[layer.length - 1]);
    }

    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    const sibling = layer[Math.min(siblingIdx, layer.length - 1)];

    proof.push({
      hash: sibling.toString('hex'),
      direction: isRight ? 'left' : 'right'
    });

    // Build next layer
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      nextLayer.push(doubleSha256(Buffer.concat([layer[i], layer[i + 1]])));
    }
    layer = nextLayer;
    idx = Math.floor(idx / 2);
  }

  return proof;
}

/**
 * Verify a Merkle proof against a known root.
 */
function verifyMerkleProof(txid, proof, root) {
  let current = Buffer.from(txid, 'hex');
  for (const step of proof) {
    const sibling = Buffer.from(step.hash, 'hex');
    if (step.direction === 'right') {
      current = doubleSha256(Buffer.concat([current, sibling]));
    } else {
      current = doubleSha256(Buffer.concat([sibling, current]));
    }
  }
  return current.toString('hex') === root;
}

module.exports = { merkleRoot, merkleProof, verifyMerkleProof };
