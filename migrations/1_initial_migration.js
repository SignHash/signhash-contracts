"use strict";
const Migrations = artifacts.require('./Migrations.sol');
async function deploy(deployer) {
    await deployer.deploy(Migrations);
}
function migrate(deployer) {
    deployer.then(() => deploy(deployer));
}
module.exports = migrate;
//# sourceMappingURL=1_initial_migration.js.map