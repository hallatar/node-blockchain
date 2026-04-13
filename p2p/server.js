const WebSocket = require('ws');
const PeerManager = require('./peer-manager');

class P2PServer {
  constructor(blockchain, port) {
    this.blockchain = blockchain;
    this.port = port;
    this.peerManager = new PeerManager();
    this.server = new WebSocket.Server({ port });
  }

  start() {
    this.server.on('connection', (ws, req) => {
      this.handleConnection(ws);
    });
    console.log(`P2P server listening on ${this.port}`);
  }

  handleConnection(ws) {
    this.peerManager.addPeer(ws);
    ws.on('message', (message) => this.handleMessage(ws, message));
    ws.on('close', () => this.peerManager.removePeer(ws));
    // Send latest block info
    ws.send(JSON.stringify({ type: 'LATEST_BLOCK', data: this.blockchain.getLatestBlock() }));
  }

  handleMessage(ws, message) {
    const msg = JSON.parse(message);
    switch (msg.type) {
      case 'NEW_BLOCK':
        this.handleNewBlock(msg.data);
        break;
      case 'NEW_TRANSACTION':
        this.handleNewTransaction(msg.data);
        break;
      case 'REQUEST_CHAIN':
        ws.send(JSON.stringify({ type: 'CHAIN', data: this.blockchain.chain }));
        break;
    }
  }

  handleNewBlock(blockData) {
    const block = new Block(blockData);
    if (block.isValid(this.blockchain, this.blockchain.utxoSet)) {
      this.blockchain.chain.push(block);
      this.blockchain.updateUTXOSet(block);
      this.peerManager.broadcast(JSON.stringify({ type: 'NEW_BLOCK', data: block }));
    }
  }

  handleNewTransaction(txData) {
    const tx = new Transaction(txData);
    if (this.blockchain.addTransaction(tx)) {
      this.peerManager.broadcast(JSON.stringify({ type: 'NEW_TRANSACTION', data: tx }));
    }
  }

  broadcastLatest() {
    const block = this.blockchain.getLatestBlock();
    this.peerManager.broadcast(JSON.stringify({ type: 'NEW_BLOCK', data: block }));
  }

  connectToPeer(peerUrl) {
    const ws = new WebSocket(peerUrl);
    ws.on('open', () => this.handleConnection(ws));
  }
}