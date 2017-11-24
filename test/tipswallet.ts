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
      beforeEach(async () => {
        await tip(utils.toEther(1));
      });

      it('should transfer Ether to account', async () => {
        const value = utils.toEther(0.1);
        const destinationAccount = accounts[9];
        const initialBalance = await utils.getBalance(destinationAccount);
        const expectedBalance = initialBalance.add(value);

        await transferEther(destinationAccount, value);

        assertEtherEqual(
          await utils.getBalance(destinationAccount),
          expectedBalance
        );
      });

      it('should emit Executed event', async () => {
        const value = utils.toEther(0.1);
        const destinationAccount = accounts[9];
        const nonce = await instance.nonce();

        const trans = await transferEther(destinationAccount, value);

        const log = findLastLog(trans, 'Executed');
        const event = log.args as ExecutedEvent;

        assert.equal(event.destination, destinationAccount);
        assertNumberEqual(event.nonce, nonce);
        assertEtherEqual(event.value, value);
        assert.equal(event.data, '0x');
      });

      it('should transfer Ether to account repeatedly', async () => {
        const values = [0.1, 0.3, 0.5].map(value => utils.toEther(value));
        const destinationAccount = accounts[9];
        const initialBalance = await utils.getBalance(destinationAccount);
        const valuesSum = values.reduce((a, b) => a.add(b), utils.toEther(0));
        const expectedBalance = initialBalance.add(valuesSum);

        for (const value of values) {
          await transferEther(destinationAccount, value);
        }

        assertEtherEqual(
          await utils.getBalance(destinationAccount),
          expectedBalance
        );
      });

      it('should transfer Ether to several accounts', async () => {
        const value = utils.toEther(0.1);
        const destinations = accounts.slice(owners.length, 5);

        // sign all transfers
        const transfer = new MultiSigTransfer(web3, instance);

        const nonce = await instance.nonce();
        const specifications = await Promise.all(
          destinations.map(async (account, index) => ({
            destination: {
              account,
              initialBalance: await utils.getBalance(account)
            },
            signatures: owners.map(owner =>
              transfer.sign(owner, account, value, nonce.add(index))
            )
          }))
        );

        // execute all transfers
        for (const { signatures, destination } of specifications) {
          await transfer.execute(signatures, destination.account, value);

          const expectedBalance = destination.initialBalance.add(value);
          assertEtherEqual(
            await utils.getBalance(destination.account),
            expectedBalance
          );
        }
      });
    });

    describe('transfer ERC20', () => {
      beforeEach(async () => {
        await token.transfer(instance.address, utils.toEther(100));
      });

      it('should transfer tokens to account', async () => {
        const amount = utils.toEther(10);
        const destinationAccount = accounts[9];
        const initialBalance = await token.balanceOf(destinationAccount);
        const expectedBalance = initialBalance.add(amount);

        await transferERC20(destinationAccount, amount);

        assertEtherEqual(
          await token.balanceOf(destinationAccount),
          expectedBalance
        );
      });

      it('should transfer tokens to account repeatedly', async () => {
        const amounts = [1, 3, 5].map(amount => utils.toEther(amount));
        const destinationAccount = accounts[9];
        const initialBalance = await token.balanceOf(destinationAccount);
        const amountsSum = amounts.reduce((a, b) => a.add(b), utils.toEther(0));
        const expectedBalance = initialBalance.add(amountsSum);

        for (const amount of amounts) {
          await transferERC20(destinationAccount, amount);
        }

        assertEtherEqual(
          await token.balanceOf(destinationAccount),
          expectedBalance
        );
      });

      it('should transfer token to several accounts', async () => {
        const amount = utils.toEther(10);
        const destinations = accounts.slice(owners.length, 5);

        // sign all token transfers
        const tokenTransfer = new MultiSigERC20Transfer(web3, instance, token);

        const nonce = await instance.nonce();
        const specifications = await Promise.all(
          destinations.map(async (account, index) => ({
            destination: {
              account,
              initialTokenBalance: await token.balanceOf(account)
            },
            signatures: await Promise.all(
              owners.map(
                async owner =>
                  await tokenTransfer.sign(
                    owner,
                    account,
                    amount,
                    nonce.add(index)
                  )
              )
            )
          }))
        );

        // execute all token transfers
        for (const { signatures, destination } of specifications) {
          await tokenTransfer.execute(signatures, destination.account, amount);

          const expectedBalance = destination.initialTokenBalance.add(amount);
          assertEtherEqual(
            await token.balanceOf(destination.account),
            expectedBalance
          );
        }
      });
    });
  });
});
