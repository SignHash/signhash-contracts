import { groupSignatures, MultiSigCommand, Signature, toHex } from './command';

import { MultiSig } from 'signhash';
import { TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class SetOwnersCommand {
  private readonly transaction: MultiSigCommand;

  constructor(private web3: Web3, private instance: MultiSig) {
    this.transaction = new MultiSigCommand(web3, instance.address);
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
    return this.instance.setOwners(v, r, s, newOwners);
  }
}
