import { ExecuteCommand } from './execution';
import { Signature } from './transaction';

import { MultiSig } from 'signhash';
import { TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class TransferCommand {
  private readonly execution: ExecuteCommand;

  constructor(private web3: Web3, private instance: MultiSig) {
    this.execution = new ExecuteCommand(web3, instance);
  }

  public sign(
    signer: Address,
    nonce: Web3.AnyNumber,
    destination: Address,
    value: Web3.AnyNumber
  ): Signature {
    return this.execution.sign(signer, nonce, destination, value, '0x');
  }

  public async execute(
    signatures: Signature[],
    destination: Address,
    value: Web3.AnyNumber
  ): Promise<TransactionResult> {
    return this.execution.execute(signatures, destination, value, '0x');
  }
}
