import { assertThrowsInvalidOpcode, findLastLog } from './helpers';

const SignHashContract = artifacts.require('./SignHash.sol');

contract('SignHash', accounts => {
  const defaultAccount = accounts[0];
  const deployer = accounts[9];
  const hash = web3.sha3('test');

  let instance: SignHash;

  beforeEach(async () => {
    instance = await SignHashContract.new({
      from: deployer
    });
  });

  describe('#ctor', () => {
    it('should start with empty list of signers', async () => {
      const signers = await instance.getSigners(hash);
      assert.deepEqual(signers, []);
    });
  });

  describe('#sign', () => {
    it('should add signer', async () => {
      await instance.sign(hash);

      const signers = await instance.getSigners(hash);
      assert.deepEqual(signers, [defaultAccount]);
    });

    it('should add multiple signers', async () => {
      await Promise.all(
        accounts.map(account => instance.sign(hash, { from: account }))
      );

      const signers = await instance.getSigners(hash);
      assert.deepEqual(signers.sort(), accounts.sort());
    });

    it('should emit Signed event', async () => {
      const trans = await instance.sign(hash);
      const log = findLastLog(trans, 'Signed');
      const event: Signed = log.args;

      assert.equal(event.hash, hash);
      assert.equal(event.signer, defaultAccount);
    });

    it('should throw when hash is empty', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await instance.sign('');
      });
    });
  });

  describe('#addProof', () => {
    it('should add proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      await instance.addProof(method, value);

      const proof = await instance.getProof(defaultAccount, method);
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
        proofs.map(proof => instance.addProof(proof.method, proof.value))
      );

      const readProofs = await Promise.all(
        proofs.map(async proof => {
          return {
            method: proof.method,
            value: await instance.getProof(defaultAccount, proof.method)
          };
        })
      );

      assert.deepEqual(readProofs, proofs);
    });

    it('should override proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      const newValue = 'another.com';
      await instance.addProof(method, value);
      await instance.addProof(method, newValue);

      const proof = await instance.getProof(defaultAccount, method);
      assert.equal(proof, newValue);
    });

    it('should emit ProofAdded event', async () => {
      const method = 'http';
      const value = 'example.com';
      const trans = await instance.addProof(method, value);
      const log = findLastLog(trans, 'ProofAdded');
      const event: ProofAdded = log.args;

      assert.equal(event.signer, defaultAccount);
      assert.equal(event.method, method);
      assert.equal(event.value, value);
    });

    it('should throw when method is empty', async () => {
      const method = '';
      const value = 'test';

      await assertThrowsInvalidOpcode(async () => {
        await instance.addProof(method, value);
      });
    });

    it('should throw when value is empty', async () => {
      const method = 'http';
      const value = '';

      await assertThrowsInvalidOpcode(async () => {
        await instance.addProof(method, value);
      });
    });
  });

  describe('#removeProof', () => {
    it('should remove proof method', async () => {
      const method = 'http';
      const value = 'example.com';
      await instance.addProof(method, value);

      await instance.removeProof(method);
      const proof = await instance.getProof(defaultAccount, method);
      assert.equal(proof, '');
    });

    it('should emit ProofRemoved event', async () => {
      const method = 'http';
      const value = 'example.com';
      await instance.addProof(method, value);
      const trans = await instance.removeProof(method);
      const log = findLastLog(trans, 'ProofRemoved');
      const event: ProofRemoved = log.args;

      assert.equal(event.signer, defaultAccount);
      assert.equal(event.method, method);
    });

    it('should throw when method is empty', async () => {
      const method = '';

      await assertThrowsInvalidOpcode(async () => {
        await instance.removeProof(method);
      });
    });

    it('should throw when proof does not exist', async () => {
      const method = 'doesNotExist';

      await assertThrowsInvalidOpcode(async () => {
        await instance.removeProof(method);
      });
    });
  });

  describe('#getProof', () => {
    it('should return empty string when proof does not exist', async () => {
      const method = 'doesNotExist';

      const proof = await instance.getProof(defaultAccount, method);
      assert.equal(proof, '');
    });

    it('should return empty string when method is empty', async () => {
      const method = '';

      const proof = await instance.getProof(defaultAccount, method);
      assert.equal(proof, '');
    });
  });
});
