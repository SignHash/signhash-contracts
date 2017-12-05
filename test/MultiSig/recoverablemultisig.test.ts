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

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const waitUntilBlock = tempo(web3).waitUntilBlock;

const RecoverableMultiSigContract = artifacts.require(
  './MultiSig/RecoverableMultiSig.sol'
);

contract('RecoverableMultiSigContract', accounts => {
  const owners = accounts.slice(1, 3);
  const newOwners = accounts.slice(6, 9);
  const nonOwner = accounts[0];

  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await RecoverableMultiSigContract.new([]);
      });
    });
  });

  context(`When wallet has ${owners.length} owners`, () => {
    const recoveryConfirmations = 100;

    let instance: RecoverableMultiSig;

    beforeEach(async () => {
      instance = await RecoverableMultiSigContract.new(
        owners,
        recoveryConfirmations
      );
    });

    describe('#ctor', () => {
      it('should set owners', async () => {
        assert.deepEqual(await instance.listOwners(), owners);
      });
    });

    function hashAddresses(addresses: Address[]): string {
      const str = addresses.reduce(
        (acc, owner) => acc.concat(toHex(owner, 64)),
        ''
      );
      return web3.sha3(str, { encoding: 'hex' });
    }

    describe('#startRecovery', () => {
      context(`When called by non-owner`, () => {
        it('should throw invalid opcode', async () => {
          await assertThrowsInvalidOpcode(async () => {
            await instance.startRecovery(newOwners, { from: nonOwner });
          });
        });
      });

      owners.map((owner, index) => {
        context(`When called by #${index + 1} owner`, () => {
          it('should set recoveryHash for a single account', async () => {
            const singleOwner = [newOwners[0]];
            await instance.startRecovery(singleOwner, { from: owner });

            assert.equal(
              await instance.recoveryHash(),
              hashAddresses(singleOwner)
            );
          });

          it('should set recoveryHash for multiple accounts', async () => {
            await instance.startRecovery(newOwners, { from: owner });

            assert.equal(
              await instance.recoveryHash(),
              hashAddresses(newOwners)
            );
          });

          it('should set recoveryBlock to current block', async () => {
            await instance.startRecovery(newOwners, { from: owner });

            assertNumberEqual(
              await instance.recoveryBlock(),
              web3.eth.blockNumber
            );
          });

          it('should emit RecoveryStarted event', async () => {
            const trans = await instance.startRecovery(newOwners, {
              from: owner
            });

            const log = findLastLog(trans, 'RecoveryStarted');
            const event: RecoveryStartedEvent = log.args;

            assert.equal(event.from, owner);
            assert.deepEqual(event.newOwners, newOwners);
          });
        });
      });
    });

    describe('#cancelRecovery', () => {
      it('should fail when called when recovery not started', async () => {
        await assertThrowsInvalidOpcode(async () => {
          await instance.cancelRecovery({ from: owners[0] });
        });
      });

      context('When recovery started', () => {
        beforeEach(async () => {
          await instance.startRecovery(newOwners, { from: owners[0] });
        });

        context(`When called by non-owner`, () => {
          it('should throw invalid opcode', async () => {
            await assertThrowsInvalidOpcode(async () => {
              await instance.cancelRecovery({ from: nonOwner });
            });
          });
        });

        owners.map((owner, index) => {
          context(`When called by #${index + 1} owner`, () => {
            it('should reset recoveryHash', async () => {
              await instance.cancelRecovery({ from: owner });

              assert.equal(
                await instance.recoveryHash(),
                `0x${'0'.repeat(64)}`
              );
            });

            it('should reset recoveryBlock', async () => {
              await instance.cancelRecovery({ from: owner });

              assertNumberEqual(await instance.recoveryBlock(), 0);
            });

            it('should emit RecoveryCancelled event', async () => {
              const trans = await instance.cancelRecovery({
                from: owner
              });

              const log = findLastLog(trans, 'RecoveryCancelled');
              const event: RecoveryCancelledEvent = log.args;

              assert.equal(event.from, owner);
            });
          });
        });
      });
    });

    describe('#confirmRecovery', () => {
      it('should fail when called when recovery not started', async () => {
        await assertThrowsInvalidOpcode(async () => {
          await instance.cancelRecovery({ from: owners[0] });
        });
      });

      context('When recovery started', () => {
        beforeEach(async () => {
          await instance.startRecovery(newOwners, { from: owners[0] });
        });

        it('should fail when recovery not passed', async () => {
          await assertThrowsInvalidOpcode(async () => {
            await instance.confirmRecovery(newOwners, { from: owners[0] });
          });
        });

        context('When recovery passed', () => {
          beforeEach(async () => {
            const targetBlock = (await instance.recoveryBlock()).add(
              await instance.recoveryConfirmations()
            );

            await waitUntilBlock(100, targetBlock.toNumber());
          });

          context(`When called by non-owner`, () => {
            it('should throw invalid opcode', async () => {
              await assertThrowsInvalidOpcode(async () => {
                await instance.confirmRecovery(newOwners, { from: nonOwner });
              });
            });
          });

          owners.map((owner, index) => {
            context(`When called by #${index + 1} owner`, () => {
              it('should change owners', async () => {
                await instance.confirmRecovery(newOwners, { from: owner });

                assert.deepEqual(await instance.listOwners(), newOwners);
              });

              it('should reset recoveryHash', async () => {
                await instance.confirmRecovery(newOwners, { from: owner });

                assert.equal(
                  await instance.recoveryHash(),
                  `0x${'0'.repeat(64)}`
                );
              });

              it('should reset recoveryBlock', async () => {
                await instance.confirmRecovery(newOwners, { from: owner });

                assertNumberEqual(await instance.recoveryBlock(), 0);
              });

              it('should emit RecoveryConfirmed event', async () => {
                const trans = await instance.confirmRecovery(newOwners, {
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
    });
  });
});
