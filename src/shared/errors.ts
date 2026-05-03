export class SyncError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SyncError';
  }
}

export class GitAuthError extends SyncError {
  constructor(message = 'Git 认证失败', options?: ErrorOptions) {
    super(message, options);
    this.name = 'GitAuthError';
  }
}

export class TranslationError extends SyncError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TranslationError';
  }
}

export class ConfigError extends SyncError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConfigError';
  }
}

export function isGitAuthError(error: unknown): boolean {
  return error instanceof GitAuthError ||
    (error instanceof Error && error.message.includes('Authentication failed'));
}
