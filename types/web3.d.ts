declare type Callback<T> = (err: Error | null, value: T) => void;

declare type Address = string;

declare module 'web3' {
  import { BigNumber } from 'bignumber.js';

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

  class Web3 {
    public eth: {
      blockNumber: BigNumber;
      sendTransaction(txData: Web3.TxData, callback: Callback<string>): void;
      getBalance(account: Address, callback: Callback<BigNumber>): BigNumber;
      sign(account: Address, text: string): string;
    };

    public version: {
      getNetwork(cb: Callback<string>): void;
    };

    public constructor(provider: Web3.Provider);

    public toWei(amount: Web3.AnyNumber, unit: Unit): string;
    public sha3(str: string, options?: { encoding: 'hex' }): string;

    public toDecimal(hex: string): number;
    public toHex(num: number): string;
  }

  namespace Web3 {
    type AnyNumber = number | string | BigNumber;

    interface RequestPayload {
      params: any[];
      method: string;
      id: number;
      jsonrpc: string;
    }

    interface ResponsePayload {
      result: any;
      id: number;
      jsonrpc: string;
    }

    interface Provider {
      sendAsync(
        payload: RequestPayload,
        callback: (err: Error | null, result: ResponsePayload) => void
      ): void;
    }

    interface TxData {
      from: Address;
      to?: Address;
      value?: AnyNumber;
      gas?: AnyNumber;
      gasPrice?: AnyNumber;
      data?: string;
      nonce?: AnyNumber;
    }
  }

  export = Web3;
}
