export class YieldInterrupt extends Error {
  constructor(public readonly waitTicks: number) {
    super('AliScript execution yielded');
    this.name = 'YieldInterrupt';
  }
}

export function isYieldInterrupt(err: unknown): err is YieldInterrupt {
  return err instanceof YieldInterrupt;
}
