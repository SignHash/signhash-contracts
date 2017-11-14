"use strict";
const SignHash = artifacts.require('./SignHash.sol');
async function deploy(deployer) {
    await deployer.deploy(SignHash);
}
function migrate(deployer) {
    deployer.then(() => deploy(deployer));
}
module.exports = migrate;
//# sourceMappingURL=2_deploy_contracts.js.map