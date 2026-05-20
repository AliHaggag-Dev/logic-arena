"use client";

const RATE_LIMIT_STATUS = 429;
const ADMIN_RETRY_DELAY_MS = 2_000;

export const ADMIN_STAGGER_DELAY_MS = 500;

function isRateLimitError(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === RATE_LIMIT_STATUS;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function requestAdminWithRetry<TResult>(request: () => Promise<TResult>): Promise<TResult> {
  try {
    return await request();
  } catch (error: unknown) {
    if (!isRateLimitError(error)) {
      throw error;
    }

    await delay(ADMIN_RETRY_DELAY_MS);
    return request();
  }
}
