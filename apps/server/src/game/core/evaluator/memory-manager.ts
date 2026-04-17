export class MemoryManager {
    private memories: Record<string, Record<string, any>> = {};

    // Max variables per robot
    private readonly MAX_KEYS = 50;
    // Max string value length
    private readonly MAX_STRING_LENGTH = 200;
    // Max numeric value
    private readonly MAX_NUMBER = 1_000_000;

    initialize(robotId: string): void {
        this.memories[robotId] = {};
    }

    clearAll(): void {
        this.memories = {};
    }

    clearForRobot(robotId: string): void {
        delete this.memories[robotId];
    }

    getMemory(robotId: string): Record<string, any> {
        if (!this.memories[robotId]) {
            this.memories[robotId] = {};
        }
        return this.memories[robotId];
    }

    set(robotId: string, key: string, value: any): void {
        const mem = this.getMemory(robotId);

        // limit the number of variables
        if (!(key in mem) && Object.keys(mem).length >= this.MAX_KEYS) {
            throw new Error(`[SANDBOX] Memory limit reached for robot ${robotId}`);
        }

        // sanitize the value
        mem[key] = this.sanitizeValue(value);
    }

    get(robotId: string, key: string): any {
        return this.getMemory(robotId)[key];
    }

    has(robotId: string, key: string): boolean {
        return key in this.getMemory(robotId);
    }

    private sanitizeValue(value: any): any {
        if (typeof value === 'string') {
            return value.slice(0, this.MAX_STRING_LENGTH);
        }
        if (typeof value === 'number') {
            if (!isFinite(value)) return 0;
            return Math.max(-this.MAX_NUMBER, Math.min(this.MAX_NUMBER, value));
        }
        if (typeof value === 'boolean') return value;
        // Any other type is not allowed
        return undefined;
    }
}