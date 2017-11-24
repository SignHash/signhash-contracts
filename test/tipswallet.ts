import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  DepositEvent,
  ERC20,
  ExecutedEvent,
  SignHashArtifacts,
  TipsWallet
} from 'signhash';
import { ContractContextDefinition, TransactionResult } from 'truffle';
import { AnyNumber } from 'web3';

import {
  getData,
  MultiSigERC20Transfer,
  MultiSigTransaction,
  MultiSigTransfer,
  Signature
} from '../multisig';
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
  const deployer = accounts[0];
  const defaultAccount = accounts[9];
  const owners = accounts.slice(1, 3);
  const utils = new Web3Utils(web3);

  let instance: TipsWallet;

  async function tip(value: AnyNumber, from: Address = defaultAccount) {
    return await instance.sendTransaction({
      from,
      to: instance.address,
      value
    });
  }

  beforeEach(async () => {
    instance = await TipsWalletContract.new(owners, { from: deployer });
  });

  describe('#ctor', () => {
    it('should set owners', async () => {
      assert.deepEqual(await instance.owners(), owners);
    });

    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([], { from: deployer });
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
      assert.isOk(log);

      const event = log.args as DepositEvent;
      assert.isOk(event);
      assert.equal(event.from, defaultAccount);
      assertEtherEqual(event.value, value);
    });

    it('should not emit Deposit event when called without Ether', async () => {
      const trans = await tip(0);
      const log = findLastLog(trans, 'Deposit');
      assert.isNotOk(log);
    });
  });

  describe('#execute', () => {
    let transaction: MultiSigTransaction;

    async function signDummy(
      owner: Address,
      account: Address,
      nonce: AnyNumber
    ) {
      return await transaction.sign(owner, account, 0, nonce, '0x');
    }

    async function executeDummy(signatures: Signature[], account: Address) {
      return await transaction.execute(signatures, account, 0, '0x');
    }

    function assertExecutedEvent(
      tx: TransactionResult,
      account: Address,
      nonce: AnyNumber,
      value: AnyNumber,
      data: string
    ) {
      const log = findLastLog(tx, 'Executed');
      assert.isOk(log);

      const event = log.args as ExecutedEvent;
      assert.isOk(event);
      assert.equal(event.destination, account);
      assertNumberEqual(event.nonce, nonce);
      assertEtherEqual(event.value, value);
      assert.equal(event.data, data);
    }

    beforeEach(async () => {
      await tip(utils.toEther(1));

      transaction = new MultiSigTransaction(web3, instance);
    });

    it('should emit Executed event', async () => {
      const nonce = await instance.nonce();
      const signatures = await Promise.all(
        owners.map(async owner => signDummy(owner, defaultAccount, nonce))
      );
      const tx = await executeDummy(signatures, defaultAccount);

      assertExecutedEvent(tx, defaultAccount, nonce, 0, '0x');
    });

    it('should throw when not signed', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await executeDummy([], defaultAccount);
      });
    });

    owners.map(async (owner, index) =>
      it(`should throw when signed only by #${index + 1} owner`, async () => {
        const nonce = await instance.nonce();
        const signature = await signDummy(owner, defaultAccount, nonce);

        await assertThrowsInvalidOpcode(async () => {
          await executeDummy([signature], defaultAccount);
        });
      })
    );

    it('should throw when signed by other accounts', async () => {
      const strangers = accounts.slice(4, 4 + owners.length);
      const nonce = await instance.nonce();
      const signatures = await Promise.all(
        strangers.map(async owner => signDummy(owner, defaultAccount, nonce))
      );

      await assertThrowsInvalidOpcode(async () => {
        await executeDummy(signatures, defaultAccount);
      });
    });

    it('should throw when signed by owners in wrong order', async () => {
      const reversed = owners.reverse();
      const nonce = await instance.nonce();
      const signatures = await Promise.all(
        reversed.map(async owner => signDummy(owner, defaultAccount, nonce))
      );

      await assertThrowsInvalidOpcode(async () => {
        await executeDummy(signatures, defaultAccount);
      });
    });

    describe('transfer Ether', () => {
      let transfer: MultiSigTransfer;

      async function transferEther(account: Address, value: AnyNumber) {
        const nonce = await instance.nonce();
        const signatures = owners.map(owner =>
          transfer.sign(owner, account, value, nonce)
        );

        return await transfer.execute(signatures, account, value);
      }

      beforeEach(async () => {
        await tip(utils.toEther(1));

        transfer = new MultiSigTransfer(web3, instance);
      });

      it('should transfer Ether to account', async () => {
        const value = utils.toEther(0.1);
        const initialBalance = await utils.getBalance(defaultAccount);
        const expectedBalance = initialBalance.add(value);

        await transferEther(defaultAccount, value);

        assertEtherEqual(
          await utils.getBalance(defaultAccount),
          expectedBalance
        );
      });

      it('should emit Executed event with transfer parameters', async () => {
        const value = utils.toEther(0.1);
        const nonce = await instance.nonce();

        const tx = await transferEther(defaultAccount, value);
        assertExecutedEvent(tx, defaultAccount, nonce, value, '0x');
      });

      it('should transfer Ether to account repeatedly', async () => {
        const values = [0.1, 0.3, 0.5].map(value => utils.toEther(value));
        const initialBalance = await utils.getBalance(defaultAccount);
        const valuesSum = values.reduce((a, b) => a.add(b), utils.toEther(0));
        const expectedBalance = initialBalance.add(valuesSum);

        for (const value of values) {
          await transferEther(defaultAccount, value);
        }

        assertEtherEqual(
          await utils.getBalance(defaultAccount),
          expectedBalance
        );
      });

      it('should transfer Ether to several accounts', async () => {
        const value = utils.toEther(0.1);
        const destinations = accounts.slice(5, 9);

        // sign all transfers
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
      let token: ERC20;
      let erc20Transfer: MultiSigERC20Transfer;

      async function transferERC20(account: Address, amount: AnyNumber) {
        const nonce = await instance.nonce();

        const signatures = await Promise.all(
          owners.map(owner => erc20Transfer.sign(owner, account, amount, nonce))
        );

        return await erc20Transfer.execute(signatures, account, amount);
      }

      beforeEach(async () => {
        token = await TestERC20TokenContract.new({ from: deployer });
        await token.transfer(instance.address, utils.toEther(100));
        erc20Transfer = new MultiSigERC20Transfer(web3, instance, token);
      });

      it('should transfer ERC20 tokens to account', async () => {
        const amount = utils.toEther(10);
        const initialBalance = await token.balanceOf(defaultAccount);
        const expectedBalance = initialBalance.add(amount);

        await transferERC20(defaultAccount, amount);

        assertEtherEqual(
          await token.balanceOf(defaultAccount),
          expectedBalance
        );
      });

      it('should emit Executed event with token transfer data', async () => {
        const amount = utils.toEther(10);
        const nonce = await instance.nonce();

        const tx = await transferERC20(defaultAccount, amount);
        const expectedData = await getData(
          token.transfer,
          defaultAccount,
          amount
        );

        assertExecutedEvent(tx, token.address, nonce, 0, expectedData);
      });

      it('should transfer ERC20 tokens to account repeatedly', async () => {
        const amounts = [1, 3, 5].map(amount => utils.toEther(amount));
        const initialBalance = await token.balanceOf(defaultAccount);
        const amountsSum = amounts.reduce((a, b) => a.add(b), utils.toEther(0));
        const expectedBalance = initialBalance.add(amountsSum);

        for (const amount of amounts) {
          await transferERC20(defaultAccount, amount);
        }

        assertEtherEqual(
          await token.balanceOf(defaultAccount),
          expectedBalance
        );
      });

      it('should transfer ERC20 tokens to several accounts', async () => {
        const amount = utils.toEther(10);
        const destinations = accounts.slice(5, 9);

        // sign all token transfers
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
                  await erc20Transfer.sign(
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
          await erc20Transfer.execute(signatures, destination.account, amount);

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
