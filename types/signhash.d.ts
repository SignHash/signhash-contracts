declare module 'signhash' {
  import {
    Contract,
    ContractBase,
    TransactionOptions,
    TransactionResult,
    TruffleArtifacts
  } from 'truffle';
  import { BigNumber } from 'bignumber.js';

  namespace signhash {
    interface SignHash extends ContractBase {
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

      getSigners(hash: string, maxCount: number): Promise<Address[]>;

      getProof(signer: Address, method: string): Promise<string>;
    }

    interface SignedEvent {
      hash: string;
      signer: Address;
    }

    interface RevokedEvent {
      hash: string;
      signer: Address;
    }

    interface ProofAddedEvent {
      signer: Address;
      method: string;
      value: string;
    }

    interface ProofRemovedEvent {
      signer: Address;
      method: string;
    }

    interface Migrations extends ContractBase {
      setCompleted(
        completed: number,
        options?: TransactionOptions
      ): Promise<TransactionResult>;

      upgrade(
        address: Address,
        options?: TransactionOptions
      ): Promise<TransactionResult>;
    }

    interface TipsWallet extends ContractBase {
      getOwners(): Promise<Address[]>;
    }

    interface DepositEvent {
      from: Address;
      value: BigNumber;
    }

    interface MigrationsContract extends Contract<Migrations> {
      'new'(options?: TransactionOptions): Promise<Migrations>;
    }

    interface AddressSetLibrary extends ContractBase {
      'new'(options?: TransactionOptions): Promise<ContractBase>;
    }

    interface SignHashContract extends Contract<SignHash> {
      'new'(options?: TransactionOptions): Promise<SignHash>;
    }

    interface TipsWalletContract extends Contract<TipsWallet> {
      'new'(
        owners: Address[],
        options?: TransactionOptions
      ): Promise<TipsWallet>;
    }

    interface SignHashArtifacts extends TruffleArtifacts {
      require(name: './Migrations.sol'): MigrationsContract;
      require(name: './AddressSet.sol'): AddressSetLibrary;
      require(name: './SignHash.sol'): SignHashContract;
      require(name: './TipsWallet.sol'): TipsWalletContract;
    }
  }

  export = signhash;
}
