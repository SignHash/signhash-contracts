#!/usr/bin/env node

import { join } from 'path';

import * as Web3 from 'web3';
import * as Config from 'truffle-config';
import * as TestRPC from 'ethereumjs-testrpc';
import * as Migrate from 'truffle-migrate';
import * as Resolver from 'truffle-resolver';
import * as Artifactor from 'truffle-artifactor';
import * as Compile from 'truffle-compile';
import * as mkdirp from 'mkdirp';

(async function() {
  const config = configure();

  await compileContracts(config);
  const state = await startTestRPC(config.port);
  const deployer = Object.keys(state.accounts)[0];

  await setupNetwork(config, deployer);
  await migrate(config);
})().catch(console.error);

function configure(): Config {
  const projectDir = join(__dirname, '..');

  const config = Config.detect({
    contracts_build_directory: join(projectDir, 'build', 'contracts'),
    contracts_directory: join(projectDir, 'contracts'),
    logger: console,
    migrations_directory: join(projectDir, 'migrations'),
    network: 'testrpc',
    port: 8545,
    reset: true,
    working_directory: projectDir
  });

  config.resolver = new Resolver(config);
  config.artifactor = new Artifactor(config.contracts_build_directory);

  return config;
}

async function compileContracts(config: Config) {
  logStep(`Compiling contracts: ${config.contracts_directory}`);

  const contracts = await promisify<Compile.ContractDefinitions>(cb =>
    Compile.all(config, cb)
  );

  await promisify<any>(cb => mkdirp(config.contracts_build_directory, cb));
  await config.artifactor.saveAll(contracts);

  console.log(`Saved to: ${config.contracts_build_directory}`);
}

async function startTestRPC(port: number): Promise<TestRPC.State> {
  logStep(`Starting TestRPC on port ${port}`);

  const options = {
    secure: false,
    mnemonic:
      'try exile adapt shed width laugh similar duty neglect kick rug require',
    logger: console
  };

  const server = TestRPC.server(options);
  const state = await promisify<TestRPC.State>(cb => server.listen(port, cb));

  console.log(`Account mnemonic: ${options.mnemonic}`);

  return state;
}

async function setupNetwork(config: Config, deployer: Address) {
  logStep(`Setting up network ${config.network}`);

  const web3 = new Web3(config.provider);
  const networkId = await promisify<string>(cb => web3.version.getNetwork(cb));

  const networkConfig = config.networks[config.network];
  networkConfig.network_id = networkId;
  networkConfig.from = deployer;

  console.log(`Using network: ${config.network} (${networkId})`);
  console.log(`Using deployer: ${deployer}`);
}

async function migrate(config: Config) {
  logStep(`Running migrations: ${config.migrations_directory}`);

  await promisify<void>(cb => Migrate.run(config, cb));

  logStep('Migrations completed');
}

function promisify<T>(fn: (cb: Callback<T>) => void) {
  return new Promise<T>((resolve, reject) =>
    fn((err: Error | null, res: T) => {
      if (err) {
        return reject(err);
      }

      return resolve(res);
    })
  );
}

function logStep(description: string) {
  console.log();
  console.log(Array(79).join('-'));
  console.log(description);
  console.log(Array(79).join('-'));
}
