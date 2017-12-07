import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';

import * as tempo from '@digix/tempo';
import * as Web3 from 'web3';

import {
  RecoverableMultiSig,
  RecoveryCancelledEvent,
  RecoveryConfirmedEvent,
  RecoveryStartedEvent,
  SignHashArtifacts
} from 'signhash';
import { ContractContextDefinition } from 'truffle';

import { toHex } from '../../multisig';

import {
  assertNumberEqual,
  assertThrowsInvalidOpcode,
  findLastLog
} from '../helpers';
import { MultiSigTestContext } from './context';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const RecoverableMultiSigContract = artifacts.require(
  './MultiSig/RecoverableMultiSig.sol'
);

contract('RecoverableMultiSigContract', accounts => {
  describe.skip('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await RecoverableMultiSigContract.new([]);
      });
    });
  });

  const ownerSets = [[accounts[2]], accounts.slice(1, 3), accounts.slice(2, 6)];
  ownerSets.map(owners => {
    context.skip(`When wallet has ${owners.length} owners`, () => {
      const ctx = new MultiSigTestContext<RecoverableMultiSig>(
        accounts,
        owners
      );

      beforeEach(async () => {
        const recoveryConfirmations = 100;
        ctx.instance = await RecoverableMultiSigContract.new(
          owners,
          recoveryConfirmations
        );
      });

      describe('#ctor', () => {
        it('should set owners', async () => {
          assert.deepEqual(await ctx.instance.listOwners(), owners);
        });
      });

      describe('#startRecovery', () => testStartRecovery(ctx));
      describe('#cancelRecovery', () => testCancelRecovery(ctx));
      describe('#confirmRecovery', () => testConfirmRecovery(ctx));
    });
  });
});

export function testStartRecovery(
  ctx: MultiSigTestContext<RecoverableMultiSig>
) {
  const nonOwner = ctx.accounts[0];
  const newOwners = ctx.accounts.slice(6, 9);

  // preconditions
  beforeEach(async () => {
    assert.deepEqual(ctx.owners, await ctx.instance.listOwners());
    assert.notInclude(ctx.owners, nonOwner);
    assert.notDeepEqual(newOwners, ctx.owners);
  });

  context(`When called by non-owner`, () => {
    it('should throw invalid opcode', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await ctx.instance.startRecovery(newOwners, { from: nonOwner });
      });
    });
  });

  ctx.owners.map((owner, index) => {
    context(`When called by #${index + 1} owner`, () => {
      it('should set recoveryHash for a single account', async () => {
        const singleOwner = [newOwners[0]];
        await ctx.instance.startRecovery(singleOwner, { from: owner });

        assert.equal(
          await ctx.instance.recoveryHash(),
          hashAddresses(singleOwner)
        );
      });

      it('should set recoveryHash for multiple accounts', async () => {
        await ctx.instance.startRecovery(newOwners, { from: owner });

        assert.equal(
          await ctx.instance.recoveryHash(),
          hashAddresses(newOwners)
        );
      });

      it('should set recoveryBlock to current block', async () => {
        await ctx.instance.startRecovery(newOwners, { from: owner });

        assertNumberEqual(
          await ctx.instance.recoveryBlock(),
          web3.eth.blockNumber
        );
      });

      it('should emit RecoveryStarted event', async () => {
        const trans = await ctx.instance.startRecovery(newOwners, {
          from: owner
        });

        const log = findLastLog(trans, 'RecoveryStarted');
        const event: RecoveryStartedEvent = log.args;

        assert.equal(event.from, owner);
        assert.deepEqual(event.newOwners, newOwners);
      });
    });
  });
}

