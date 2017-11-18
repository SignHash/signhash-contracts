#!/usr/bin/env node

import { join } from 'path';
import { ConsoleTransportOptions, Logger, transports } from 'winston';

import { promisify } from '../utils';

import * as TestRPC from 'ethereumjs-testrpc';
import * as mkdirp from 'mkdirp';
import * as Artifactor from 'truffle-artifactor';
import * as Compile from 'truffle-compile';
import * as Config from 'truffle-config';
import * as Migrate from 'truffle-migrate';
import * as Resolver from 'truffle-resolver';
import * as Web3 from 'web3';

const logger = new Logger({
  colors: {
    error: 'red',
    info: 'blue',
    verbose: 'grey',
    warn: 'yellow'
  },
  transports: [
    new transports.Console({
      colorize: true,
      prettyPrint: true,
      timestamp: true
    })
  ]
});

(async () => {
  const config = configure();

  await compileContracts(config);
  const state = await startTestRPC(config.port);
  const deployer = Object.keys(state.accounts)[0];

  await setupNetwork(config, deployer);
  await migrate(config);
})().catch(err => {
  logger.error(err);
  process.exit(1);
});

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
  logger.info(`Compiling contracts: ${config.contracts_directory}`);

  const contracts = await promisify<Compile.ContractDefinitions>(cb =>
    Compile.all(config, cb)
  );

  await promisify<any>(cb => mkdirp(config.contracts_build_directory, cb));
  await config.artifactor.saveAll(contracts);

  logger.verbose(`Saved to: ${config.contracts_build_directory}`);
}

async function startTestRPC(port: number): Promise<TestRPC.State> {
  logger.info(`Starting TestRPC on port ${port}`);

  const options = {
    logger: console,
    mnemonic:
      'try exile adapt shed width laugh similar duty neglect kick rug require',
    secure: false
  };

  const server = TestRPC.server(options);
  const state = await promisify<TestRPC.State>(cb => server.listen(port, cb));

  logger.verbose(`Account mnemonic: ${options.mnemonic}`);

  return state;
}

async function setupNetwork(config: Config, deployer: Address) {
  logger.info(`Setting up network ${config.network}`);

  const web3 = new Web3(config.provider);
  const networkId = await promisify<string>(cb => web3.version.getNetwork(cb));

  const networkConfig = config.networks[config.network];
  networkConfig.network_id = networkId;
  networkConfig.from = deployer;

  logger.verbose(`Using network: ${config.network} (${networkId})`);
  logger.verbose(`Using deployer: ${deployer}`);
}

async function migrate(config: Config) {
  logger.info(`Running migrations: ${config.migrations_directory}`);

  await promisify<void>(cb => Migrate.run(config, cb));

  logger.info('Migrations completed');
}
