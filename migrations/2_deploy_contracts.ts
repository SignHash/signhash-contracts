const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: Deployer) {
  await deployer.deploy(SignHash);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