export function testCancelRecovery(
  ctx: MultiSigTestContext<RecoverableMultiSig>
) {
  const nonOwner = ctx.accounts[0];
  const newOwners = ctx.accounts.slice(6, 9);

  // preconditions
  beforeEach(async () => {
    assert.deepEqual(ctx.owners, await ctx.instance.listOwners());
    assert.notInclude(ctx.owners, nonOwner);
    assert.notDeepEqual(newOwners, ctx.owners);
  });

  context('When recovery not started', () => {
    it('should throw invalid opcode', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await ctx.instance.cancelRecovery({ from: ctx.owners[0] });
      });
    });
  });

  context('When recovery started', () => {
    beforeEach(async () => {
      await ctx.instance.startRecovery(newOwners, { from: ctx.owners[0] });
    });

    context(`When called by non-owner`, () => {
      it('should throw invalid opcode', async () => {
        await assertThrowsInvalidOpcode(async () => {
          await ctx.instance.cancelRecovery({ from: nonOwner });
        });
      });
    });

    ctx.owners.map((owner, index) => {
      context(`When called by #${index + 1} owner`, () => {
        it('should reset recoveryHash', async () => {
          await ctx.instance.cancelRecovery({ from: owner });

          assert.equal(
            await ctx.instance.recoveryHash(),
            `0x${'0'.repeat(64)}`
          );
        });

        it('should reset recoveryBlock', async () => {
          await ctx.instance.cancelRecovery({ from: owner });

          assertNumberEqual(await ctx.instance.recoveryBlock(), 0);
        });

        it('should emit RecoveryCancelled event', async () => {
          const trans = await ctx.instance.cancelRecovery({
            from: owner
          });

          const log = findLastLog(trans, 'RecoveryCancelled');
          const event: RecoveryCancelledEvent = log.args;

          assert.equal(event.from, owner);
        });
      });
    });
  });
}

export function testConfirmRecovery(
  ctx: MultiSigTestContext<RecoverableMultiSig>
) {
  const nonOwner = ctx.accounts[0];
  const newOwners = ctx.accounts.slice(6, 9);

  // preconditions
  beforeEach(async () => {
    assert.deepEqual(ctx.owners, await ctx.instance.listOwners());
    assert.notInclude(ctx.owners, nonOwner);
    assert.notDeepEqual(newOwners, ctx.owners);
  });

  context('When recovery not started', () => {
    it('should throw invalid opcode', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await ctx.instance.cancelRecovery({ from: ctx.owners[0] });
      });
    });
  });

  context('When recovery started', () => {
    const waitUntilBlock = tempo(web3).waitUntilBlock;

    let recoveryPassBlock: BigNumber;

    beforeEach(async () => {
      await ctx.instance.startRecovery(newOwners, { from: ctx.owners[0] });

      recoveryPassBlock = (await ctx.instance.recoveryBlock()).add(
        await ctx.instance.recoveryConfirmations()
      );
    });

    context('When recovery just started', () => {
      it('should throw invalid opcode', async () => {
        await assertThrowsInvalidOpcode(async () => {
          await ctx.instance.confirmRecovery(newOwners, {
            from: ctx.owners[0]
          });
        });
      });
    });

    context('When recovery not passed', () => {
      it('should throw invalid opcode', async () => {
        await waitUntilBlock(100, recoveryPassBlock.div(2).toNumber());

        await assertThrowsInvalidOpcode(async () => {
          await ctx.instance.confirmRecovery(newOwners, {
            from: ctx.owners[0]
          });
        });
      });
    });

    context('When recovery passed', () => {
      beforeEach(async () => {
        await waitUntilBlock(100, recoveryPassBlock.toNumber());
      });

      context(`When called by non-owner`, () => {
        it('should throw invalid opcode', async () => {
          await assertThrowsInvalidOpcode(async () => {
            await ctx.instance.confirmRecovery(newOwners, { from: nonOwner });
          });
        });
      });

      ctx.owners.map((owner, index) => {
        context(`When called by #${index + 1} owner`, () => {
          it('should change owners', async () => {
            await ctx.instance.confirmRecovery(newOwners, { from: owner });

            assert.deepEqual(await ctx.instance.listOwners(), newOwners);
          });

          it('should reset recoveryHash', async () => {
            await ctx.instance.confirmRecovery(newOwners, { from: owner });

            assert.equal(
              await ctx.instance.recoveryHash(),
              `0x${'0'.repeat(64)}`
            );
          });

          it('should reset recoveryBlock', async () => {
            await ctx.instance.confirmRecovery(newOwners, { from: owner });

            assertNumberEqual(await ctx.instance.recoveryBlock(), 0);
          });

          it('should emit RecoveryConfirmed event', async () => {
            const trans = await ctx.instance.confirmRecovery(newOwners, {
              from: owner
            });

            const log = findLastLog(trans, 'RecoveryConfirmed');
            const event: RecoveryConfirmedEvent = log.args;

            assert.equal(event.from, owner);
            assert.deepEqual(event.newOwners, newOwners);
          });
        });
      });
    });
  });
}

function hashAddresses(addresses: Address[]): string {
  const str = addresses.reduce(
    (acc, owner) => acc.concat(toHex(owner, 64)),
    ''
  );
  return web3.sha3(str, { encoding: 'hex' });
}
