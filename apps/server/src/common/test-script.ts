import { SandboxRunner } from './sandbox.runner';

function runTest() {
  const runner = new SandboxRunner();
  const testScript = `
    function turn() {
      return move("forward");
    }
    turn();
  `;

  try {
    const result = runner.execute(testScript, {});
    console.log('Test Script Result:', result);
    if (result && result.action === 'move' && result.payload === 'forward') {
      console.log('Test passed: move("forward") returned the correct action.');
    } else {
      console.log('Test failed: Unexpected result.', result);
    }
  } catch (error: any) {
    console.error('Test failed with error:', error.message);
  }

  // Test for infinite loop
  const infiniteLoopScript = `
    while(true) {}
  `;
  try {
    console.log('\nTesting infinite loop...');
    runner.execute(infiniteLoopScript, {});
    console.log('Test failed: Infinite loop did not time out.');
  } catch (error: any) {
    if (error.message.includes('Script execution exceeded the time limit.')) {
      console.log('Test passed: Infinite loop timed out as expected.');
    } else {
      console.log(
        'Test failed: Unexpected error for infinite loop.',
        error.message,
      );
    }
  }
}

runTest();
