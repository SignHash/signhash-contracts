declare module '@digix/tempo' {
  import * as Web3 from 'web3';

  interface Tempo {
    waitUntilBlock(seconds: number, targetBlock: number): Promise<void>;

    wait(seconds?: number, blocks?: number): Promise<void>;
  }

  function build(web3: Web3): Tempo;

  namespace build {

  }
  export = build;
}
