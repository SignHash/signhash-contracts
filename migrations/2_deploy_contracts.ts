import { SignHashArtifacts } from 'signhash';
import { Deployer } from 'truffle';

declare const artifacts: SignHashArtifacts;

const TipsWallet = artifacts.require('./TipsWallet.sol');
const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: Deployer) {
  await deployer.deploy(TipsWallet, [
    '0x627306090abab3a6e1400e9345bc60c78a8bef57'
  ]);
  await deployer.deploy(SignHash);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
