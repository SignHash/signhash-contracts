declare module 'truffle' {
  import { BigNumber } from 'bignumber.js';
  import { Address } from 'web3';

  interface ContractBase {
    address: Address;
  }

  interface DeployedContractBase extends ContractBase {
    balance(): Promise<BigNumber>;
  }

  interface Contract<T> extends ContractBase {
    deployed(): Promise<T>;
  }

  interface Artifacts {
    require(name: string): ContractBase;
  }

  interface Deployer extends Promise<void> {
    deploy(object: ContractBase): Promise<void>;

    link(
      library: ContractBase,
      contracts: ContractBase | [ContractBase]
    ): Promise<void>;
  }

  interface ContractContextDefinition extends Mocha.IContextDefinition {
    (
      description: string,
      callback: (accounts: Address[]) => void
    ): Mocha.ISuite;
  }
  type TransactionOptions = {
    from?: Address;
    gas?: number | string | BigNumber;
    gasPrice?: number | string | BigNumber;
  };

  type TransactionReceipt = {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    gasUsed: number;
    cumulativeGasUsed: number;
    contractAddress?: Address;
    logs: [TransactionLog];
  };

  type TransactionLog = {
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    address: Address;
    type: string;
    event: string;
    args: any;
  };

  type TransactionResult = {
    tx: string;
    receipt: TransactionReceipt;
    logs: [TransactionLog];
  };
}
