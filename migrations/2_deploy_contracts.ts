import { SignHashArtifacts, SignHashDeployer } from 'signhash';

declare const artifacts: SignHashArtifacts;

const TipsWallet = artifacts.require('./TipsWallet.sol');
const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: SignHashDeployer) {
  // TODO: change wallet parameters before mainnet deployment
  const owners = ['0x4c7989d46daDb29ee494E6c1b87f60de0c1c9372'];
  const recoveryBlockOffset = 5 * 1e5;
  await deployer.deploy(TipsWallet, owners, recoveryBlockOffset);

  await deployer.deploy(SignHash);
}

function migrate(deployer: SignHashDeployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
