import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  RevokedEvent,
  SignedEvent,
  SignHash,
  SignHashArtifacts
} from 'signhash';
import { ContractContextDefinition } from 'truffle';
import { assertThrowsInvalidOpcode, findLastLog } from './helpers';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const SignHashContract = artifacts.require('./SignHash.sol');

contract('SignHash', accounts => {
  const defaultAccount = accounts[0];
  const otherAccount = accounts[1];
  const deployerAccount = accounts[9];
  const maxCount = accounts.length;
  const hash = web3.sha3('test');

  let signHash: SignHash;

  async function signByMany(hashArg: string, signers: Address[]) {
    for (const signer of signers) {
      await signHash.sign(hashArg, { from: signer });
    }
  }

  beforeEach(async () => {
    signHash = await SignHashContract.new({ from: deployerAccount });
  });

  describe('#ctor', () => {
    it('should start with empty list of signers', async () => {
      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, []);
    });
  });

  describe('#sign', () => {
    it('should add signer', async () => {
      await signHash.sign(hash);

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should add multiple signers', async () => {
      await signByMany(hash, accounts);
      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, accounts);
    });

    it('should add signer only once', async () => {
      await signHash.sign(hash);
      await signHash.sign(hash);

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should emit Signed event', async () => {
      const trans = await signHash.sign(hash);
      const log = findLastLog(trans, 'Signed');
      const event: SignedEvent = log.args;

      assert.equal(event.hash, hash);
      assert.equal(event.signer, defaultAccount);
    });

    it('should throw when hash is empty', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await signHash.sign('');
      });
    });
  });

  describe('#revoke', () => {
    it('should remove the only signer', async () => {
      await signHash.revoke(hash);

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, []);
    });

    it('should remove one of the signers', async () => {
      await signByMany(hash, accounts);
      await signHash.revoke(hash);

      const signers = await signHash.list(hash, maxCount);
      const expected = accounts.filter(
        (account: Address) => account !== defaultAccount
      );

      assert.deepEqual(signers, expected);
    });

    it('should not throw when hash is not signed', async () => {
      await signHash.revoke(hash);

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, []);
    });

    it('should not throw when revoking account is not signer', async () => {
      await signHash.sign(hash);
      await signHash.revoke(hash, { from: otherAccount });

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should emit Revoked event', async () => {
      await signHash.sign(hash);
      const trans = await signHash.revoke(hash);

      const log = findLastLog(trans, 'Revoked');
      const event: RevokedEvent = log.args;

      assert.equal(event.hash, hash);
      assert.equal(event.signer, defaultAccount);
    });

    it('should throw when hash is empty', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await signHash.revoke('');
      });
    });
  });

  describe('#list', () => {
    it('should return empty list when there is no signers', async () => {
      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, []);
    });

    it('should return single element list for a single signer', async () => {
      await signHash.sign(hash);

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should return signers in chronological order', async () => {
      await signByMany(hash, accounts);

      const signers = await signHash.list(hash, maxCount);
      assert.deepEqual(signers, accounts);
    });

    it('should trim signers to maxCount', async () => {
      await signByMany(hash, accounts);

      const reducedCount = maxCount - 1;
      const signers = await signHash.list(hash, reducedCount);
      assert.deepEqual(signers, accounts.slice(0, reducedCount));
    });

    it('should return all signers when maxCount is greater', async () => {
      await signByMany(hash, accounts);

      const increasedCount = maxCount + 1;
      const signers = await signHash.list(hash, increasedCount);
      assert.deepEqual(signers, accounts);
    });

    it('should return empty list when maxCount is zero', async () => {
      await signByMany(hash, accounts);

      const reducedCount = 0;
      const signers = await signHash.list(hash, reducedCount);
      assert.deepEqual(signers, []);
    });
  });
});
