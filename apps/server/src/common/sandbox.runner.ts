import { VM } from 'vm2';

export class SandboxRunner {
  execute(script: string, context: object, timeout: number = 50) {
    const vm = new VM({
      timeout,
      sandbox: {
        ...context,
        move: (direction: string) => ({ action: 'move', payload: direction }),
        fire: () => ({ action: 'fire' }),
        scan: () => ({ action: 'scan' }),
      },
      // Restrict access to global objects
      allowAsync: false,
      eval: false,
      wasm: false,
      // builtin: [], // Disallow all built-in modules
      // Disable `require` to prevent module loading
      // This is implicit with `builtin: []` for modules, but good to be explicit for direct `require` calls
      // require: false, // This option is not directly supported by vm2 in this manner
      // Restrict access to global objects by only exposing what's in sandbox
      // The `global` option is deprecated. Control global access via `sandbox`
    });

    try {
      const result = vm.run(script);
      return result;
    } catch (error: any) {
      if (error.message.includes('Script execution timed out')) {
        throw new Error('Script execution exceeded the time limit.');
      }
      // Generic error for other sandbox issues
      throw new Error(`Sandbox error: ${error.message}`);
    }
  }
}
