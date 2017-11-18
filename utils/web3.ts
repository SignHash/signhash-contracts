import * as Web3 from 'web3';

import { BigNumber } from 'bignumber.js';
import { TxData } from 'web3';

import { promisify } from './common';

export function toEther(web3: Web3, num: number | string) {
  return web3.toWei(num, 'ether');
}

export function getBalance(web3: Web3, account: Address) {
  return promisify<BigNumber>(cb => web3.eth.getBalance(account, cb));
}
