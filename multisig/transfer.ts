import { MultiSigExecutor } from './executor';
import { Signature } from './transaction';

import { MultiSig } from 'signhash';
import { TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class TransferCommand {
  private readonly executor: MultiSigExecutor;

  constructor(private web3: Web3, private multiSig: MultiSig) {
    this.executor = new MultiSigExecutor(web3, multiSig);
  }

  public sign(
    signer: Address,
    nonce: Web3.AnyNumber,
    destination: Address,
    value: Web3.AnyNumber
  ): Signature {
    return this.executor.sign(signer, nonce, destination, value, '0x');
  }

  public async execute(
    signatures: Signature[],
    destination: Address,
    value: Web3.AnyNumber
  ): Promise<TransactionResult> {
    return this.executor.execute(signatures, destination, value, '0x');
  }
}
