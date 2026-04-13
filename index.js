const express = require('express');
const Blockchain = require('./blockchain/chain');
const P2PServer = require('./p2p/server');
const apiRoutes = require('./api/routes');
const LightningNode = require('./lightning/node');

const app = express();
app.use(express.json());

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const P2P_PORT = process.env.P2P_PORT || 6001;

const blockchain = new Blockchain();
blockchain.initialize().then(() => {
    const p2pServer = new P2PServer(blockchain, P2P_PORT);
    p2pServer.start();

    // Share blockchain instance with routes
    app.locals.blockchain = blockchain;
    app.locals.p2pServer = p2pServer;

    const lightning = new LightningNode(blockchain, nodeWallet, LIGHTNING_PORT);
    lightning.start();

    // Add new API routes for Lightning
    app.use('/api/lightning', require('./api/lightning-routes')(lightning));

    app.use('/api', apiRoutes);

    app.listen(HTTP_PORT, () => {
        console.log(`HTTP API running on port ${HTTP_PORT}`);
    });

    // Connect to seed peers if any (from env)
    if (process.env.PEERS) {
        process.env.PEERS.split(',').forEach(peer => p2pServer.connectToPeer(peer));
    }
});