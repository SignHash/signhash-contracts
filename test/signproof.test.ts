import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  AddedEvent,
  RemovedEvent,
  SignHashArtifacts,
  SignProof
} from 'signhash';
import { ContractContextDefinition } from 'truffle';
import { assertThrowsInvalidOpcode, findLastLog } from './helpers';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const SignProofContract = artifacts.require('./SignProof.sol');

contract('SignProof', accounts => {
  const defaultAccount = accounts[0];
  const otherAccount = accounts[1];
  const deployerAccount = accounts[9];

  let signProof: SignProof;

  beforeEach(async () => {
    signProof = await SignProofContract.new({ from: deployerAccount });
  });

  describe('#add', () => {
    it('should add proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      await signProof.add(method, value);

      const proof = await signProof.get(defaultAccount, method);
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
        proofs.map(proof => signProof.add(proof.method, proof.value))
      );

      const readProofs = await Promise.all(
        proofs.map(async proof => {
          return {
            method: proof.method,
            value: await signProof.get(defaultAccount, proof.method)
          };
        })
      );

      assert.deepEqual(readProofs, proofs);
    });

    it('should override proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      const newValue = 'another.com';
      await signProof.add(method, value);
      await signProof.add(method, newValue);

      const proof = await signProof.get(defaultAccount, method);
      assert.equal(proof, newValue);
    });

    it('should emit Added event', async () => {
      const method = 'http';
      const value = 'example.com';
      const trans = await signProof.add(method, value);
      const log = findLastLog(trans, 'Added');
      const event: AddedEvent = log.args;

      assert.equal(event.signer, defaultAccount);
      assert.equal(event.method, method);
      assert.equal(event.value, value);
    });

    it('should throw when method is empty', async () => {
      const method = '';
      const value = 'test';

      await assertThrowsInvalidOpcode(async () => {
        await signProof.add(method, value);
      });
    });

    it('should throw when value is empty', async () => {
      const method = 'http';
      const value = '';

      await assertThrowsInvalidOpcode(async () => {
        await signProof.add(method, value);
      });
    });
  });

  describe('#remove', () => {
    it('should remove proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      await signProof.add(method, value);

      await signProof.remove(method);
      const proof = await signProof.get(defaultAccount, method);
      assert.equal(proof, '');
    });

    it('should emit Removed event', async () => {
      const method = 'http';
      const value = 'example.com';
      await signProof.add(method, value);
      const trans = await signProof.remove(method);
      const log = findLastLog(trans, 'Removed');
      const event: RemovedEvent = log.args;

      assert.equal(event.signer, defaultAccount);
      assert.equal(event.method, method);
    });

    it('should throw when called by other user', async () => {
      const method = 'http';
      const value = 'example.com';
      await signProof.add(method, value);

      await assertThrowsInvalidOpcode(async () => {
        await signProof.remove(method, { from: otherAccount });
      });
    });

    it('should throw when method is empty', async () => {
      const method = '';

      await assertThrowsInvalidOpcode(async () => {
        await signProof.remove(method);
      });
    });

    it('should throw when proof does not exist', async () => {
      const method = 'doesNotExist';

      await assertThrowsInvalidOpcode(async () => {
        await signProof.remove(method);
      });
    });
  });

  describe('#get', () => {
    it('should return empty string when proof does not exist', async () => {
      const method = 'doesNotExist';

      const proof = await signProof.get(defaultAccount, method);
      assert.equal(proof, '');
    });

    it('should return empty string when method is empty', async () => {
      const method = '';

      const proof = await signProof.get(defaultAccount, method);
      assert.equal(proof, '');
    });
  });
});
