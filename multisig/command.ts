import { BigNumber } from 'bignumber.js';

import * as Web3 from 'web3';

export class MultiSigCommand {
  private readonly prefix = 0x19;
  private readonly version = 0x0;

  constructor(private web3: Web3, private address: Address) {}

  public sign(
    signer: Address,
    nonce: Web3.AnyNumber,
    parameters: any[]
  ): Signature {
    const tx = [
      '0x',
      toHex(this.prefix, 2),
      toHex(this.version, 2),
      stripHex(this.address),
      ...parameters,
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
}

export interface Signature {
  v: number;
  r: string;
  s: string;
}

export function groupSignatures(signatures: Signature[]) {
  return {
    r: signatures.map(sig => sig.r),
    s: signatures.map(sig => sig.s),
    v: signatures.map(sig => sig.v)
  };
}

export function stripHex(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

export function toHex(num: Web3.AnyNumber, len: number): string {
  const hex = new BigNumber(num).toString(16);
  const padLen = len - hex.length + 1;
  const padStr = new Array(padLen).join('0');
  return hex.length < len ? padStr.concat(hex) : hex;
}
