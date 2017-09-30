const Migrations = artifacts.require('./Migrations.sol');

async function deploy(deployer: Deployer): Promise<void> {
  await deployer.deploy(Migrations);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
