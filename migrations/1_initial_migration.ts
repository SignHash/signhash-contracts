import { SignHashArtifacts } from 'signhash';
import { Deployer } from 'truffle';

declare const artifacts: SignHashArtifacts;

const Migrations = artifacts.require('./Migrations.sol');

async function deploy(deployer: Deployer) {
  await deployer.deploy(Migrations);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
