class PeerManager {
  constructor() {
    this.peers = new Set();
  }

  addPeer(ws) {
    this.peers.add(ws);
  }

  removePeer(ws) {
    this.peers.delete(ws);
  }

  broadcast(message) {
    for (let peer of this.peers) {
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(message);
      }
    }
  }
}