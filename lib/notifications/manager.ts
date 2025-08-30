export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface NotificationAction {
  label: string;
  handler: () => void;
}

export interface NotificationOptions {
  duration?: number;
  dismissible?: boolean;
  action?: NotificationAction;
}

export interface Notification {
  type: NotificationType;
  message: string;
  duration: number;
  dismissible: boolean;
  action?: NotificationAction;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private toastImplementation?: (notification: Notification) => void;
  private clearAllImplementation?: () => void;
  private isThrottlingEnabled = false;
  private throttleDelay = 0;
  private lastNotificationTime = 0;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  setToastImplementation(implementation: (notification: Notification) => void): void {
    this.toastImplementation = implementation;
  }

  setClearAllImplementation(implementation: () => void): void {
    this.clearAllImplementation = implementation;
  }

  enableThrottling(delay: number): void {
    this.isThrottlingEnabled = true;
    this.throttleDelay = delay;
  }

  showSuccess(message: string, options: NotificationOptions = {}): void {
    this.show(NotificationType.SUCCESS, message, {
      duration: 3000,
      ...options
    });
  }

  showError(message: string, options: NotificationOptions = {}): void {
    this.show(NotificationType.ERROR, message, {
      duration: 5000,
      ...options
    });
  }

  showWarning(message: string, options: NotificationOptions = {}): void {
    this.show(NotificationType.WARNING, message, {
      duration: 4000,
      ...options
    });
  }

  showInfo(message: string, options: NotificationOptions = {}): void {
    this.show(NotificationType.INFO, message, {
      duration: 3000,
      ...options
    });
  }

  clearAll(): void {
    this.clearAllImplementation?.();
  }

  private show(type: NotificationType, message: string, options: NotificationOptions): void {
    // Check throttling
    if (this.isThrottlingEnabled) {
      const now = Date.now();
      if (now - this.lastNotificationTime < this.throttleDelay) {
        return; // Skip this notification due to throttling
      }
      this.lastNotificationTime = now;
    }

    const notification: Notification = {
      type,
      message,
      duration: options.duration || 3000,
      dismissible: options.dismissible ?? true,
      action: options.action
    };

    // Use toast implementation if available
    this.toastImplementation?.(notification);
  }
}