import * as Web3 from 'web3';

declare global {
  const web3: Web3;
  const artifacts: SignHashArtifacts;
  const assert: Chai.AssertStatic;
  const contract: ContractContextDefinition;
}
