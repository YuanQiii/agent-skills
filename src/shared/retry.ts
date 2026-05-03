import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number,
): Promise<T> {
  const config = getConfig();
  const retries = Math.max(1, maxRetries ?? config.maxRetries);
  const delay = baseDelay ?? config.retryBaseDelayMs;

  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        const waitTime = delay * Math.pow(2, i);
        logger.warn({ attempt: i + 1, waitMs: waitTime }, '重试失败，稍后重试');
        await sleep(waitTime);
      }
    }
  }
  throw lastError;
}
