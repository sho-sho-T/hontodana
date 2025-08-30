import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/errors/error-boundary';

// Mock console.error to prevent error logs in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>Content loaded</div>;
  };

  test('should render children when no error', () => {
    // When
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    
    // Then
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  test('should catch and display error fallback', () => {
    // When
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Content loaded')).not.toBeInTheDocument();
  });

  test('should display custom error message when provided', () => {
    // When
    render(
      <ErrorBoundary fallbackMessage="Custom error message">
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  test('should reset error state when retry clicked', () => {
    // Given
    let shouldThrow = true;
    const ConditionalError = () => {
      if (shouldThrow) throw new Error('Test error');
      return <div>Content loaded successfully</div>;
    };
    
    render(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );
    
    // Verify error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // When
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    
    // Then
    expect(screen.getByText('Content loaded successfully')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('should call onError callback when error occurs', () => {
    // Given
    const onError = jest.fn();
    
    // When
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  test('should log error details in development', () => {
    // Given
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // When
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    expect(consoleSpy).toHaveBeenCalled();
    
    // Cleanup
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  test('should not log error details in production', () => {
    // Given
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // When
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    // Check that our custom error logging wasn't called (React may still log)
    const customErrorCalls = consoleSpy.mock.calls.filter(call => 
      call.some(arg => typeof arg === 'string' && arg.includes('ErrorBoundary caught an error:'))
    );
    expect(customErrorCalls).toHaveLength(0);
    
    // Cleanup
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  test('should render custom fallback component', () => {
    // Given
    const CustomFallback = ({ error, resetError }: any) => (
      <div>
        <h2>Custom Error UI</h2>
        <p>{error.message}</p>
        <button onClick={resetError}>Reset</button>
      </div>
    );
    
    // When
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});