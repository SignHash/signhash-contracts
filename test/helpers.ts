export async function assertThrowsInvalidOpcode(func: () => void) {
  try {
    await func();
  } catch (error) {
    assertInvalidOpcode(error);
    return;
  }
  assert.fail({}, {}, 'Should have thrown');
}

export function assertInvalidOpcode(error: { message: string }) {
  if (error && error.message) {
    if (error.message.search('invalid opcode') === -1) {
      assert.fail(error, {}, 'Invalid opcode error must be returned, got: ' + error.message);
    }
  } else {
    assert.fail(error, {}, 'Expected to throw an error');
  }
}
