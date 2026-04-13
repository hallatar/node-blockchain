const WebSocket = require('ws');
const Channel = require('./channel');
const HTLC = require('./htlc');

class LightningNode {
  constructor(blockchain, wallet, p2pPort) {
    this.blockchain = blockchain;
    this.wallet = wallet;
    this.channels = new Map();      // channelId -> Channel
    this.pendingHTLCs = new Map();  // paymentHash -> HTLC
    this.peers = new Map();
    
    // Start Lightning P2P server (separate port)
    this.server = new WebSocket.Server({ port: p2pPort });
    this.server.on('connection', (ws) => this.handlePeer(ws));
  }

  // Open a channel with a peer (requires on-chain funding tx)
  async openChannel(peerPubkey, capacity) {
    // 1. Create funding transaction (2-of-2 multisig)
    const fundingTx = this.createFundingTransaction(peerPubkey, capacity);
    // 2. Broadcast to blockchain
    await this.blockchain.addTransaction(fundingTx);
    // 3. Wait for confirmation (simulated)
    // 4. Exchange `open_channel` and `accept_channel` messages
    const channelId = doubleSha256(Buffer.from(fundingTx.getId())).toString('hex');
    const channel = new Channel({
      channelId,
      funder: this.wallet.publicKey,
      fundee: peerPubkey,
      capacity,
      fundingTxid: fundingTx.getId(),
      fundingOutputIndex: 0
    });
    this.channels.set(channelId, channel);
    return channel;
  }

  // Send a payment through the network
  async sendPayment(destination, amount, paymentHash, route) {
    const htlc = new HTLC({ hash: paymentHash, amount, expiry: this.blockchain.chain.length + 144 });
    // Add to outgoing HTLCs and send `update_add_htlc` to first hop
    const firstPeer = route[0];
    this.sendMessage(firstPeer, { type: 'update_add_htlc', channelId: route[0].channelId, htlc });
    // Wait for preimage settlement...
  }

  // Receive a payment: when preimage is known, settle upstream
  settleHTLC(paymentHash, preimage) {
    // Verify sha256(preimage) == paymentHash
    // Send `update_fulfill_htlc` to upstream peer
  }

  // Watch blockchain for channel closures and broadcast justice tx if needed
  monitorBlockchain() {
    // Check for spent funding outputs
    // If remote broadcasted old state, publish penalty transaction
  }

  // P2P message handlers
  handleMessage(ws, msg) {
    switch(msg.type) {
      case 'open_channel': /* ... */ break;
      case 'update_add_htlc': /* ... */ break;
      case 'update_fulfill_htlc': /* ... */ break;
      case 'commitment_signed': /* ... */ break;
      // ...
    }
  }
}