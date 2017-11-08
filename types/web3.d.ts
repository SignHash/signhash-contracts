type Callback<T> = (err: Error | null, value: T) => void;
type VoidCallback = (err: Error | null) => void;

type Address = string;

declare module 'web3' {
  import { BigNumber } from 'bignumber.js';

  type AnyNumber = number | string | BigNumber;

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
    value?: AnyNumber;
    gas?: AnyNumber;
    gasPrice?: AnyNumber;
    data?: string;
    nonce?: AnyNumber;
  }

  class Web3 {
    public constructor(provider: Web3.Provider);

    public toWei(amount: AnyNumber, unit: Unit): string;
    public sha3(str: string, options?: { encoding: 'hex' }): string;

    public eth: {
      sendTransaction(txData: TxData, callback: Callback<string>): void;
      getBalance(account: Address, callback: Callback<BigNumber>): BigNumber;
    };

    public version: {
      getNetwork(cb: Callback<string>): void;
    };
  }

  namespace Web3 {
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
  }

  export = Web3;
}
