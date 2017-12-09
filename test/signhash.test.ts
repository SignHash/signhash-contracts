import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  ProofAddedEvent,
  ProofRemovedEvent,
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
      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, []);
    });
  });

  describe('#sign', () => {
    it('should add signer', async () => {
      await signHash.sign(hash);

      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should add multiple signers', async () => {
      await signByMany(hash, accounts);
      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, accounts);
    });

    it('should add signer only once', async () => {
      await signHash.sign(hash);
      await signHash.sign(hash);

      const signers = await signHash.getSigners(hash, maxCount);
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

      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, []);
    });

    it('should remove one of the signers', async () => {
      await signByMany(hash, accounts);
      await signHash.revoke(hash);

      const signers = await signHash.getSigners(hash, maxCount);
      const expected = accounts.filter(
        (account: Address) => account !== defaultAccount
      );

      assert.deepEqual(signers, expected);
    });

    it('should not throw when hash is not signed', async () => {
      await signHash.revoke(hash);

      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, []);
    });

    it('should not throw when revoking account is not signer', async () => {
      await signHash.sign(hash);
      await signHash.revoke(hash, { from: otherAccount });

      const signers = await signHash.getSigners(hash, maxCount);
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

  describe('#getSigners', () => {
    it('should return empty list when there is no signers', async () => {
      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, []);
    });

    it('should return single element list for a single signer', async () => {
      await signHash.sign(hash);

      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should return signers in chronological order', async () => {
      await signByMany(hash, accounts);

      const signers = await signHash.getSigners(hash, maxCount);
      assert.deepEqual(signers, accounts);
    });

    it('should trim signers to maxCount', async () => {
      await signByMany(hash, accounts);

      const reducedCount = maxCount - 1;
      const signers = await signHash.getSigners(hash, reducedCount);
      assert.deepEqual(signers, accounts.slice(0, reducedCount));
    });

    it('should return all signers when maxCount is greater', async () => {
      await signByMany(hash, accounts);

      const increasedCount = maxCount + 1;
      const signers = await signHash.getSigners(hash, increasedCount);
      assert.deepEqual(signers, accounts);
    });

    it('should return empty list when maxCount is zero', async () => {
      await signByMany(hash, accounts);

      const reducedCount = 0;
      const signers = await signHash.getSigners(hash, reducedCount);
      assert.deepEqual(signers, []);
    });
  });

  describe('#addProof', () => {
    it('should add proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      await signHash.addProof(method, value);

      const proof = await signHash.getProof(defaultAccount, method);
      assert.equal(proof, value);
    });

    it('should add multiple proof methods', async () => {
      const proofs = [
        {
          method: 'http',
          value: 'example.com'
        },
        {
          method: 'github',
          value: 'example'
        },
        {
          method: 'dns',
          value: 'another.com'
        }
      ];

      await Promise.all(
        proofs.map(proof => signHash.addProof(proof.method, proof.value))
      );

      const readProofs = await Promise.all(
        proofs.map(async proof => {
          return {
            method: proof.method,
            value: await signHash.getProof(defaultAccount, proof.method)
          };
        })
      );

      assert.deepEqual(readProofs, proofs);
    });

    it('should override proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      const newValue = 'another.com';
      await signHash.addProof(method, value);
      await signHash.addProof(method, newValue);

      const proof = await signHash.getProof(defaultAccount, method);
      assert.equal(proof, newValue);
    });

    it('should emit ProofAdded event', async () => {
      const method = 'http';
      const value = 'example.com';
      const trans = await signHash.addProof(method, value);
      const log = findLastLog(trans, 'ProofAdded');
      const event: ProofAddedEvent = log.args;

      assert.equal(event.signer, defaultAccount);
      assert.equal(event.method, method);
      assert.equal(event.value, value);
    });

    it('should throw when method is empty', async () => {
      const method = '';
      const value = 'test';

      await assertThrowsInvalidOpcode(async () => {
        await signHash.addProof(method, value);
      });
    });

    it('should throw when value is empty', async () => {
      const method = 'http';
      const value = '';

      await assertThrowsInvalidOpcode(async () => {
        await signHash.addProof(method, value);
      });
    });
  });

  describe('#removeProof', () => {
    it('should remove proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      await signHash.addProof(method, value);

      await signHash.removeProof(method);
      const proof = await signHash.getProof(defaultAccount, method);
      assert.equal(proof, '');
    });

    it('should emit ProofRemoved event', async () => {
      const method = 'http';
      const value = 'example.com';
      await signHash.addProof(method, value);
      const trans = await signHash.removeProof(method);
      const log = findLastLog(trans, 'ProofRemoved');
      const event: ProofRemovedEvent = log.args;

      assert.equal(event.signer, defaultAccount);
      assert.equal(event.method, method);
    });

    it('should throw when called by other user', async () => {
      const method = 'http';
      const value = 'example.com';
      await signHash.addProof(method, value);

      await assertThrowsInvalidOpcode(async () => {
        await signHash.removeProof(method, { from: otherAccount });
      });
    });

    it('should throw when method is empty', async () => {
      const method = '';

      await assertThrowsInvalidOpcode(async () => {
        await signHash.removeProof(method);
      });
    });

    it('should throw when proof does not exist', async () => {
      const method = 'doesNotExist';

      await assertThrowsInvalidOpcode(async () => {
        await signHash.removeProof(method);
      });
    });
  });

  describe('#getProof', () => {
    it('should return empty string when proof does not exist', async () => {
      const method = 'doesNotExist';

      const proof = await signHash.getProof(defaultAccount, method);
      assert.equal(proof, '');
    });

    it('should return empty string when method is empty', async () => {
      const method = '';

      const proof = await signHash.getProof(defaultAccount, method);
      assert.equal(proof, '');
    });
  });
});
