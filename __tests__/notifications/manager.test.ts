import { NotificationManager, NotificationType } from '@/lib/notifications/manager';

describe('NotificationManager', () => {
  let manager: NotificationManager;
  let mockToast: jest.Mock;
  
  beforeEach(() => {
    manager = new NotificationManager();
    mockToast = jest.fn();
    manager.setToastImplementation(mockToast);
  });

  test('should display error notification', () => {
    // When
    manager.showError('Operation failed');
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.ERROR,
      message: 'Operation failed',
      duration: 5000,
      dismissible: true
    });
  });

  test('should display success notification', () => {
    // When
    manager.showSuccess('Operation completed successfully');
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.SUCCESS,
      message: 'Operation completed successfully',
      duration: 3000,
      dismissible: true
    });
  });

  test('should display warning notification', () => {
    // When
    manager.showWarning('This action may have side effects');
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.WARNING,
      message: 'This action may have side effects',
      duration: 4000,
      dismissible: true
    });
  });

  test('should display info notification', () => {
    // When
    manager.showInfo('New feature available');
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.INFO,
      message: 'New feature available',
      duration: 3000,
      dismissible: true
    });
  });

  test('should queue multiple notifications', () => {
    // When
    manager.showInfo('Info message');
    manager.showWarning('Warning message');
    manager.showError('Error message');
    
    // Then
    expect(mockToast).toHaveBeenCalledTimes(3);
    expect(mockToast).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: NotificationType.INFO,
      message: 'Info message'
    }));
    expect(mockToast).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: NotificationType.WARNING,
      message: 'Warning message'
    }));
    expect(mockToast).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: NotificationType.ERROR,
      message: 'Error message'
    }));
  });

  test('should use custom duration when provided', () => {
    // When
    manager.showError('Custom duration error', { duration: 10000 });
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.ERROR,
      message: 'Custom duration error',
      duration: 10000,
      dismissible: true
    });
  });

  test('should set non-dismissible notifications', () => {
    // When
    manager.showInfo('Non-dismissible info', { dismissible: false });
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.INFO,
      message: 'Non-dismissible info',
      duration: 3000,
      dismissible: false
    });
  });

  test('should include action in notification', () => {
    // Given
    const action = {
      label: 'Undo',
      handler: jest.fn()
    };
    
    // When
    manager.showSuccess('File deleted', { action });
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: NotificationType.SUCCESS,
      message: 'File deleted',
      duration: 3000,
      dismissible: true,
      action
    });
  });

  test('should clear all notifications', () => {
    // Given
    const mockClear = jest.fn();
    manager.setClearAllImplementation(mockClear);
    
    // When
    manager.clearAll();
    
    // Then
    expect(mockClear).toHaveBeenCalled();
  });

  test('should provide singleton instance', () => {
    // When
    const instance1 = NotificationManager.getInstance();
    const instance2 = NotificationManager.getInstance();
    
    // Then
    expect(instance1).toBe(instance2);
  });

  test('should handle missing toast implementation gracefully', () => {
    // Given
    const managerWithoutToast = new NotificationManager();
    
    // When & Then
    expect(() => {
      managerWithoutToast.showError('Test error');
    }).not.toThrow();
  });

  test('should throttle rapid notifications', () => {
    // Given
    manager.enableThrottling(100); // 100ms throttle
    
    // When
    manager.showError('Error 1');
    manager.showError('Error 2');
    manager.showError('Error 3');
    
    // Then
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Error 1'
    }));
  });
});

describe('NotificationType', () => {
  test('should have all required notification types', () => {
    // Then
    expect(NotificationType.SUCCESS).toBe('success');
    expect(NotificationType.ERROR).toBe('error');
    expect(NotificationType.WARNING).toBe('warning');
    expect(NotificationType.INFO).toBe('info');
  });
});