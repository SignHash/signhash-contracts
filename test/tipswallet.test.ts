import { assert } from 'chai';

import * as Web3 from 'web3';

import { SignHashArtifacts, TipsWallet } from 'signhash';
import { ContractContextDefinition } from 'truffle';

import { assertThrowsInvalidOpcode } from './helpers';
import { MultiSigTestContext } from './MultiSig/context';
import {
  testCancelRecovery,
  testConfirmRecovery,
  testStartRecovery
} from './MultiSig/recoverablemultisig.test';
import { testTransferOwnership } from './MultiSig/transferablemultisig.test';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const TipsWalletContract = artifacts.require('./TipsWallet.sol');

contract('TipsWallet', accounts => {
  const deployer = accounts[0];

  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([], 1000, { from: deployer });
      });
    });
  });

  const ownerSets = [[accounts[2]], accounts.slice(1, 3), accounts.slice(2, 6)];
  ownerSets.map(owners => {
    context(`When wallet has ${owners.length} owners`, () => {
      const ctx = new MultiSigTestContext<TipsWallet>(accounts, owners);

      beforeEach(async () => {
        const recoveryConfirmations = 100;
        ctx.instance = await TipsWalletContract.new(
          owners,
          recoveryConfirmations
        );
      });

      describe('#ctor', () => {
        it('should set owners', async () => {
          assert.deepEqual(await ctx.instance.listOwners(), owners);
        });
      });

      describe('#transferOwnership', () => testTransferOwnership(ctx));
      describe('#startRecovery', () => testStartRecovery(ctx));
      describe('#cancelRecovery', () => testCancelRecovery(ctx));
      describe('#confirmRecovery', () => testConfirmRecovery(ctx));
    });
  });
});
