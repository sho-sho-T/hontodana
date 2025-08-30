import { Logger, LogLevel } from '@/lib/logging/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should log at correct level', () => {
    // Given
    const logger = new Logger('test');
    
    // When
    logger.info('Test message');
    
    // Then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.INFO,
        message: 'Test message',
        source: 'test'
      })
    );
  });

  test('should format log entry correctly', () => {
    // Given
    const logger = new Logger('test');
    
    // When
    logger.error('Error occurred', { userId: 'user123' });
    
    // Then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        level: LogLevel.ERROR,
        message: 'Error occurred',
        timestamp: expect.any(Date),
        source: 'test',
        metadata: { userId: 'user123' }
      })
    );
  });

  test('should mask sensitive information', () => {
    // Given
    const logger = new Logger('test');
    
    // When
    logger.info('User login', { 
      email: 'user@example.com',
      password: 'secret123',
      token: 'jwt-token-here',
      apiKey: 'api-key-123'
    });
    
    // Then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          email: 'user@example.com',
          password: '***MASKED***',
          token: '***MASKED***',
          apiKey: '***MASKED***'
        }
      })
    );
  });

  test('should include request ID when provided', () => {
    // Given
    const logger = new Logger('test');
    const requestId = 'req-456';
    
    // When
    logger.warn('Warning message', {}, requestId);
    
    // Then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: requestId
      })
    );
  });

  test('should handle circular references in metadata', () => {
    // Given
    const logger = new Logger('test');
    const circularObj: any = { name: 'test' };
    circularObj.self = circularObj;
    
    // When & Then
    expect(() => {
      logger.info('Circular reference test', { data: circularObj });
    }).not.toThrow();
  });

  test('should filter logs by minimum level', () => {
    // Given
    const logger = new Logger('test', LogLevel.WARN);
    
    // When
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    // Then
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ level: LogLevel.DEBUG })
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ level: LogLevel.INFO })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ level: LogLevel.WARN })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ level: LogLevel.ERROR })
    );
  });

  test('should generate unique log IDs', () => {
    // Given
    const logger = new Logger('test');
    const ids = new Set();
    
    // When
    for (let i = 0; i < 100; i++) {
      logger.info(`Message ${i}`);
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      ids.add(lastCall.id);
    }
    
    // Then
    expect(ids.size).toBe(100);
  });
});

describe('LogLevel', () => {
  test('should have all required log levels', () => {
    // Then
    expect(LogLevel.DEBUG).toBe('debug');
    expect(LogLevel.INFO).toBe('info');
    expect(LogLevel.WARN).toBe('warn');
    expect(LogLevel.ERROR).toBe('error');
    expect(LogLevel.FATAL).toBe('fatal');
  });

  test('should have correct priority order', () => {
    // Given
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const priorities = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
    
    // When & Then
    for (let i = 1; i < levels.length; i++) {
      expect(priorities[levels[i]]).toBeGreaterThan(priorities[levels[i - 1]]);
    }
  });
});