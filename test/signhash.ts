const SignHash = artifacts.require('./SignHash.sol');

contract('SignHash', accounts => {
  const ACCOUNT = accounts[0];
  const HASH = '43df940fc163216801a40c010caccb0764c0bc8c46f30913e89865fb741d37e6';

  let instance: ISignHash;

  beforeEach(async () => {
    instance = (await SignHash.new()) as ISignHash;
  });

  describe('#sign', () => {
    it('should add sender to the list of signers', async () => {
      await instance.sign(HASH);

      const signers = await instance.getSigners(HASH);
      assert.equal(signers.length, 1);
      assert.equal(signers[0], ACCOUNT);
    });
  });
});
