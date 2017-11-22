import * as Web3 from 'web3';

import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';
import { findLast, propEq } from 'ramda';
import { TransactionLog, TransactionResult } from 'truffle';

declare const web3: Web3;

const ETH_DECIMALS = 18;
const DEFAULT_ACCEPTABLE_ERROR = web3.toWei(5, 'finney');

export async function assertThrowsInvalidOpcode(func: () => void) {
  try {
    await func();
  } catch (error) {
    assertInvalidOpcode(error);
    return;
  }
  assert.fail({}, {}, 'Should have thrown Invalid Opcode');
}

export function assertInvalidOpcode(error: { message: string }) {
  if (error && error.message) {
    if (error.message.search('invalid opcode') === -1) {
      assert.fail(
        error,
        {},
        'Expected Invalid Opcode error, instead got: ' + error.message
      );
    }
  } else {
    assert.fail(error, {}, 'Expected Invalid Opcode error');
  }
}

export function assertNumberEqual(
  actual: number | string | BigNumber,
  expect: number | string | BigNumber,
  decimals: number = 0
) {
  const actualNum = new BigNumber(actual);
  const expectNum = new BigNumber(expect);

  if (!actualNum.eq(expectNum)) {
    const div = decimals ? Math.pow(10, decimals) : 1;
    assert.fail(
      actualNum.toFixed(),
      expectNum.toFixed(),
      `${actualNum.div(div).toFixed()} == ${expectNum.div(div).toFixed()}`,
      '=='
    );
  }
}

export function assertEtherEqual(actual: any, expect: any) {
  return assertNumberEqual(actual, expect, ETH_DECIMALS);
}

export function assertNumberAlmostEqual(
  actual: number | string | BigNumber,
  expect: number | string | BigNumber,
  epsilon: number | string | BigNumber,
  decimals: number
) {
  const actualNum = new BigNumber(actual);
  const expectNum = new BigNumber(expect);
  const epsilonNum = new BigNumber(epsilon);

  if (
    actualNum.lessThan(expectNum.sub(epsilonNum)) ||
    actualNum.greaterThan(expectNum.add(epsilonNum))
  ) {
    const div = decimals ? Math.pow(10, decimals) : 1;
    assert.fail(
      actualNum.toFixed(),
      expectNum.toFixed(),
      `${actualNum.div(div).toFixed()} == ${expectNum
        .div(div)
        .toFixed()} (precision ${epsilonNum.div(div).toFixed()})`,
      '=='
    );
  }
}

export function assertEtherAlmostEqual(
  actual: number | string | BigNumber,
  expect: number | string | BigNumber,
  epsilon?: number | string | BigNumber
) {
  epsilon = epsilon || DEFAULT_ACCEPTABLE_ERROR;

  return assertNumberAlmostEqual(actual, expect, epsilon, ETH_DECIMALS);
}

export function findLastLog(
  trans: TransactionResult,
  event: string
): TransactionLog {
  return findLast(propEq('event', event))(trans.logs);
}
