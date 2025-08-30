import { v4 as uuidv4 } from 'uuid';

export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'auth',
  AUTHORIZATION = 'authz',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  EXTERNAL_API = 'external_api',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict'
}

export interface AppErrorOptions {
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly id: string;
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly requestId?: string;
  public readonly context?: Record<string, unknown>;
  public readonly details?: unknown;
  public readonly stack?: string;

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    options: AppErrorOptions = {}
  ) {
    super(message);
    
    this.id = uuidv4();
    this.type = type;
    this.code = code;
    this.message = message;
    this.timestamp = new Date();
    this.userId = options.userId;
    this.requestId = options.requestId;
    this.context = options.context;
    this.details = options.details;

    // Capture stack trace first
    Error.captureStackTrace?.(this, AppError);
    
    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development') {
      this.stack = super.stack || this.stack;
    } else {
      this.stack = undefined;
    }

    // Set proper prototype for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      userId: this.userId,
      requestId: this.requestId,
      context: this.context,
      details: this.details,
      stack: this.stack
    };
  }
}