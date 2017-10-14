const AddressSet = artifacts.require('./AddressSet.sol');
const SignHash = artifacts.require('./SignHash.sol');

async function deploy(deployer: Deployer): Promise<void> {
  await deployer.deploy(AddressSet);
  await deployer.link(AddressSet, SignHash);

  await deployer.deploy(SignHash);
}

function migrate(deployer: Deployer) {
  deployer.then(() => deploy(deployer));
}

export = migrate;
