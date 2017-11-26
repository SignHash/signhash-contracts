import { assert } from 'chai';

import * as Web3 from 'web3';

import { SignHashArtifacts, TransferableMultiSig } from 'signhash';
import { ContractContextDefinition } from 'truffle';

import { TransferOwnershipCommand } from '../../multisig';

import { assertThrowsInvalidOpcode } from '../helpers';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const TransferableMultiSigContract = artifacts.require(
  './TipsWallet/TransferableMultiSig.sol'
);

contract('TransferableMultiSigContract', accounts => {
  const deployer = accounts[0];
  const ownerSets = [[accounts[2]], accounts.slice(1, 3), accounts.slice(2, 6)];

  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TransferableMultiSigContract.new([], { from: deployer });
      });
    });
  });

  ownerSets.map(owners => {
    context(`When wallet has ${owners.length} owners`, () => {
      let instance: TransferableMultiSig;

      beforeEach(async () => {
        instance = await TransferableMultiSigContract.new(owners, {
          from: deployer
        });
      });

      describe('#ctor', () => {
        it('should set owners', async () => {
          assert.deepEqual(await instance.listOwners(), owners);
        });
      });

      describe('#transferOwnership', () => {
        let transferOwnershipCommand: TransferOwnershipCommand;

        async function transferOwnership(newOwners: Address[]) {
          const nonce = await instance.nonce();

          const signatures = await Promise.all(
            owners.map(owner =>
              transferOwnershipCommand.sign(owner, nonce, newOwners)
            )
          );

          return await transferOwnershipCommand.execute(signatures, newOwners);
        }

        beforeEach(async () => {
          transferOwnershipCommand = new TransferOwnershipCommand(
            web3,
            instance
          );
        });

        it('should set a single owner', async () => {
          const newOwners = [accounts[6]];
          await transferOwnership(newOwners);

          assert.deepEqual(await instance.listOwners(), newOwners);
        });

        it('should set several owners', async () => {
          const newOwners = accounts.slice(6, 10);
          await transferOwnership(newOwners);

          assert.deepEqual(await instance.listOwners(), newOwners);
        });

        it('should not allow empty list of owners', async () => {
          await assertThrowsInvalidOpcode(async () => {
            await transferOwnership([]);
          });
        });

        it('should throw when not signed', async () => {
          const newOwners = accounts.slice(6, 10);
          await assertThrowsInvalidOpcode(async () => {
            await transferOwnershipCommand.execute([], newOwners);
          });
        });

        if (owners.length > 1) {
          owners.map(async (owner, index) =>
            it(`should throw when signed only by #${index + 1}`, async () => {
              const newOwners = accounts.slice(6, 10);
              const nonce = await instance.nonce();
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
          const newOwners = accounts.slice(6, 10);
          const strangers = accounts.slice(4, 4 + owners.length);
          const nonce = await instance.nonce();
          const signatures = await Promise.all(
            strangers.map(owner =>
              transferOwnershipCommand.sign(owner, nonce, newOwners)
            )
          );

          await assertThrowsInvalidOpcode(async () => {
            await transferOwnershipCommand.execute(signatures, newOwners);
          });
        });

        if (owners.length > 1) {
          it('should throw when signed by owners in wrong order', async () => {
            const newOwners = accounts.slice(6, 10);
            const reversed = owners.reverse();
            const nonce = await instance.nonce();
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
          const nonce = await instance.nonce();
          const tx1Owners = accounts.slice(6, 10);
          const tx2Owners = accounts.slice(5, 8);

          const tx1Signatures = owners.map(owner =>
            transferOwnershipCommand.sign(owner, nonce, tx1Owners)
          );

          const tx2Signatures = owners.map(owner =>
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
      });
    });
  });
});
