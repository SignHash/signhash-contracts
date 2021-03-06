import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  DepositedEvent,
  ERC20,
  ExecutedEvent,
  MultiSig,
  SignHashArtifacts
} from 'signhash';
import { ContractContextDefinition, TransactionResult } from 'truffle';
import { AnyNumber } from 'web3';

import {
  getData,
  MultiSigExecutor,
  Signature,
  TransferCommand,
  TransferERC20Command
} from '../../multisig';
import { Web3Utils } from '../../utils';

import {
  assertEtherEqual,
  assertNumberEqual,
  assertThrowsInvalidOpcode,
  findLastLog
} from '../helpers';
import { MultiSigTestContext } from './context';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const MultiSigContract = artifacts.require('./MultiSig/MultiSig.sol');
const TestERC20TokenContract = artifacts.require('./Test/TestERC20Token.sol');

const utils = new Web3Utils(web3);

contract('MultiSig', accounts => {
  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await MultiSigContract.new([]);
      });
    });
  });

  const ownerSets = [[accounts[2]], accounts.slice(1, 3), accounts.slice(2, 6)];
  ownerSets.map(owners => {
    context(`When wallet has ${owners.length} owners`, () => {
      const ctx = new MultiSigTestContext<MultiSig>(accounts, owners);

      beforeEach(async () => {
        ctx.multisig = await MultiSigContract.new(owners);
      });

      describe('#listOwners', () => testListOwners(ctx));
      describe('#fallback', () => testFallback(ctx));
      describe('#execute', () => testExecute(ctx));
    });
  });
});

export function testListOwners(ctx: MultiSigTestContext<MultiSig>) {
  it('should list owners', async () => {
    assert.deepEqual(await ctx.multisig.listOwners(), ctx.owners);
  });
}

export function testFallback(ctx: MultiSigTestContext<MultiSig>) {
  const defaultAccount = ctx.accounts[9];

  it('should not consume more than 23000 gas', async () => {
    const result = await deposit(
      ctx.multisig,
      utils.toEther(0.1),
      defaultAccount
    );

    assert.isAtMost(result.receipt.gasUsed, 23000);
  });

  it('should increase balance', async () => {
    const value = utils.toEther(1);
    await deposit(ctx.multisig, value, defaultAccount);

    assertEtherEqual(value, await utils.getBalance(ctx.multisig.address));
  });

  it('should emit Deposited event when sent value', async () => {
    const value = utils.toEther(1);
    const tx = await deposit(ctx.multisig, value, defaultAccount);

    const log = findLastLog(tx, 'Deposited');
    assert.isOk(log);

    const event = log.args as DepositedEvent;
    assert.isOk(event);
    assert.equal(event.from, defaultAccount);
    assertEtherEqual(event.value, value);
  });

  it('should not emit Deposited event when not sent value', async () => {
    const tx = await deposit(ctx.multisig, 0, defaultAccount);

    const log = findLastLog(tx, 'Deposited');
    assert.isNotOk(log);
  });
}

