import { MultiSig } from 'signhash';

export class MultiSigTestContext<T extends MultiSig> {
  public multisig: T;

  public constructor(public accounts: Address[], public owners: Address[]) {}
}
