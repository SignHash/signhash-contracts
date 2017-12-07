import { MultiSig } from 'signhash';

export class MultiSigTestContext<T extends MultiSig> {
  public instance: T;

  public constructor(public accounts: Address[], public owners: Address[]) {}
}
