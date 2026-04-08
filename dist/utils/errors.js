export class AppError extends Error {
    statusCode;
    code;
    details;
    retryable;
    constructor(message, options = {}) {
        const { statusCode = 500, code = "INTERNAL_SERVER_ERROR", details, retryable } = options;
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.retryable = Boolean(retryable);
    }
}
export function isAppError(error) {
    return error instanceof AppError;
}
