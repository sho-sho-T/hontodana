/**
 * 書籍関連のカスタムエラークラス
 */

export class BookError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'BookError'
  }
}

export class ValidationError extends BookError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends BookError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends BookError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends BookError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404)
    this.name = 'NotFoundError'
  }
}

export class DuplicateError extends BookError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'DUPLICATE_ERROR', 409)
    this.name = 'DuplicateError'
  }
}

export class DatabaseError extends BookError {
  constructor(message: string = 'Database error occurred') {
    super(message, 'DATABASE_ERROR', 500)
    this.name = 'DatabaseError'
  }
}

/**
 * エラーをServer Action用のレスポンスに変換
 */
export function errorToResponse(error: unknown): { error: string } {
  if (error instanceof BookError) {
    return { error: error.message }
  }
  
  if (error instanceof Error) {
    // 本番環境では詳細なエラーメッセージを隠す
    if (process.env.NODE_ENV === 'production') {
      return { error: 'An unexpected error occurred' }
    }
    return { error: error.message }
  }
  
  return { error: 'An unexpected error occurred' }
}