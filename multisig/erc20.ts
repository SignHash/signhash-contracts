import { ERC20, MultiSig } from 'signhash';
import { TransactionResult } from 'truffle';
import { getData, MultiSigTransaction, Signature } from './transaction';

import * as Web3 from 'web3';

export class MultiSigERC20Transfer {
  private transaction: MultiSigTransaction;

  constructor(
    private web3: Web3,
    private instance: MultiSig,
    private token: ERC20
  ) {
    this.transaction = new MultiSigTransaction(web3, instance);
  }

  public async sign(
    signer: Address,
    destination: Address,
    amount: Web3.AnyNumber,
    nonce: Web3.AnyNumber
  ): Promise<Signature> {
    const data = await getData(this.token.transfer, destination, amount);
    return this.transaction.sign(signer, this.token.address, 0, nonce, data);
  }

  public async execute(
    signatures: Signature[],
    destination: Address,
    amount: Web3.AnyNumber
  ): Promise<TransactionResult> {
    const data = await getData(this.token.transfer, destination, amount);
    return this.transaction.execute(signatures, this.token.address, 0, data);
  }
}
