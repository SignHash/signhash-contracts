import {
  groupSignatures,
  MultiSigTransaction,
  Signature,
  stripHex,
  toHex
} from './transaction';

import { MultiSig } from 'signhash';
import { Method, TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class ExecuteCommand {
  private readonly transaction: MultiSigTransaction;

  constructor(private web3: Web3, private instance: MultiSig) {
    this.transaction = new MultiSigTransaction(web3, instance.address);
  }

  public sign(
    signer: Address,
    nonce: Web3.AnyNumber,
    destination: Address,
    value: Web3.AnyNumber,
    data: string
  ): Signature {
    return this.transaction.sign(signer, nonce, [
      stripHex(destination),
      toHex(value, 64),
      stripHex(data)
    ]);
  }

  public async execute(
    signatures: Signature[],
    destination: Address,
    value: Web3.AnyNumber,
    data: string
  ): Promise<TransactionResult> {
    const { v, r, s } = groupSignatures(signatures);
    return this.instance.execute(v, r, s, destination, value, data);
  }
}

export async function getData(func: any, ...args: any[]): Promise<string> {
  const method = (func as any) as Method;
  const request = await method.request(...args);
  const [param] = request.params;
  return param.data;
}
