# Bitcoin-like Blockchain in Node.js

A fully functional cryptocurrency blockchain implementation in Node.js, featuring:

- UTXO-based transaction model
- Proof-of-Work consensus
- Peer-to-peer networking
- Wallet with key generation and signing
- **Merkle Tree** for efficient transaction verification
- **Segregated Witness (SegWit)** with bech32 addresses
- **Lightning Network** (simplified) for off-chain payments

This project is designed for educational purposes and demonstrates core Bitcoin concepts in a modular, extensible codebase.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Running the Node](#running-the-node)
- [API Reference](#api-reference)
- [Lightning Network Usage](#lightning-network-usage)
- [Configuration](#configuration)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Blockchain
- **UTXO Model**: Each transaction consumes previous outputs and creates new ones.
- **Proof-of-Work**: Adjustable difficulty with SHA‑256 mining.
- **Block Validation**: Chain integrity and transaction signature verification.
- **Mempool**: Pending transactions waiting to be mined.
- **Persistent Storage**: LevelDB for chain state and UTXO set.

### Wallet & Cryptography
- **Key Generation**: `secp256k1` elliptic curve cryptography.
- **Addresses**: Base58 (legacy) and Bech32 (SegWit) formats.
- **Transaction Signing**: ECDSA signatures with proper hash pre‑image calculation.

### Merkle Trees
- **Efficient Block Headers**: Only the Merkle root is stored in the block header.
- **Light‑Client Proofs**: Ability to generate and verify inclusion proofs (SPV).

### SegWit (Segregated Witness)
- **Transaction Malleability Fix**: Witness data is excluded from `txid`.
- **Weight Units**: Block size measured in weight (4 M weight limit).
- **Bech32 Addresses**: Native SegWit addresses (e.g., `bc1q...`).
- **BIP143 Sighash**: New signature digest algorithm for SegWit inputs.

### Lightning Network (Layer 2)
- **Payment Channels**: Open and close 2‑of‑2 multisig channels on‑chain.
- **Off‑Chain State**: Commitment transactions exchanged without broadcasting.
- **HTLCs**: Hash Time‑Locked Contracts for multi‑hop payments.
- **Revocation**: Penalty mechanism to discourage cheating.
- **Gossip Protocol**: Discover peers and channel announcements.

### P2P Networking
- **WebSocket Communication**: Peer discovery and block/tx propagation.
- **Chain Synchronization**: Longest‑chain rule and reorganisation handling.
- **Message Types**: `NEW_BLOCK`, `NEW_TRANSACTION`, `REQUEST_CHAIN`.

---

## Architecture

blockchain-node/
├── index.js # Main entry point
├── config.js # Constants (block time, reward, ports)
├── blockchain/
│ ├── block.js
│ ├── transaction.js
│ ├── utxo.js
│ ├── chain.js
│ ├── mempool.js
│ └── miner.js
├── wallet/
│ ├── wallet.js
│ └── keygen.js
├── lightning/
│ ├── node.js
│ ├── channel.js
│ ├── htlc.js
│ └── router.js
├── p2p/
│ ├── server.js
│ ├── peer-manager.js
│ └── messages.js
├── api/
│ ├── routes.js
│ └── lightning-routes.js
├── storage/
│ └── db.js # LevelDB wrapper
├── utils/
│ ├── crypto.js
│ ├── merkle.js
│ ├── bech32.js
│ └── validator.js
└── package.json


---

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bitcoin-like-blockchain.git
   cd bitcoin-like-blockchain

2. Install dependencies:

    ```bash
    npm install

3. (Optional) Install level for persistent storage:

    ```bash
    npm install level

Running the Node
Single Node
    ```bash
    node index.js

This starts:

HTTP API on port 3001

P2P WebSocket server on port 6001

Lightning P2P server on port 9735 (if enabled)

Multiple Nodes (Local Testnet)
Open separate terminals:

Node 1:

    ```bash
    HTTP_PORT=3001 P2P_PORT=6001 LIGHTNING_PORT=9735 node index.js

Node 2:

    ```bash
    HTTP_PORT=3002 P2P_PORT=6002 LIGHTNING_PORT=9736 PEERS=ws://localhost:6001 node index.js

Node 3:

    ```bash
    HTTP_PORT=3003 P2P_PORT=6003 LIGHTNING_PORT=9737 PEERS=ws://localhost:6001,ws://localhost:6002 node index.js


API Reference
All endpoints are prefixed with /api.

Blockchain & Wallet
Method	Endpoint	Description
GET	/balance/:address	Get balance of an address
POST	/transaction	Create and broadcast a transaction
POST	/mine	Mine pending transactions (reward to miner)
GET	/blocks	List all blocks in the chain
GET	/block/:hash	Get a specific block
GET	/utxo/:address	List UTXOs belonging to an address
GET	/mempool	View pending transactions

Example: Send Transaction
    ```bash
    curl -X POST http://localhost:3001/api/transaction \
    -H "Content-Type: application/json" \
    -d '{"to": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "amount": 10}'

Response:

    ```json
    {"txid": "a1b2c3d4e5f6..."}

Lightning Network
Method	Endpoint	Description
POST	/lightning/openchannel	Open a channel with a peer
POST	/lightning/pay	Send a Lightning payment
GET	/lightning/channels	List active channels
POST	/lightning/invoice	Generate a payment invoice
GET	/lightning/peers	List connected Lightning peers

Example: Open Channel
    ```bash
    curl -X POST http://localhost:3001/api/lightning/openchannel \
    -H "Content-Type: application/json" \
    -d '{"peerPubkey": "03a34b99...", "capacity": 100000}'

Response:

    ```json
    {"channelId": "f7e6d5c4b3a2..."}

Example: Pay Invoice
    ```bash
    curl -X POST http://localhost:3001/api/lightning/pay \
    -H "Content-Type: application/json" \
    -d '{"invoice": "lnbc10n1..."}'

Lightning Network Usage

1. Connect to a Peer
Nodes automatically discover each other via the P2P network, but you can manually connect:

    ```javascript
    lightning.connectToPeer("03a34b99...", "127.0.0.1", 9736);

2. Open a Channel
A funding transaction is created on the main chain. Wait for 3 confirmations.

3. Send a Payment
Generate an invoice on the recipient side:

    ```bash
    curl -X POST http://localhost:3002/api/lightning/invoice \
    -d '{"amount": 5000, "memo": "coffee"}'

Then pay from the sender:

    ```bash
    curl -X POST http://localhost:3001/api/lightning/pay \
    -d '{"invoice": "lnbc50u1..."}'

4. Close a Channel
Channels can be closed cooperatively (fast) or unilaterally (with a timelock).


Configuration
Environment variables:

Variable	Default	Description
HTTP_PORT	3001	Port for REST API
P2P_PORT	6001	WebSocket port for P2P networking
LIGHTNING_PORT	9735	Port for Lightning P2P protocol
PEERS	(none)	Comma-separated list of initial peers (e.g., ws://localhost:6001)
DIFFICULTY	4	Number of leading zeros required in block hash
MINING_REWARD	50	Coinbase reward in satoshis
DATA_DIR	./chaindata	Directory for LevelDB storage


Testing
Run the test suite:

    ```bash
    npm test

Tests cover:

Transaction creation and validation

Block mining and chain validation

Merkle proof verification

SegWit signature hashing (BIP143)

Lightning channel state updates


Contributing
Contributions are welcome! Please follow these steps:

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

Please ensure your code adheres to the existing style and includes appropriate tests.

License
This project is licensed under the MIT License – see the LICENSE file for details.

Acknowledgements
Bitcoin Core developers for the original protocol design.

Elliptic for secp256k1 cryptography.

Bech32 library.

The Lightning Network whitepaper and BOLT specifications.

