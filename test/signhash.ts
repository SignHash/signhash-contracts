import { contains, forEach, range } from 'ramda';
import { assertThrowsInvalidOpcode, findLastLog } from './helpers';

const SignHashContract = artifacts.require('./SignHash.sol');
const HASH =
  '0x43df940fc163216801a40c010caccb0764c0bc8c46f30913e89865fb741d37e6';

contract('SignHash', accounts => {
  let instance: SignHash;

  beforeEach(async () => {
    instance = await SignHashContract.new();
  });

  describe('#sign', () => {
    it('should add sender', async () => {
      const signer = accounts[0];
      await instance.sign(HASH, { from: signer });

      const signers = await instance.getSigners(HASH);
      assert.equal(signers.length, 1);
      assert.equal(signers[0], signer);
    });

    it('should add multiple senders', async () => {
      const count = 5;
      const seq = range(0, count);
      await Promise.all(
        seq.map(i => instance.sign(HASH, { from: accounts[i] }))
      );

      const signers = await instance.getSigners(HASH);
      assert.equal(signers.length, count);

      forEach(i => assert.isTrue(contains(accounts[i], signers)), seq);
    });

    it('should emit Signed event', async () => {
      const signer = accounts[0];
      const trans = await instance.sign(HASH, { from: signer });
      const log = findLastLog(trans, 'Signed');
      const event: Signed = log.args;

      assert.equal(event.hash, HASH);
      assert.equal(event.signer, signer);
    });

    it('should reject empty hash', async () => {
      const signer = accounts[0];
      await assertThrowsInvalidOpcode(async () => {
        await instance.sign('', { from: signer });
      });
    });
  });

  describe('#addProof', () => {
    it('should add proof', async () => {
      const signer = accounts[0];
      const method = 'http';
      const value = 'example.com';
      await instance.addProof(method, value, { from: signer });

      const proof = await instance.getProof(signer, method);
      assert.equal(proof, value);
    });

    it('should add multiple proofs', async () => {
      const signer = accounts[0];
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
        proofs.map(proof =>
          instance.addProof(proof.method, proof.value, { from: signer })
        )
      );

      await Promise.all(
        proofs.map(async proof =>
          assert.equal(
            await instance.getProof(signer, proof.method),
            proof.value
          )
        )
      );
    });

    it('should override proof', async () => {
      const signer = accounts[0];
      const method = 'http';
      const value = 'example.com';
      const newValue = 'another.com';
      await instance.addProof(method, value, { from: signer });
      await instance.addProof(method, newValue, { from: signer });

      const proof = await instance.getProof(signer, method);
      assert.equal(proof, newValue);
    });

    it('should emit ProofAdded event', async () => {
      const signer = accounts[0];
      const method = 'http';
      const value = 'example.com';
      const trans = await instance.addProof(method, value, { from: signer });
      const log = findLastLog(trans, 'ProofAdded');
      const event: ProofAdded = log.args;

      assert.equal(event.signer, signer);
      assert.equal(event.method, method);
      assert.equal(event.value, value);
    });

    it('should reject empty method proof', async () => {
      const signer = accounts[0];
      const method = '';
      const value = 'test';

      await assertThrowsInvalidOpcode(async () => {
        await instance.addProof(method, value, { from: signer });
      });
    });

    it('should reject empty value proof', async () => {
      const signer = accounts[0];
      const method = 'http';
      const value = '';

      await assertThrowsInvalidOpcode(async () => {
        await instance.addProof(method, value, { from: signer });
      });
    });
  });
});
