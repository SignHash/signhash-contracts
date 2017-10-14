declare interface Web3 {
  toAscii(hex: string): string;
  fromAscii(ascii: string, padding?: number): string;
  sha3(str: string, options?: { encoding: 'hex' }): string;
}

declare interface Contract<T> {
  address: string;
  deployed(): Promise<T>;
}

declare interface Library {}

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
  'new'(options?: TransactionOptions): Promise<Migrations>;
}

declare interface SignHashContract extends Contract<SignHash> {
  'new'(options?: TransactionOptions): Promise<SignHash>;
}

declare interface SignHash {
  sign(hash: string, options?: TransactionOptions): Promise<TransactionResult>;

  addProof(
    method: string,
    value: string,
    options?: TransactionOptions
  ): Promise<TransactionResult>;

  removeProof(
    method: string,
    options?: TransactionOptions
  ): Promise<TransactionResult>;

  getSigners(hash: string): Promise<string[]>;

  getProof(signer: string, method: string): Promise<string>;
}

declare interface Signed {
  hash: string;
  signer: string;
}

declare interface ProofAdded {
  signer: string;
  method: string;
  value: string;
}

declare interface ProofRemoved {
  signer: string;
  method: string;
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
  require(name: './AddressSet.sol'): Library;
  require(name: './SignHash.sol'): SignHashContract;
}

declare interface Deployer extends Promise<void> {
  deploy<T>(object: Contract<T> | Library): Promise<void>;
  link(
    library: Library,
    contracts: Contract<any> | [Contract<any>]
  ): Promise<void>;
}

interface ContractContextDefinition extends Mocha.IContextDefinition {
  (description: string, callback: (accounts: string[]) => void): Mocha.ISuite;
}

declare const artifacts: Artifacts;
declare const contract: ContractContextDefinition;
declare const assert: Chai.Assert;
declare const web3: Web3;
