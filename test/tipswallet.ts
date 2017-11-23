import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  DepositEvent,
  ERC20,
  ExecutedEvent,
  SignHashArtifacts,
  TipsWallet
} from 'signhash';
import { ContractContextDefinition } from 'truffle';

import { MultiSigERC20Transfer, MultiSigTransfer } from '../multisig';
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
const TestERC20TokenContract = artifacts.require('./TestERC20Token.sol');

contract('TipsWallet', accounts => {
  const owners = accounts.slice(0, 2);
  const benefactor = accounts[9];
  const utils = new Web3Utils(web3);

  let instance: TipsWallet;
  let token: ERC20;

  async function tip(value: Web3.AnyNumber, from: Address = benefactor) {
    return await instance.sendTransaction({
      from,
      to: instance.address,
      value
    });
  }

  async function transferEther(destination: Address, value: Web3.AnyNumber) {
    const nonce = await instance.nonce();
    const transfer = new MultiSigTransfer(web3, instance);

    const signatures = owners.map(owner =>
      transfer.sign(owner, destination, value, nonce)
    );

    return await transfer.execute(signatures, destination, value);
  }

  async function transferERC20(destination: Address, amount: Web3.AnyNumber) {
    const nonce = await instance.nonce();
    const erc20Transfer = new MultiSigERC20Transfer(web3, instance, token);

    const signatures = await Promise.all(
      owners.map(owner => erc20Transfer.sign(owner, destination, amount, nonce))
    );

    return await erc20Transfer.execute(signatures, destination, amount);
  }

  beforeEach(async () => {
    instance = await TipsWalletContract.new(owners);
    token = (await TestERC20TokenContract.new()) as ERC20;
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
    describe('transfer Ether', () => {
      const value = utils.toEther(0.1);

      beforeEach(async () => {
        await tip(utils.toEther(0.1));
      });

      it('should transfer Ether to account', async () => {
        const destination = accounts[9];
        const prevBalance = await utils.getBalance(destination);
        const expectedBalance = prevBalance.add(value);

        await transferEther(destination, value);

        assertEtherEqual(await utils.getBalance(destination), expectedBalance);
      });

      it('should emit Executed event', async () => {
        const destination = accounts[9];
        const nonce = await instance.nonce();

        const trans = await transferEther(destination, value);

        const log = findLastLog(trans, 'Executed');
        const event = log.args as ExecutedEvent;

        assert.equal(event.destination, destination);
        assertNumberEqual(event.nonce, nonce);
        assertEtherEqual(event.value, value);
        assert.equal(event.data, '0x');
      });
    });

    describe('transfer ERC20', () => {
      const amount = utils.toEther(10);

      beforeEach(async () => {
        await token.transfer(instance.address, amount);
      });

      it('should transfer token to account', async () => {
        const destination = accounts[9];
        const prevBalance = await token.balanceOf(destination);
        const expectedBalance = prevBalance.add(amount);

        await transferERC20(destination, amount);

        assertEtherEqual(await token.balanceOf(destination), expectedBalance);
      });
    });
  });
});
