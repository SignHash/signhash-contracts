import * as R from 'ramda';
import { TipsWallet } from 'signhash';

import {
  assertEtherAlmostEqual,
  assertEtherEqual,
  assertThrowsInvalidOpcode,
  getBalance,
  sendTransaction,
  toEther
} from './helpers';

const TipsWalletContract = artifacts.require('./TipsWallet.sol');

contract('TipsWallet', accounts => {
  const owners = accounts.slice(0, 2);
  const deployerAccount = accounts[9];

  let instance: TipsWallet;

  async function tip(value: number | string) {
    await sendTransaction({
      from: deployerAccount,
      to: instance.address,
      value
    });
  }

  async function assertSettledShares(expected: [number | string]) {
    for (let i = 0; i < expected.length; i++) {
      const share = await instance.settledShares(owners[i]);
      assertEtherEqual(share, expected[i]);
    }
  }

  beforeEach(async () => {
    instance = await TipsWalletContract.new(owners, {
      from: deployerAccount
    });
  });

  describe('#ctor', () => {
    it('should set owners', async () => {
      assert.deepEqual(await instance.getOwners(), owners);
    });

    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([], {
          from: deployerAccount
        });
      });
    });
  });

  describe('#fallback', () => {
    it('should accept deposit with 22000 gas limit', async () => {
      const value = toEther(1);
      await sendTransaction({
        from: deployerAccount,
        gas: 22000,
        to: instance.address,
        value
      });

      assertEtherEqual(value, await getBalance(instance.address));
    });
  });

  describe('#settle', () => {
    it('should not modify shares if balance is zero', async () => {
      await instance.settle({ from: owners[0] });
      await assertSettledShares([0, 0]);
      assertEtherEqual(await instance.getUnsettledBalance(), 0);
    });

    it('should divide single tip amongst owners', async () => {
      const amount = 1;
      await tip(toEther(amount));
      await instance.settle({ from: owners[0] });
      const share = toEther(amount / owners.length);

      await assertSettledShares([share, share]);
      assertEtherEqual(await instance.getUnsettledBalance(), 0);
    });

    it('should divide multiple tips amongst owners', async () => {
      const tips = [1, 2, 3];
      await tips.forEach(async amount => await tip(toEther(amount)));
      await instance.settle({ from: owners[0] });
      const share = toEther(R.sum(tips) / owners.length);

      await assertSettledShares([share, share]);
      assertEtherEqual(await instance.getUnsettledBalance(), 0);
    });

    it('should not allow to settle already settled balance', async () => {
      const amount = 1;
      await tip(toEther(amount));
      await instance.settle({ from: owners[0] });
      await instance.settle({ from: owners[0] });
      const share = toEther(amount / owners.length);

      await assertSettledShares([share, share]);
      assertEtherEqual(await instance.getUnsettledBalance(), 0);
    });

    it('should throw when called by non-owner', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await instance.settle({ from: deployerAccount });
      });
    });
  });

  describe('#withdraw', () => {
    context('after settlement of 1 ether', () => {
      const amount = 1;

      beforeEach(async () => {
        await tip(toEther(amount));
        await instance.settle({ from: owners[0] });
      });

      it('should transfer 0.5 ETH to sender', async () => {
        const prevBalance = await getBalance(owners[0]);

        const share = await instance.settledShares(owners[0]);
        await instance.withdraw(share.toFixed(), { from: owners[0] });

        const balanceDiff = (await getBalance(owners[0])).sub(prevBalance);
        assertEtherAlmostEqual(share, balanceDiff);
      });

      it('should leave 0.5 ETH for other owner', async () => {
        const share = await instance.settledShares(owners[0]);
        await instance.withdraw(share.toFixed(), { from: owners[0] });

        const remainingShare = await instance.settledShares(owners[1]);
        assertEtherEqual(remainingShare, await getBalance(instance.address));
      });
    });
  });
});
