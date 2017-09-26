const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: IDeployer): Promise<void> {
  await deployer.deploy(SignHash);
}

function migrate(deployer: IDeployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
