function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  factor?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function withRetry(
  fn: (attempt: number) => Promise<unknown>,
  { retries = 2, minDelayMs = 300, factor = 2, shouldRetry = () => true }: RetryOptions = {}
) {
  let attempts = 0;
  while (true) {
    try {
      return await fn(attempts + 1);
    } catch (error) {
      const exhausted = attempts >= retries;
      const retryAllowed = shouldRetry(error, attempts + 1);

      if (exhausted || !retryAllowed) {
        throw error;
      }

      const waitMs = minDelayMs * factor ** attempts;
      attempts += 1;
      await sleep(waitMs);
    }
  }
}
