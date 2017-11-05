import { SignHashArtifacts } from 'signhash';
import { ContractContextDefinition } from 'truffle';
import { Web3 } from 'web3';

declare global {
  const artifacts: SignHashArtifacts;
  const web3: Web3;
  const contract: ContractContextDefinition;
  const assert: Chai.Assert;
}
