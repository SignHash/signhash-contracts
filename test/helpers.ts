import { findLast, propEq } from 'ramda';

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
      assert.fail(error, {}, 'Expected Invalid Opcode error, instead got: ' + error.message);
    }
  } else {
    assert.fail(error, {}, 'Expected Invalid Opcode error');
  }
}

export function findLastLog(trans: TransactionResult, event: string): TransactionLog {
  return findLast(propEq('event', event))(trans.logs);
}
