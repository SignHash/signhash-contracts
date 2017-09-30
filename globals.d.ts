declare interface Contract<T> {
  address: string;
  deployed(): Promise<T>;
}

declare interface MigrationsContract extends Contract<Migrations> {
  'new'(): Promise<Migrations>;
}

declare interface SignHashContract extends Contract<SignHash> {
  'new'(): Promise<SignHash>;
}

declare interface SignHash {
  sign(hash: string): Promise<void>;
  getSigners(hash: string): Promise<string[]>;
}

declare interface Migrations {
  setCompleted(completed: number): Promise<void>;
  upgrade(address: string): Promise<void>;
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

declare var artifacts: Artifacts;
declare var contract: ContractContextDefinition;
declare var assert: Chai.Assert;
