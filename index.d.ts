declare module 'signhash' {
  import { BigNumber } from 'bignumber.js';

  import {
    Artifacts,
    Contract,
    DeployedContractBase,
    TransactionOptions,
    TransactionResult
  } from 'truffle';

  import { Address } from 'web3';

  interface MigrationsContract extends Contract<Migrations> {
    'new'(options?: TransactionOptions): Promise<Migrations>;
  }

  interface AddressSetLibrary extends Contract<AddressSet> {
    'new'(options?: TransactionOptions): Promise<AddressSet>;
  }

  interface SignHashContract extends Contract<SignHash> {
    'new'(options?: TransactionOptions): Promise<SignHash>;
  }

  interface TipsWalletContract extends Contract<SignHash> {
    'new'(
      developers: Address[],
      options?: TransactionOptions
    ): Promise<TipsWallet>;
  }

  interface SignHash extends DeployedContractBase {
    sign(
      hash: string,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    revoke(
      hash: string,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    addProof(
      method: string,
      value: string,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    removeProof(
      method: string,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    getSigners(
      hash: string,
      maxCount: number | string | BigNumber
    ): Promise<Address[]>;

    getProof(signer: Address, method: string): Promise<string>;
  }

  interface Signed {
    hash: string;
    signer: Address;
  }

  interface Revoked {
    hash: string;
    signer: Address;
  }

  interface ProofAdded {
    signer: Address;
    method: string;
    value: string;
  }

  interface ProofRemoved {
    signer: Address;
    method: string;
  }

  interface TipsWallet extends DeployedContractBase {
    getOwners(): Promise<Address[]>;

    getUnsettledBalance(): Promise<BigNumber>;

    settledShares(account: Address): Promise<BigNumber>;

    settle(options?: TransactionOptions): Promise<void>;

    withdraw(
      value: number | string | BigNumber,
      options?: TransactionOptions
    ): Promise<void>;
  }

  interface Migrations extends DeployedContractBase {
    setCompleted(
      completed: number | string | BigNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    upgrade(
      address: Address,
      options?: TransactionOptions
    ): Promise<TransactionResult>;
  }

  interface AddressSet {
    get(): Promise<Address[]>;

    add(
      element: Address,
      options?: TransactionOptions
    ): Promise<TransactionResult>;
  }

  interface SignHashArtifacts extends Artifacts {
    require(name: './Migrations.sol'): MigrationsContract;
    require(name: './AddressSet.sol'): AddressSetLibrary;
    require(name: './SignHash.sol'): SignHashContract;
    require(name: './TipsWallet.sol'): TipsWalletContract;
  }
}
