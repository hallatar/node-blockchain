const { doubleSha256, sign, verify } = require('../utils/crypto');

class Transaction {
    constructor({ inputs, outputs, witness = [], isSegWit = false }) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.witness = witness;      // Array of witness stacks for each input
        this.isSegWit = isSegWit;
    }

    // Compute hash for signing (excluding scripts)
    hashForSignature(inputIndex, prevOutputScript) {
        const copy = JSON.parse(JSON.stringify(this));
        copy.inputs = copy.inputs.map((inp, idx) => {
            if (idx === inputIndex) {
                return { ...inp, scriptSig: prevOutputScript };
            } else {
                return { ...inp, scriptSig: '' };
            }
        });
        return doubleSha256(Buffer.from(JSON.stringify(copy)));
    }

    // Sign a specific input with private key
    signInput(inputIndex, privateKey, prevOutputScript) {
        const hash = this.hashForSignature(inputIndex, prevOutputScript);
        const signature = sign(privateKey, hash);
        this.inputs[inputIndex].scriptSig = signature;
    }

    // Verify all inputs
    verify(utxoSet) {
        for (let i = 0; i < this.inputs.length; i++) {
            const input = this.inputs[i];
            const utxo = utxoSet.get(input.txid, input.outputIndex);
            if (!utxo) return false;

            const hash = this.hashForSignature(i, utxo.scriptPubKey);
            const publicKey = utxo.address; // simplified: address holds public key
            if (!verify(publicKey, hash, input.scriptSig)) {
                return false;
            }
        }
        return true;
    }

    // Get transaction ID (hash of serialized tx)
    getId() {
        const data = {
            inputs: this.inputs.map(i => ({ txid: i.txid, index: i.outputIndex })),
            outputs: this.outputs
        };
        if (!this.isSegWit) {
            data.scripts = this.inputs.map(i => i.scriptSig);
        }
        return doubleSha256(Buffer.from(JSON.stringify(data))).toString('hex');
    }
    // Witness TXID (wtxid) used for merkle root in segwit blocks
    getWitnessId() {
        if (!this.isSegWit) return this.getId();
        const data = {
            inputs: this.inputs.map(i => ({ txid: i.txid, index: i.outputIndex })),
            outputs: this.outputs,
            witness: this.witness
        };
        return doubleSha256(Buffer.from(JSON.stringify(data))).toString('hex');
    }

    // Weight calculation for block size limit
    getWeight() {
        let weight = 0;
        // Non-witness bytes: inputs (txid+index) + outputs
        weight += this.inputs.length * (32 + 4) + JSON.stringify(this.outputs).length;
        if (!this.isSegWit) {
            weight += JSON.stringify(this.inputs.map(i => i.scriptSig)).length;
            weight *= 4; // legacy: each byte = 4 weight
        } else {
            // Witness bytes count as 1 weight each
            weight *= 4;
            const witnessBytes = JSON.stringify(this.witness).length;
            weight += witnessBytes;
        }
        return weight;
    }

    // Sign a segwit input (simplified: uses P2WPKH)
    signSegWitInput(inputIndex, privateKey, prevOutputScript) {
        const hashPrevOuts = this.hashPrevOuts();
        const hashSequence = this.hashSequence();
        const hashOutputs = this.hashOutputs();
        // Construct sighash according to BIP143
        const sighash = this.sighashBIP143(inputIndex, hashPrevOuts, hashSequence, hashOutputs, prevOutputScript);
        const signature = sign(privateKey, sighash);
        const publicKey = ec.keyFromPrivate(privateKey).getPublic('hex');
        this.witness[inputIndex] = [signature, publicKey];
    }
}