export function testExecute(ctx: MultiSigTestContext<MultiSig>) {
  const defaultAccount = ctx.accounts[9];

  let dummyCommand: DummyCommand;

  class DummyCommand {
    private readonly execution: MultiSigExecutor;

    constructor() {
      this.execution = new MultiSigExecutor(web3, ctx.multisig);
    }

    public sign(signer: Address, nonce: Web3.AnyNumber): Signature {
      return this.execution.sign(signer, nonce, defaultAccount, 0, '0x');
    }

    public async execute(signatures: Signature[]): Promise<TransactionResult> {
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
    await deposit(ctx.multisig, utils.toEther(1), defaultAccount);

    dummyCommand = new DummyCommand();
  });

  it('should emit Executed event', async () => {
    const nonce = await ctx.multisig.nonce();
    const signatures = await Promise.all(
      ctx.owners.map(owner => dummyCommand.sign(owner, nonce))
    );
    const tx = await dummyCommand.execute(signatures);

    assertExecutedEvent(tx, defaultAccount, nonce, 0, '0x');
  });

  it('should throw when not signed', async () => {
    await assertThrowsInvalidOpcode(async () => {
      await dummyCommand.execute([]);
    });
  });

  if (ctx.owners.length > 1) {
    ctx.owners.map(async (owner, index) =>
      it(`should throw when signed only by #${index + 1}`, async () => {
        const nonce = await ctx.multisig.nonce();
        const signature = await dummyCommand.sign(owner, nonce);

        await assertThrowsInvalidOpcode(async () => {
          await dummyCommand.execute([signature]);
        });
      })
    );
  }

  it('should throw when signed by other accounts', async () => {
    const strangers = ctx.accounts.slice(4, 4 + ctx.owners.length);
    assert.notDeepEqual(strangers, ctx.owners);

    const nonce = await ctx.multisig.nonce();
    const signatures = await Promise.all(
      strangers.map(owner => dummyCommand.sign(owner, nonce))
    );

    await assertThrowsInvalidOpcode(async () => {
      await dummyCommand.execute(signatures);
    });
  });

  if (ctx.owners.length > 1) {
    it('should throw when signed by owners in wrong order', async () => {
      const reversed = ctx.owners.reverse();
      const nonce = await ctx.multisig.nonce();
      const signatures = await Promise.all(
        reversed.map(owner => dummyCommand.sign(owner, nonce))
      );

      await assertThrowsInvalidOpcode(async () => {
        await dummyCommand.execute(signatures);
      });
    });
  }

  it('should throw on replay attack', async () => {
    const nonce = await ctx.multisig.nonce();
    const signatures = await Promise.all(
      ctx.owners.map(owner => dummyCommand.sign(owner, nonce))
    );

    await dummyCommand.execute(signatures);

    await assertThrowsInvalidOpcode(async () => {
      await dummyCommand.execute(signatures);
    });
  });

  describe('transfer Ether', () => {
    let transferCommand: TransferCommand;

    async function transfer(account: Address, value: AnyNumber) {
      const nonce = await ctx.multisig.nonce();
      const signatures = ctx.owners.map(owner =>
        transferCommand.sign(owner, nonce, account, value)
      );

      return await transferCommand.execute(signatures, account, value);
    }

    beforeEach(async () => {
      await deposit(ctx.multisig, utils.toEther(1), defaultAccount);

      transferCommand = new TransferCommand(web3, ctx.multisig);
    });

    it('should transfer Ether to account', async () => {
      const value = utils.toEther(0.1);
      const initialBalance = await utils.getBalance(defaultAccount);
      const expectedBalance = initialBalance.add(value);

      await transfer(defaultAccount, value);

      assertEtherEqual(await utils.getBalance(defaultAccount), expectedBalance);
    });

    it('should emit Executed event', async () => {
      const value = utils.toEther(0.1);
      const nonce = await ctx.multisig.nonce();

      const tx = await transfer(defaultAccount, value);
      assertExecutedEvent(tx, defaultAccount, nonce, value, '0x');
    });

    it('should transfer Ether to account repeatedly', async () => {
      const values = [0.1, 0.3, 0.5].map(value => utils.toEther(value));
      const initialBalance = await utils.getBalance(defaultAccount);
      const valuesSum = values.reduce((a, b) => a.add(b), utils.toEther(0));
      const expectedBalance = initialBalance.add(valuesSum);

      for (const value of values) {
        await transfer(defaultAccount, value);
      }

      assertEtherEqual(await utils.getBalance(defaultAccount), expectedBalance);
    });

    it('should transfer Ether to several accounts', async () => {
      const value = utils.toEther(0.1);
      const destinations = ctx.accounts.slice(5, 9);

      // sign all transfers
      const nonce = await ctx.multisig.nonce();
      const specifications = await Promise.all(
        destinations.map(async (account, index) => ({
          destination: {
            account,
            initialBalance: await utils.getBalance(account)
          },
          signatures: ctx.owners.map(owner =>
            transferCommand.sign(owner, nonce.add(index), account, value)
          )
        }))
      );

      // execute all transfers
      for (const { signatures, destination } of specifications) {
        await transferCommand.execute(signatures, destination.account, value);

        const expectedBalance = destination.initialBalance.add(value);
        assertEtherEqual(
          await utils.getBalance(destination.account),
          expectedBalance
        );
      }
    });

    it('should throw on nonce reuse', async () => {
      const nonce = await ctx.multisig.nonce();
      const value = utils.toEther(0.1);
      const tx2Destination = defaultAccount;
      const tx2Value = utils.toEther(0.2);

      const tx1Signatures = ctx.owners.map(owner =>
        transferCommand.sign(owner, nonce, defaultAccount, value)
      );

      const tx2Signatures = ctx.owners.map(owner =>
        transferCommand.sign(
          owner,
          nonce, // NOTICE: the same nonce as previously
          tx2Destination,
          tx2Value
        )
      );

      await transferCommand.execute(tx1Signatures, defaultAccount, value);

      await assertThrowsInvalidOpcode(async () => {
        await transferCommand.execute(tx2Signatures, tx2Destination, tx2Value);
      });
    });
  });

  describe('transfer ERC20', () => {
    let token: ERC20;
    let transferERC20Command: TransferERC20Command;

    async function transferERC20(account: Address, amount: AnyNumber) {
      const nonce = await ctx.multisig.nonce();

      const signatures = await Promise.all(
        ctx.owners.map(owner =>
          transferERC20Command.sign(owner, nonce, account, amount)
        )
      );

      return await transferERC20Command.execute(signatures, account, amount);
    }

    beforeEach(async () => {
      token = await TestERC20TokenContract.new();
      await token.transfer(ctx.multisig.address, utils.toEther(100));
      transferERC20Command = new TransferERC20Command(
        web3,
        ctx.multisig,
        token
      );
    });

    it('should transfer ERC20 tokens to account', async () => {
      const amount = utils.toEther(10);
      const initialBalance = await token.balanceOf(defaultAccount);
      const expectedBalance = initialBalance.add(amount);

      await transferERC20(defaultAccount, amount);

      assertEtherEqual(await token.balanceOf(defaultAccount), expectedBalance);
    });

    it('should emit Executed event', async () => {
      const amount = utils.toEther(10);
      const nonce = await ctx.multisig.nonce();

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

      assertEtherEqual(await token.balanceOf(defaultAccount), expectedBalance);
    });

    it('should transfer ERC20 tokens to several accounts', async () => {
      const amount = utils.toEther(10);
      const destinations = ctx.accounts.slice(5, 9);

      // sign all token transfers
      const nonce = await ctx.multisig.nonce();
      const specifications = await Promise.all(
        destinations.map(async (account, index) => ({
          destination: {
            account,
            initialTokenBalance: await token.balanceOf(account)
          },
          signatures: await Promise.all(
            ctx.owners.map(owner =>
              transferERC20Command.sign(
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

        const expectedBalance = destination.initialTokenBalance.add(amount);
        assertEtherEqual(
          await token.balanceOf(destination.account),
          expectedBalance
        );
      }
    });

    it('should throw on nonce reuse', async () => {
      const nonce = await ctx.multisig.nonce();
      const amount = utils.toEther(1);
      const tx2Destination = ctx.accounts[6];
      const tx2Amount = utils.toEther(2);

      const tx1Signatures = await Promise.all(
        ctx.owners.map(owner =>
          transferERC20Command.sign(owner, nonce, defaultAccount, amount)
        )
      );

      const tx2Signatures = await Promise.all(
        ctx.owners.map(owner =>
          transferERC20Command.sign(
            owner,
            nonce, // NOTICE: the same nonce as previously
            tx2Destination,
            tx2Amount
          )
        )
      );

      await transferERC20Command.execute(tx1Signatures, defaultAccount, amount);

      await assertThrowsInvalidOpcode(async () => {
        await transferERC20Command.execute(
          tx2Signatures,
          tx2Destination,
          tx2Amount
        );
      });
    });
  });
}

async function deposit(multisig: MultiSig, value: AnyNumber, from: Address) {
  return await multisig.sendTransaction({
    from,
    to: multisig.address,
    value
  });
}
