const express = require('express');
const router = express.Router();
const Wallet = require('../wallet/wallet');

// Initialize wallet (in a real node, load from file)
const nodeWallet = new Wallet();

router.get('/balance/:address', (req, res) => {
  const address = req.params.address;
  // Use blockchain instance from app context
  const balance = req.app.locals.blockchain.utxoSet.getBalance(address);
  res.json({ address, balance });
});

router.post('/transaction', (req, res) => {
  const { to, amount } = req.body;
  try {
    const tx = nodeWallet.createTransaction(to, amount, req.app.locals.blockchain);
    req.app.locals.blockchain.addTransaction(tx);
    req.app.locals.p2pServer.broadcastTransaction(tx);
    res.json({ txid: tx.getId() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/mine', (req, res) => {
  const minerAddress = req.body.address || nodeWallet.address;
  const newBlock = req.app.locals.blockchain.minePendingTransactions(minerAddress);
  if (newBlock) {
    req.app.locals.p2pServer.broadcastLatest();
    res.json({ block: newBlock });
  } else {
    res.status(500).json({ error: 'Mining failed' });
  }
});

router.get('/blocks', (req, res) => {
  res.json(req.app.locals.blockchain.chain);
});

router.get('/utxo/:address', (req, res) => {
  const address = req.params.address;
  const utxos = [];
  for (let [key, utxo] of req.app.locals.blockchain.utxoSet.entries()) {
    if (utxo.address === address) utxos.push({ key, ...utxo });
  }
  res.json(utxos);
});

module.exports = router;