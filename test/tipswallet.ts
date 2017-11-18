import { assert } from 'chai';

import * as Web3 from 'web3';

import { DepositEvent, SignHashArtifacts, TipsWallet } from 'signhash';
import { ContractContextDefinition } from 'truffle';
import { getBalance, toEther } from '../utils';
import {
  assertEtherEqual,
  assertThrowsInvalidOpcode,
  findLastLog
} from './helpers';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const TipsWalletContract = artifacts.require('./TipsWallet.sol');

contract('TipsWallet', accounts => {
  const owners = accounts.slice(0, 2);
  const benefactor = accounts[9];

  let instance: TipsWallet;

  async function tip(value: Web3.AnyNumber, from: Address = benefactor) {
    return await instance.sendTransaction({
      from,
      to: instance.address,
      value
    });
  }

  beforeEach(async () => {
    instance = await TipsWalletContract.new(owners);
  });

  describe('#ctor', () => {
    it('should set owners', async () => {
      assert.deepEqual(await instance.getOwners(), owners);
    });

    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([]);
      });
    });
  });

  describe('#fallback', () => {
    it('should not consume more than 23000 gas', async () => {
      const result = await tip(toEther(web3, 0.1));

      assert.isAtMost(result.receipt.gasUsed, 23000);
    });

    it('should increase balance', async () => {
      const value = toEther(web3, 1);
      await tip(value);

      assertEtherEqual(value, await getBalance(web3, instance.address));
    });

    it('should emit Deposit event', async () => {
      const value = toEther(web3, 1);
      const trans = await tip(value);

      const log = findLastLog(trans, 'Deposit');
      const event: DepositEvent = log.args;

      assert.equal(event.from, benefactor);
      assertEtherEqual(event.value, value);
    });
  });
});
