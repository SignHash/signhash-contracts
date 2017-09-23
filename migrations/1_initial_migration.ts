const Migrations = artifacts.require('./Migrations.sol');

async function deploy(deployer): Promise<void> {
  await deployer.deploy(Migrations);
}

function migrate(deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
