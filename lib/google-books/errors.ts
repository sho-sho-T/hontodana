// カスタムエラークラス
export class GoogleBooksError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'GoogleBooksError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends Error {
  constructor(message = 'レート制限に達しました') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'ネットワークエラーが発生しました') {
    super(message)
    this.name = 'NetworkError'
  }
}