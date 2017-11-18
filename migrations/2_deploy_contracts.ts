import { SignHashArtifacts } from 'signhash';
import { Deployer } from 'truffle';

declare const artifacts: SignHashArtifacts;

const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: Deployer) {
  await deployer.deploy(SignHash);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
