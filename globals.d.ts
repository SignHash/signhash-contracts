declare interface IContract<T> {
  address: string;
  deployed(): Promise<T>;
}

declare interface IMigrationsContract extends IContract<IMigrations> {
  'new'(): Promise<IMigrations>;
}

declare interface ISignHashContract extends IContract<ISignHash> {
  'new'(): Promise<ISignHash>;
}

declare interface ISignHash {
  sign(hash: string): Promise<void>;
  getSigners(hash: string): Promise<string[]>;
}

declare interface IMigrations {
  setCompleted(completed: number): Promise<void>;
  upgrade(address: string): Promise<void>;
}

declare interface IArtifacts {
  require(name: './Migrations.sol'): IMigrationsContract;
  require(name: './SignHash.sol'): ISignHashContract;
}

declare interface IDeployer extends Promise<void> {
  deploy<T>(contract: IContract<T>): void;
}

interface IContractContextDefinition extends Mocha.IContextDefinition {
  (description: string, callback: (accounts: string[]) => void): Mocha.ISuite;
}

declare var artifacts: IArtifacts;
declare var contract: IContractContextDefinition;
declare var assert: Chai.Assert;
