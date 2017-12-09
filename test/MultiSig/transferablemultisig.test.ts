import { assert } from 'chai';

import * as Web3 from 'web3';

import { SignHashArtifacts, TransferableMultiSig } from 'signhash';
import { ContractContextDefinition } from 'truffle';

import { TransferOwnershipCommand } from '../../multisig';

import { assertThrowsInvalidOpcode } from '../helpers';
import { MultiSigTestContext } from './context';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const TransferableMultiSigContract = artifacts.require(
  './MultiSig/TransferableMultiSig.sol'
);

contract('TransferableMultiSigContract', accounts => {
  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TransferableMultiSigContract.new([]);
      });
    });
  });

  const ownerSets = [[accounts[2]], accounts.slice(1, 3), accounts.slice(2, 6)];
  ownerSets.map(owners => {
    context(`When wallet has ${owners.length} owners`, () => {
      const ctx = new MultiSigTestContext<TransferableMultiSig>(
        accounts,
        owners
      );

      beforeEach(async () => {
        ctx.multisig = await TransferableMultiSigContract.new(owners);
      });

      describe('#transferOwnership', () => testTransferOwnership(ctx));
    });
  });
});

export function testTransferOwnership(
  ctx: MultiSigTestContext<TransferableMultiSig>
) {
  const newOwners = ctx.accounts.slice(6, 9);

  let transferOwnershipCommand: TransferOwnershipCommand;

  async function transferOwnership(owners: Address[]) {
    const nonce = await ctx.multisig.nonce();

    const signatures = await Promise.all(
      ctx.owners.map(signer =>
        transferOwnershipCommand.sign(signer, nonce, owners)
      )
    );

    return await transferOwnershipCommand.execute(signatures, owners);
  }

  beforeEach(async () => {
    transferOwnershipCommand = new TransferOwnershipCommand(web3, ctx.multisig);

    // preconditions
    assert.deepEqual(ctx.owners, await ctx.multisig.listOwners());
    assert.notDeepEqual(newOwners, ctx.owners);
  });

  it('should set a single owner', async () => {
    const singleOwner = [ctx.accounts[6]];
    await transferOwnership(singleOwner);

    assert.deepEqual(await ctx.multisig.listOwners(), singleOwner);
  });

  it('should set several owners', async () => {
    await transferOwnership(newOwners);

    assert.deepEqual(await ctx.multisig.listOwners(), newOwners);
  });

  it('should not allow empty list of owners', async () => {
    await assertThrowsInvalidOpcode(async () => {
      await transferOwnership([]);
    });
  });

  it('should throw when not signed', async () => {
    await assertThrowsInvalidOpcode(async () => {
      await transferOwnershipCommand.execute([], newOwners);
    });
  });

  if (ctx.owners.length > 1) {
    ctx.owners.map(async (owner, index) =>
      it(`should throw when signed only by #${index + 1}`, async () => {
        const nonce = await ctx.multisig.nonce();
        const signature = await transferOwnershipCommand.sign(
          owner,
          nonce,
          newOwners
        );

        await assertThrowsInvalidOpcode(async () => {
          await transferOwnershipCommand.execute([signature], newOwners);
        });
      })
    );
  }

  it('should throw when signed by other accounts', async () => {
    const strangers = ctx.accounts.slice(4, 4 + ctx.owners.length);
    const nonce = await ctx.multisig.nonce();
    const signatures = await Promise.all(
      strangers.map(owner =>
        transferOwnershipCommand.sign(owner, nonce, newOwners)
      )
    );

    await assertThrowsInvalidOpcode(async () => {
      await transferOwnershipCommand.execute(signatures, newOwners);
    });
  });

  if (ctx.owners.length > 1) {
    it('should throw when signed by owners in wrong order', async () => {
      const reversed = ctx.owners.reverse();
      const nonce = await ctx.multisig.nonce();
      const signatures = await Promise.all(
        reversed.map(owner =>
          transferOwnershipCommand.sign(owner, nonce, newOwners)
        )
      );

      await assertThrowsInvalidOpcode(async () => {
        await transferOwnershipCommand.execute(signatures, newOwners);
      });
    });
  }

  it('should throw on nonce reuse', async () => {
    const nonce = await ctx.multisig.nonce();
    const tx1Owners = ctx.accounts.slice(6, 10);
    const tx2Owners = ctx.accounts.slice(5, 8);

    const tx1Signatures = ctx.owners.map(owner =>
      transferOwnershipCommand.sign(owner, nonce, tx1Owners)
    );

    const tx2Signatures = ctx.owners.map(owner =>
      transferOwnershipCommand.sign(
        owner,
        nonce, // NOTICE: the same nonce as previously
        tx2Owners
      )
    );

    await transferOwnershipCommand.execute(tx1Signatures, tx1Owners);

    await assertThrowsInvalidOpcode(async () => {
      await transferOwnershipCommand.execute(tx2Signatures, tx2Owners);
    });
  });
}
