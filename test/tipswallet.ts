import { assert } from 'chai';
import { MultiSig } from '../utils';

import * as Web3 from 'web3';

import {
  DepositEvent,
  ExecutedEvent,
  SignHashArtifacts,
  TipsWallet
} from 'signhash';
import { ContractContextDefinition } from 'truffle';
import { Web3Utils } from '../utils';
import {
  assertEtherEqual,
  assertNumberEqual,
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
  const utils = new Web3Utils(web3);

  let instance: TipsWallet;
  let multisig: MultiSig;

  async function tip(value: Web3.AnyNumber, from: Address = benefactor) {
    return await instance.sendTransaction({
      from,
      to: instance.address,
      value
    });
  }

  async function sendTransaction(
    destination: Address,
    value: Web3.AnyNumber,
    data: string = '0x'
  ) {
    const nonce = await instance.nonce();
    const sigs = owners.map(owner =>
      multisig.signTransaction(owner, destination, value, nonce, data)
    );
    return await multisig.execute(sigs, destination, value, data);
  }

  beforeEach(async () => {
    instance = await TipsWalletContract.new(owners);
    multisig = new MultiSig(web3, instance);
  });

  describe('#ctor', () => {
    it('should set owners', async () => {
      assert.deepEqual(await instance.owners(), owners);
    });

    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([]);
      });
    });
  });

  describe('#fallback', () => {
    it('should not consume more than 23000 gas', async () => {
      const result = await tip(utils.toEther(0.1));

      assert.isAtMost(result.receipt.gasUsed, 23000);
    });

    it('should increase balance', async () => {
      const value = utils.toEther(1);
      await tip(value);

      assertEtherEqual(value, await utils.getBalance(instance.address));
    });

    it('should emit Deposit event when received Ether', async () => {
      const value = utils.toEther(1);
      const trans = await tip(value);

      const log = findLastLog(trans, 'Deposit');
      const event = log.args as DepositEvent;

      assert.equal(event.from, benefactor);
      assertEtherEqual(event.value, value);
    });

    it('should not emit Deposit event when called without Ether', async () => {
      const trans = await tip(0);
      const log = findLastLog(trans, 'Deposit');
      assert.isNotOk(log);
    });
  });

  describe('#execute', () => {
    describe('withdraw Ether', () => {
      beforeEach(async () => {
        await tip(utils.toEther(0.1));
      });

      it('should transfer Ether to account', async () => {
        const destination = accounts[9];
        const value = utils.toEther(0.1);
        const prevBalance = await utils.getBalance(destination);
        const expectedBalance = prevBalance.add(value);

        await sendTransaction(destination, value);

        assertEtherEqual(await utils.getBalance(destination), expectedBalance);
      });

      it('should emit Executed event', async () => {
        const destination = accounts[9];
        const value = utils.toEther(0.1);
        const nonce = await instance.nonce();

        const trans = await sendTransaction(destination, value);

        const log = findLastLog(trans, 'Executed');
        const event = log.args as ExecutedEvent;

        assert.equal(event.destination, destination);
        assertNumberEqual(event.nonce, nonce);
        assertEtherEqual(event.value, value);
        assert.equal(event.data, '0x');
      });
    });
  });
});
