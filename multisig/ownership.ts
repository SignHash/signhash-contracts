import {
  groupSignatures,
  MultiSigTransaction,
  Signature,
  toHex
} from './transaction';

import { TransferableMultiSig } from 'signhash';
import { TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class TransferOwnershipCommand {
  private readonly transaction: MultiSigTransaction;

  constructor(private web3: Web3, private multiSig: TransferableMultiSig) {
    this.transaction = new MultiSigTransaction(web3, multiSig.address);
  }

  public sign(
    signer: Address,
    nonce: Web3.AnyNumber,
    newOwners: Address[]
  ): Signature {
    return this.transaction.sign(signer, nonce, [
      newOwners.reduce((acc, owner) => acc.concat(toHex(owner, 64)), '')
    ]);
  }

  public async execute(
    signatures: Signature[],
    newOwners: Address[]
  ): Promise<TransactionResult> {
    const { v, r, s } = groupSignatures(signatures);
    return this.multiSig.transferOwnership(v, r, s, newOwners);
  }
}
