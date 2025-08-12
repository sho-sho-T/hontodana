// カスタムエラークラス
export class GoogleBooksError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
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
  constructor(message: string = 'レート制限に達しました') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'ネットワークエラーが発生しました') {
    super(message)
    this.name = 'NetworkError'
  }
}