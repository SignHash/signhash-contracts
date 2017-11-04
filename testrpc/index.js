const Web3 = require('web3');
const TestRPC = require('ethereumjs-testrpc');
const buildContract = require('truffle-contract');
const path = require('path');
const argv = require('yargs')
      .option('deploy')
      .argv;

const DEPLOY = !!argv.deploy;
const RPC_PORT = 8545;
const ABI_DIR = path.join(__dirname, '../build/contracts');

const MNEMONIC =
      'try exile adapt shed width laugh similar duty neglect kick rug require';


async function run() {
  const provider = new Web3.providers.HttpProvider(
    'http://localhost:' + RPC_PORT
  );
  const web3 = new Web3(provider);
  const server = TestRPC.server({
    mnemonic: MNEMONIC,
    secure: false,
    logger: console,
    gasLimit: 10e8,
  });

  server.listen(RPC_PORT, async (listenErr, state) => {
    if (listenErr) {
      console.error(
        `Failed to start TestRPC server on port ${RPC_PORT}: `,
        listenErr
      );
      return;
    }

    web3.settings.defaultAccount = Object.keys(state.accounts)[0];
    web3.eth.defaultAccount = Object.keys(state.accounts)[0];
    console.log(`TestRPC server started on port ${RPC_PORT}`);

    if (DEPLOY) {
      await deploy(provider);
      console.log('Migrations completed');
    }

    console.log('TestRPC is Ready');
  });
}


async function deploy(provider) {
  const signHashContract = getContract(provider, 'SignHash');
  await signHashContract.new({ gas: 10e6 });
}


function getContract(provider, contractName) {
  const abi = require(path.join(ABI_DIR, contractName + '.json'));
  const contract = buildContract(abi);
  contract.setProvider(provider);
  return contract;
}


run();
