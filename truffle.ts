import * as yargs from 'yargs';

const argv = yargs.option('rpc-host', {
  default: 'localhost'
}).argv;

export = {
  networks: {
    development: {
      host: argv.rpcHost,
      network_id: '*',
      port: 8545
    }
  }
};
