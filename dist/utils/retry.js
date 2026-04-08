function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export async function withRetry(fn, { retries = 2, minDelayMs = 300, factor = 2, shouldRetry = () => true } = {}) {
    let attempts = 0;
    while (true) {
        try {
            return await fn(attempts + 1);
        }
        catch (error) {
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
