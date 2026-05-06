/** Hard sandbox caps for user-authored AliScript runtime values. */
export const ALISCRIPT_MAX_COLLECTION_ELEMENTS = 100;
export const ALISCRIPT_MAX_STRING_LENGTH = 255;

const FORBIDDEN_PROPERTY_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class AliScriptMemoryLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AliScriptMemoryLimitError';
  }
}

export class AliScriptSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AliScriptSecurityError';
  }
}

export function isForbiddenAliScriptPropertyKey(key: unknown): boolean {
  return typeof key === 'string' && FORBIDDEN_PROPERTY_KEYS.has(key);
}

export function assertSafeAliScriptPropertyKey(key: unknown): asserts key is string {
  if (typeof key !== 'string' || isForbiddenAliScriptPropertyKey(key)) {
    throw new AliScriptSecurityError(`Forbidden AliScript dictionary key: ${String(key)}`);
  }
}

export function assertAliScriptCollectionCanGrow(currentSize: number): void {
  if (currentSize >= ALISCRIPT_MAX_COLLECTION_ELEMENTS) {
    throw new AliScriptMemoryLimitError(
      `Memory Limit Exceeded: AliScript arrays/dictionaries are capped at ${ALISCRIPT_MAX_COLLECTION_ELEMENTS} elements`,
    );
  }
}

export function assertAliScriptCollectionSize(size: number): void {
  if (size > ALISCRIPT_MAX_COLLECTION_ELEMENTS) {
    throw new AliScriptMemoryLimitError(
      `Memory Limit Exceeded: AliScript arrays/dictionaries are capped at ${ALISCRIPT_MAX_COLLECTION_ELEMENTS} elements`,
    );
  }
}

export function enforceAliScriptStringLimit(value: string): string {
  if (value.length > ALISCRIPT_MAX_STRING_LENGTH) {
    throw new AliScriptMemoryLimitError(
      `Memory Limit Exceeded: AliScript strings are capped at ${ALISCRIPT_MAX_STRING_LENGTH} characters`,
    );
  }
  return value;
}

export function createAliScriptDictionary(): Record<string, unknown> {
  return Object.create(null) as Record<string, unknown>;
}

export function safeGetAliScriptProperty(target: Record<string, unknown>, key: string): unknown {
  assertSafeAliScriptPropertyKey(key);
  return target[key];
}

export function safeSetAliScriptProperty(target: Record<string, unknown>, key: string, value: unknown): void {
  assertSafeAliScriptPropertyKey(key);
  if (!Object.prototype.hasOwnProperty.call(target, key)) {
    assertAliScriptCollectionCanGrow(Object.keys(target).length);
  }
  target[key] = value;
}
