declare interface Web3 {
  toAscii(hex: string): string;
  fromAscii(ascii: string, padding?: number): string;
}

declare interface Contract<T> {
  address: string;
  deployed(): Promise<T>;
}

declare type TransactionOptions = {
  from?: string;
  gas?: number;
  gasPrice?: number;
};

declare type TransactionReceipt = {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  gasUsed: number;
  cumulativeGasUsed: number;
  contractAddress: string | null;
  logs: [TransactionLog];
};

declare type TransactionLog = {
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  address: string;
  type: string;
  event: string;
  args: any;
};

declare type TransactionResult = {
  tx: string;
  receipt: TransactionReceipt;
  logs: [TransactionLog];
};

declare interface MigrationsContract extends Contract<Migrations> {
  'new'(): Promise<Migrations>;
}

declare interface SignHashContract extends Contract<SignHash> {
  'new'(): Promise<SignHash>;
}

declare interface SignHash {
  sign(hash: string, options?: TransactionOptions): Promise<TransactionResult>;

  prove(
    method: string,
    value: string,
    options?: TransactionOptions
  ): Promise<TransactionResult>;

  getSigners(hash: string): Promise<string[]>;

  getProof(signer: string, method: string): Promise<string>;
}

declare interface HashSigned {
  hash: string;
  signer: string;
}

declare interface SignerProved {
  signer: string;
  method: string;
  value: string;
}

declare interface Migrations {
  setCompleted(
    completed: number,
    options?: TransactionOptions
  ): Promise<TransactionResult>;

  upgrade(
    address: string,
    options?: TransactionOptions
  ): Promise<TransactionResult>;
}

declare interface Artifacts {
  require(name: './Migrations.sol'): MigrationsContract;
  require(name: './SignHash.sol'): SignHashContract;
}

declare interface Deployer extends Promise<void> {
  deploy<T>(contract: Contract<T>): void;
}

interface ContractContextDefinition extends Mocha.IContextDefinition {
  (description: string, callback: (accounts: string[]) => void): Mocha.ISuite;
}

declare const artifacts: Artifacts;
declare const contract: ContractContextDefinition;
declare const assert: Chai.Assert;
declare const web3: Web3;
