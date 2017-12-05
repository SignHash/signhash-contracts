import * as Web3 from 'web3';

import { SignHashArtifacts, TipsWallet } from 'signhash';
import { ContractContextDefinition } from 'truffle';

import { assertThrowsInvalidOpcode } from './helpers';

declare const web3: Web3;
declare const artifacts: SignHashArtifacts;
declare const contract: ContractContextDefinition;

const TipsWalletContract = artifacts.require('./TipsWallet.sol');

contract('TipsWallet', accounts => {
  const deployer = accounts[0];

  describe('#ctor', () => {
    it('should not allow empty list of owners', async () => {
      await assertThrowsInvalidOpcode(async () => {
        await TipsWalletContract.new([], { from: deployer });
      });
    });
  });
});
