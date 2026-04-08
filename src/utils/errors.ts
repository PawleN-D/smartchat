export interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  details?: unknown;
  retryable?: boolean;
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  retryable: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    const { statusCode = 500, code = "INTERNAL_SERVER_ERROR", details, retryable } =
      options;
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.retryable = Boolean(retryable);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
