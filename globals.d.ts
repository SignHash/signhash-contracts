declare interface IContract {
  address: string;
  new: (...params: any[]) => Promise<IContractInstance>;
}

declare interface IContractInstance {
  address: string;
}

declare interface ISignHash extends IContractInstance {
  sign: (hash: string) => Promise<void>;
  getSigners: (hash: string) => Promise<string[]>;
}

declare interface IArtifacts {
  require: (path: string) => IContract;
}

declare interface IDeployer extends Promise<void> {
  deploy: (contract: IContract) => void;
}

interface IContractContextDefinition extends Mocha.IContextDefinition {
  (description: string, callback: (accounts: string[]) => void): Mocha.ISuite;
}

declare var artifacts: IArtifacts;
declare var contract: IContractContextDefinition;
declare var assert: Chai.Assert;
