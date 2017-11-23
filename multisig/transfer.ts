import { MultiSigTransaction, Signature } from './transaction';

import { MultiSig } from 'signhash';
import { TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class MultiSigTransfer {
  private transaction: MultiSigTransaction;

  constructor(private web3: Web3, private instance: MultiSig) {
    this.transaction = new MultiSigTransaction(web3, instance);
  }

  public sign(
    signer: Address,
    destination: Address,
    value: Web3.AnyNumber,
    nonce: Web3.AnyNumber
  ): Signature {
    return this.transaction.sign(signer, destination, value, nonce, '0x');
  }

  public async execute(
    signatures: Signature[],
    destination: Address,
    value: Web3.AnyNumber
  ): Promise<TransactionResult> {
    return this.transaction.execute(signatures, destination, value, '0x');
  }
}
