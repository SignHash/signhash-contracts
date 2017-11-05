declare module 'web3' {
  import { BigNumber } from 'bignumber.js';

  type Callback<T> = (err: Error | null, value: T) => void;

  type Address = string;

  type Unit =
    | 'kwei'
    | 'ada'
    | 'mwei'
    | 'babbage'
    | 'gwei'
    | 'shannon'
    | 'szabo'
    | 'finney'
    | 'ether'
    | 'kether'
    | 'grand'
    | 'einstein'
    | 'mether'
    | 'gether'
    | 'tether';

  interface TxData {
    from: Address;
    to?: Address;
    value?: number | string | BigNumber;
    gas?: number | string | BigNumber;
    gasPrice?: number | string | BigNumber;
    data?: string;
    nonce?: number | string | BigNumber;
  }

  interface Web3 {
    toWei(amount: number | string, unit: Unit): string;
    toAscii(hex: string): string;
    fromAscii(ascii: string, padding?: number): string;
    sha3(str: string, options?: { encoding: 'hex' }): string;

    eth: {
      sendTransaction(txData: TxData, callback: Callback<string>): void;

      getBalance(account: Address, callback: Callback<BigNumber>): BigNumber;
    };
  }
}
