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
  ExecuteCommand,
  getData,
  SetOwnersCommand,
  Signature,
  TransferCommand,
  TransferERC20Command
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
  const ownerSets = [[accounts[2]], accounts.slice(1, 3), accounts.slice(2, 6)];
  const utils = new Web3Utils(web3);

  let instance: TipsWallet;

  async function tip(value: AnyNumber, from: Address = defaultAccount) {
    return await instance.sendTransaction({
      from,
      to: instance.address,
      value
    });
  }

  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([], { from: deployer });
      });
    });
  });

  ownerSets.map(owners => {
    context(`When ${owners.length} owners`, () => {
      beforeEach(async () => {
        instance = await TipsWalletContract.new(owners, { from: deployer });
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

        it('should not emit Deposit event when value is 0', async () => {
          const trans = await tip(0);
          const log = findLastLog(trans, 'Deposit');
          assert.isNotOk(log);
        });
      });

      describe('#ctor', () => {
        it('should set owners', async () => {
          assert.deepEqual(await instance.owners(), owners);
        });
      });

      describe('#execute', () => {
        let dummyCommand: DummyCommand;

        class DummyCommand {
          private readonly execution: ExecuteCommand;

          constructor() {
            this.execution = new ExecuteCommand(web3, instance);
          }

          public sign(signer: Address, nonce: Web3.AnyNumber): Signature {
            return this.execution.sign(signer, nonce, defaultAccount, 0, '0x');
          }

          public async execute(
            signatures: Signature[]
          ): Promise<TransactionResult> {
            return this.execution.execute(signatures, defaultAccount, 0, '0x');
          }
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

          dummyCommand = new DummyCommand();
        });

        it('should emit Executed event', async () => {
          const nonce = await instance.nonce();
          const signatures = await Promise.all(
            owners.map(async owner => dummyCommand.sign(owner, nonce))
          );
          const tx = await dummyCommand.execute(signatures);

          assertExecutedEvent(tx, defaultAccount, nonce, 0, '0x');
        });

        it('should throw when not signed', async () => {
          await assertThrowsInvalidOpcode(async () => {
            await dummyCommand.execute([]);
          });
        });

        if (owners.length > 1) {
          owners.map(async (owner, index) =>
            it(`should throw when signed only by #${index + 1}`, async () => {
              const nonce = await instance.nonce();
              const signature = await dummyCommand.sign(owner, nonce);

              await assertThrowsInvalidOpcode(async () => {
                await dummyCommand.execute([signature]);
              });
            })
          );
        }

        it('should throw when signed by other accounts', async () => {
          const strangers = accounts.slice(4, 4 + owners.length);
          assert.notDeepEqual(strangers, owners);

          const nonce = await instance.nonce();
          const signatures = await Promise.all(
            strangers.map(async owner => dummyCommand.sign(owner, nonce))
          );

          await assertThrowsInvalidOpcode(async () => {
            await dummyCommand.execute(signatures);
          });
        });

        if (owners.length > 1) {
          it('should throw when signed by owners in wrong order', async () => {
            const reversed = owners.reverse();
            const nonce = await instance.nonce();
            const signatures = await Promise.all(
              reversed.map(async owner => dummyCommand.sign(owner, nonce))
            );

            await assertThrowsInvalidOpcode(async () => {
              await dummyCommand.execute(signatures);
            });
          });
        }

        describe('transfer Ether', () => {
          let transferCommand: TransferCommand;

          async function transferEther(account: Address, value: AnyNumber) {
            const nonce = await instance.nonce();
            const signatures = owners.map(owner =>
              transferCommand.sign(owner, nonce, account, value)
            );

            return await transferCommand.execute(signatures, account, value);
          }

          beforeEach(async () => {
            await tip(utils.toEther(1));

            transferCommand = new TransferCommand(web3, instance);
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

          it('should emit Executed event', async () => {
            const value = utils.toEther(0.1);
            const nonce = await instance.nonce();

            const tx = await transferEther(defaultAccount, value);
            assertExecutedEvent(tx, defaultAccount, nonce, value, '0x');
          });

          it('should transfer Ether to account repeatedly', async () => {
            const values = [0.1, 0.3, 0.5].map(value => utils.toEther(value));
            const initialBalance = await utils.getBalance(defaultAccount);
            const valuesSum = values.reduce(
              (a, b) => a.add(b),
              utils.toEther(0)
            );
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
                  transferCommand.sign(owner, nonce.add(index), account, value)
                )
              }))
            );

            // execute all transfers
            for (const { signatures, destination } of specifications) {
              await transferCommand.execute(
                signatures,
                destination.account,
                value
              );

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
          let transferERC20Command: TransferERC20Command;

          async function transferERC20(account: Address, amount: AnyNumber) {
            const nonce = await instance.nonce();

            const signatures = await Promise.all(
              owners.map(owner =>
                transferERC20Command.sign(owner, nonce, account, amount)
              )
            );

            return await transferERC20Command.execute(
              signatures,
              account,
              amount
            );
          }

          beforeEach(async () => {
            token = await TestERC20TokenContract.new({ from: deployer });
            await token.transfer(instance.address, utils.toEther(100));
            transferERC20Command = new TransferERC20Command(
              web3,
              instance,
              token
            );
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

          it('should emit Executed event', async () => {
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
            const amountsSum = amounts.reduce(
              (a, b) => a.add(b),
              utils.toEther(0)
            );
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
                      await transferERC20Command.sign(
                        owner,
                        nonce.add(index),
                        account,
                        amount
                      )
                  )
                )
              }))
            );

            // execute all token transfers
            for (const { signatures, destination } of specifications) {
              await transferERC20Command.execute(
                signatures,
                destination.account,
                amount
              );

              const expectedBalance = destination.initialTokenBalance.add(
                amount
              );
              assertEtherEqual(
                await token.balanceOf(destination.account),
                expectedBalance
              );
            }
          });
        });
      });

      describe('#setOwners', () => {
        let setOwnersCommand: SetOwnersCommand;

        async function setOwners(newOwners: Address[]) {
          const nonce = await instance.nonce();

          const signatures = await Promise.all(
            owners.map(owner => setOwnersCommand.sign(owner, nonce, newOwners))
          );

          return await setOwnersCommand.execute(signatures, newOwners);
        }

        beforeEach(async () => {
          setOwnersCommand = new SetOwnersCommand(web3, instance);
        });

        it('should set a single owner', async () => {
          const newOwners = [accounts[6]];
          await setOwners(newOwners);

          assert.deepEqual(await instance.owners(), newOwners);
        });

        it('should set several owners', async () => {
          const newOwners = accounts.slice(6, 10);
          await setOwners(newOwners);

          assert.deepEqual(await instance.owners(), newOwners);
        });

        it('should not allow empty list of owners', async () => {
          await assertThrowsInvalidOpcode(async () => {
            await setOwners([]);
          });
        });

        it('should throw when not signed', async () => {
          const newOwners = accounts.slice(6, 10);
          await assertThrowsInvalidOpcode(async () => {
            await setOwnersCommand.execute([], newOwners);
          });
        });

        if (owners.length > 1) {
          owners.map(async (owner, index) =>
            it(`should throw when signed only by #${index + 1}`, async () => {
              const newOwners = accounts.slice(6, 10);
              const nonce = await instance.nonce();
              const signature = await setOwnersCommand.sign(
                owner,
                nonce,
                newOwners
              );

              await assertThrowsInvalidOpcode(async () => {
                await setOwnersCommand.execute([signature], newOwners);
              });
            })
          );
        }

        it('should throw when signed by other accounts', async () => {
          const newOwners = accounts.slice(6, 10);
          const strangers = accounts.slice(4, 4 + owners.length);
          const nonce = await instance.nonce();
          const signatures = await Promise.all(
            strangers.map(async owner =>
              setOwnersCommand.sign(owner, nonce, newOwners)
            )
          );

          await assertThrowsInvalidOpcode(async () => {
            await setOwnersCommand.execute(signatures, newOwners);
          });
        });

        if (owners.length > 1) {
          it('should throw when signed by owners in wrong order', async () => {
            const newOwners = accounts.slice(6, 10);
            const reversed = owners.reverse();
            const nonce = await instance.nonce();
            const signatures = await Promise.all(
              reversed.map(async owner =>
                setOwnersCommand.sign(owner, nonce, newOwners)
              )
            );

            await assertThrowsInvalidOpcode(async () => {
              await setOwnersCommand.execute(signatures, newOwners);
            });
          });
        }
      });
    });
  });
});
