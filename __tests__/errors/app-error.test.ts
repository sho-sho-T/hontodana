import { AppError, ErrorType } from '@/lib/errors/app-error';

describe('AppError', () => {
  test('should create error with required fields', () => {
    // Given
    const errorType = ErrorType.VALIDATION;
    const code = 'INVALID_INPUT';
    const message = 'Invalid input provided';
    
    // When  
    const error = new AppError(errorType, code, message);
    
    // Then
    expect(error.id).toBeDefined();
    expect(error.type).toBe(errorType);
    expect(error.code).toBe(code);  
    expect(error.message).toBe(message);
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.userId).toBeUndefined();
    expect(error.requestId).toBeUndefined();
  });

  test('should include metadata when provided', () => {
    // Given
    const context = { field: 'email', value: 'invalid-email' };
    
    // When
    const error = new AppError(
      ErrorType.VALIDATION, 
      'INVALID_EMAIL', 
      'Invalid email format',
      { context }
    );
    
    // Then
    expect(error.context).toEqual(context);
  });

  test('should capture stack trace in development', () => {
    // Given
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // When
    const error = new AppError(ErrorType.INTERNAL, 'DEV_ERROR', 'Dev error');
    
    // Then
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    
    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });

  test('should not include stack trace in production', () => {
    // Given
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // When
    const error = new AppError(ErrorType.INTERNAL, 'PROD_ERROR', 'Prod error');
    
    // Then
    expect(error.stack).toBeUndefined();
    
    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });

  test('should include user and request IDs when provided', () => {
    // Given
    const userId = 'user-123';
    const requestId = 'req-456';
    
    // When
    const error = new AppError(
      ErrorType.AUTHENTICATION,
      'AUTH_FAILED',
      'Authentication failed',
      { userId, requestId }
    );
    
    // Then
    expect(error.userId).toBe(userId);
    expect(error.requestId).toBe(requestId);
  });

  test('should serialize to JSON correctly', () => {
    // Given
    const error = new AppError(
      ErrorType.NETWORK,
      'CONNECTION_FAILED',
      'Network connection failed',
      { context: { url: 'https://api.example.com' } }
    );
    
    // When
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);
    
    // Then
    expect(parsed.id).toBeDefined();
    expect(parsed.type).toBe(ErrorType.NETWORK);
    expect(parsed.code).toBe('CONNECTION_FAILED');
    expect(parsed.message).toBe('Network connection failed');
    expect(parsed.context).toEqual({ url: 'https://api.example.com' });
  });
});

describe('ErrorType', () => {
  test('should have all required error types', () => {
    // Then
    expect(ErrorType.VALIDATION).toBe('validation');
    expect(ErrorType.NETWORK).toBe('network');
    expect(ErrorType.DATABASE).toBe('database');
    expect(ErrorType.AUTHENTICATION).toBe('auth');
    expect(ErrorType.AUTHORIZATION).toBe('authz');
    expect(ErrorType.RATE_LIMIT).toBe('rate_limit');
    expect(ErrorType.INTERNAL).toBe('internal');
    expect(ErrorType.EXTERNAL_API).toBe('external_api');
    expect(ErrorType.NOT_FOUND).toBe('not_found');
    expect(ErrorType.CONFLICT).toBe('conflict');
  });
});