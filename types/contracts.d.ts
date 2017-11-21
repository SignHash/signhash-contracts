declare interface SignHash {
  sign(hash: string, options?: TransactionOptions): Promise<TransactionResult>;
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

  getSigners(hash: string, maxCount: number): Promise<string[]>;

  getProof(signer: string, method: string): Promise<string>;
}

declare interface Signed {
  hash: string;
  signer: string;
}

declare interface Revoked {
  hash: string;
  signer: string;
}

declare interface ProofAdded {
  signer: string;
  method: string;
  value: string;
}

declare interface ProofRemoved {
  signer: string;
  method: string;
}

declare interface Migrations {
  setCompleted(
    completed: number,
    options?: TransactionOptions
  ): Promise<TransactionResult>;

  upgrade(
    address: string,
    options?: TransactionOptions
  ): Promise<TransactionResult>;
}

declare interface MigrationsContract extends Contract<Migrations> {
  'new'(options?: TransactionOptions): Promise<Migrations>;
}

declare interface AddressSetLibrary extends ContractBase {
  'new'(options?: TransactionOptions): Promise<ContractBase>;
}

declare interface SignHashContract extends Contract<SignHash> {
  'new'(options?: TransactionOptions): Promise<SignHash>;
}

declare interface SignHashArtifacts extends TruffleArtifacts {
  require(name: './Migrations.sol'): MigrationsContract;
  require(name: './AddressSet.sol'): AddressSetLibrary;
  require(name: './SignHash.sol'): SignHashContract;
}
