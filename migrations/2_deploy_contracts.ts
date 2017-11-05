import { Deployer } from 'truffle';

const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: Deployer): Promise<void> {
  await deployer.deploy(SignHash);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
