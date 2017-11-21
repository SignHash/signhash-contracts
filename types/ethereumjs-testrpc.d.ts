declare module 'ethereumjs-testrpc' {
  type State = {
    accounts: string[];
  };

  interface Server {
    listen(port: number, cb: (err: Error, state: State) => void): void;
  }

  type Options = {
    logger?: { log: (...args: any[]) => void };
    mnemonic?: string;
    secure?: boolean;
  };

  function server(options?: Options): Server;
}
