class HTLC {
  constructor({ hash, amount, expiry, nextHop }) {
    this.paymentHash = hash;      // H = sha256(R)
    this.amount = amount;
    this.expiry = expiry;         // absolute block height
    this.nextHop = nextHop;       // peer to forward to
    this.state = 'offered';       // offered, received, resolved, failed
  }

  // The locking script in commitment output (simplified):
  // OP_IF
  //   <expiry> OP_CHECKLOCKTIMEVERIFY OP_DROP <remote_pubkey> OP_CHECKSIG
  // OP_ELSE
  //   OP_SHA256 <hash> OP_EQUALVERIFY <local_pubkey> OP_CHECKSIG
  // OP_ENDIF
}