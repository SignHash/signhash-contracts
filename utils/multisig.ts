import { BigNumber } from 'bignumber.js';
import { ERC20, TipsWallet } from 'signhash';
import { Method, TransactionResult } from 'truffle';

import * as Web3 from 'web3';

export class MultiSig {
  private readonly prefix = 0x19;
  private readonly version = 0x0;

  constructor(private web3: Web3, private wallet: TipsWallet) {}

  public signTransaction(
    signer: Address,
    destination: Address,
    value: Web3.AnyNumber,
    nonce: Web3.AnyNumber,
    data: string
  ): Signature {
    const tx = [
      '0x',
      toHex(this.prefix, 2),
      toHex(this.version, 2),
      stripHex(this.wallet.address),
      stripHex(destination),
      toHex(value, 64),
      stripHex(data),
      toHex(nonce, 64)
    ].join('');

    const hash = this.web3.sha3(tx, { encoding: 'hex' });
    const sig = stripHex(this.web3.eth.sign(signer, hash));

    return {
      r: `0x${sig.substr(0, 64)}`,
      s: `0x${sig.substr(64, 64)}`,
      v: this.web3.toDecimal(sig.substr(128, 2)) + 27
    };
  }

  public signEtherTransfer(
    signer: Address,
    destination: Address,
    value: Web3.AnyNumber,
    nonce: Web3.AnyNumber
  ): Signature {
    return this.signTransaction(signer, destination, value, nonce, '0x');
  }

  public async signERC20Transfer(
    token: ERC20,
    signer: Address,
    destination: Address,
    amount: Web3.AnyNumber,
    nonce: Web3.AnyNumber
  ): Promise<Signature> {
    const data = await getData(token.transfer, destination, amount);
    return this.signTransaction(signer, token.address, 0, nonce, data);
  }

  public async executeTransaction(
    signatures: Signature[],
    destination: Address,
    value: Web3.AnyNumber,
    data: string
  ): Promise<TransactionResult> {
    const v = signatures.map(sig => sig.v);
    const r = signatures.map(sig => sig.r);
    const s = signatures.map(sig => sig.s);

    return this.wallet.execute(v, r, s, destination, value, data);
  }

  public async executeEtherTransfer(
    signatures: Signature[],
    destination: Address,
    value: Web3.AnyNumber
  ): Promise<TransactionResult> {
    return this.executeTransaction(signatures, destination, value, '0x');
  }

  public async executeERC20Transfer(
    signatures: Signature[],
    token: ERC20,
    destination: Address,
    amount: Web3.AnyNumber
  ): Promise<TransactionResult> {
    const data = await getData(token.transfer, destination, amount);
    return this.executeTransaction(signatures, token.address, 0, data);
  }
}

async function getData(func: any, ...args: any[]): Promise<string> {
  const method = (func as any) as Method;
  const request = await method.request(...args);
  const [param] = request.params;
  return param.data;
}

function stripHex(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

function toHex(num: Web3.AnyNumber, len: number): string {
  const hex = new BigNumber(num).toString(16);
  const padLen = len - hex.length + 1;
  const padStr = new Array(padLen).join('0');
  return hex.length < len ? padStr.concat(hex) : hex;
}

export interface Signature {
  v: number;
  r: string;
  s: string;
}
