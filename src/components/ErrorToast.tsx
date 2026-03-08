import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppointmentError, AppointmentErrorType, AppointmentErrorHandler } from '../utils/errorHandling';

type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  actions?: ToastAction[];
  duration?: number;
  persistent?: boolean;
  appointmentError?: AppointmentError;
}

interface ToastAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'outline' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  showError: (error: AppointmentError, actions?: ToastAction[]) => string;
  showSuccess: (title: string, message: string) => string;
  showWarning: (title: string, message: string) => string;
  showInfo: (title: string, message: string) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    setToasts(prev => {
      const newToasts = [newToast, ...prev].slice(0, maxToasts);
      return newToasts;
    });

    // Auto-remove non-persistent toasts
    if (!newToast.persistent && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration);
    }

    return id;
  }, [generateId, maxToasts, removeToast]);

  const showError = useCallback((error: AppointmentError, customActions?: ToastAction[]) => {
    const actions: ToastAction[] = customActions || [];
    
    // Add suggested actions from error handler
    const suggestedActions = AppointmentErrorHandler.getSuggestedActions(error);
    
    // Add retry action for retryable errors
    if (error.retryable && !customActions?.some(a => a.label.includes('Wiederholen'))) {
      actions.push({
        label: 'Wiederholen',
        action: () => {
          // This would need to be implemented based on the specific context
          console.log('Retry action triggered for error:', error.type);
        },
        variant: 'outline',
      });
    }

    // Add details action for complex errors
    if (error.details && !customActions?.some(a => a.label.includes('Details'))) {
      actions.push({
        label: 'Details anzeigen',
        action: () => {
          console.log('Error details:', error);
          // Could open a detailed error modal here
        },
        variant: 'outline',
      });
    }

    return showToast({
      type: 'error',
      title: getErrorTitle(error.type),
      message: AppointmentErrorHandler.getUserFriendlyMessage(error),
      actions,
      persistent: error.type === AppointmentErrorType.CONFLICT_ERROR, // Keep conflict errors visible
      appointmentError: error,
    });
  }, [showToast]);

  const showSuccess = useCallback((title: string, message: string) => {
    return showToast({
      type: 'success',
      title,
      message,
      duration: 3000,
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeToast,
    clearAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCardClassName = () => {
    const baseClass = "shadow-lg border-l-4 animate-in slide-in-from-right-full duration-300";
    switch (toast.type) {
      case 'error':
        return `${baseClass} border-l-red-500 bg-red-50`;
      case 'success':
        return `${baseClass} border-l-green-500 bg-green-50`;
      case 'warning':
        return `${baseClass} border-l-yellow-500 bg-yellow-50`;
      case 'info':
        return `${baseClass} border-l-blue-500 bg-blue-50`;
      default:
        return `${baseClass} border-l-gray-500 bg-gray-50`;
    }
  };

  return (
    <Card className={getCardClassName()}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {toast.title}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 ml-2 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {toast.actions && toast.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {toast.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.action}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getErrorTitle(errorType: AppointmentErrorType): string {
  switch (errorType) {
    case AppointmentErrorType.NETWORK_ERROR:
      return 'Verbindungsfehler';
    case AppointmentErrorType.API_ERROR:
      return 'Server-Fehler';
    case AppointmentErrorType.VALIDATION_ERROR:
      return 'Eingabefehler';
    case AppointmentErrorType.CONFLICT_ERROR:
      return 'Terminkonflikt';
    case AppointmentErrorType.PERMISSION_ERROR:
      return 'Berechtigung fehlt';
    case AppointmentErrorType.SYNC_ERROR:
      return 'Synchronisationsfehler';
    case AppointmentErrorType.STORAGE_ERROR:
      return 'Speicherfehler';
    default:
      return 'Fehler';
  }
}

/**
 * Hook for handling specific appointment operation errors
 */
export function useAppointmentErrorHandler() {
  const { showError, showSuccess, showWarning } = useToast();

  const handleCreateError = useCallback((error: unknown) => {
    const appointmentError = AppointmentErrorHandler.handleError(error, 'create-appointment');
    
    const actions: ToastAction[] = [];
    
    if (appointmentError.type === AppointmentErrorType.CONFLICT_ERROR) {
      actions.push({
        label: 'Alternative Zeiten anzeigen',
        action: () => {
          // This would trigger the conflict resolution UI
          console.log('Show alternative times');
        },
      });
    }
    
    if (appointmentError.retryable) {
      actions.push({
        label: 'Erneut versuchen',
        action: () => {
          // This would retry the create operation
          console.log('Retry create');
        },
      });
    }

    return showError(appointmentError, actions);
  }, [showError]);

  const handleUpdateError = useCallback((error: unknown) => {
    const appointmentError = AppointmentErrorHandler.handleError(error, 'update-appointment');
    return showError(appointmentError);
  }, [showError]);

  const handleDeleteError = useCallback((error: unknown) => {
    const appointmentError = AppointmentErrorHandler.handleError(error, 'delete-appointment');
    return showError(appointmentError);
  }, [showError]);

  const handleSyncError = useCallback((error: unknown) => {
    const appointmentError = AppointmentErrorHandler.handleError(error, 'sync-appointments');
    
    const actions: ToastAction[] = [{
      label: 'Erneut synchronisieren',
      action: () => {
        // This would trigger manual sync
        console.log('Manual sync');
      },
    }];

    return showError(appointmentError, actions);
  }, [showError]);

  const handleSuccessfulCreate = useCallback((appointment: { title: string; id: string }) => {
    showSuccess(
      'Termin erstellt',
      `Der Termin "${appointment.title}" wurde erfolgreich erstellt.`
    );
  }, [showSuccess]);

  const handleSuccessfulUpdate = useCallback((appointment: { title: string; id: string }) => {
    showSuccess(
      'Termin aktualisiert',
      `Der Termin "${appointment.title}" wurde erfolgreich aktualisiert.`
    );
  }, [showSuccess]);

  const handleSuccessfulDelete = useCallback((appointmentTitle: string) => {
    showSuccess(
      'Termin gelöscht',
      `Der Termin "${appointmentTitle}" wurde erfolgreich gelöscht.`
    );
  }, [showSuccess]);

  const handleOfflineMode = useCallback(() => {
    showWarning(
      'Offline-Modus',
      'Sie sind offline. Änderungen werden automatisch synchronisiert, sobald Sie wieder online sind.'
    );
  }, [showWarning]);

  const handleSyncComplete = useCallback((result: { processed: number; failed: number }) => {
    if (result.failed === 0) {
      showSuccess(
        'Synchronisation abgeschlossen',
        `${result.processed} Termine wurden erfolgreich synchronisiert.`
      );
    } else {
      showWarning(
        'Synchronisation teilweise erfolgreich',
        `${result.processed} Termine synchronisiert, ${result.failed} Fehler.`
      );
    }
  }, [showSuccess, showWarning]);

  return {
    handleCreateError,
    handleUpdateError,
    handleDeleteError,
    handleSyncError,
    handleSuccessfulCreate,
    handleSuccessfulUpdate,
    handleSuccessfulDelete,
    handleOfflineMode,
    handleSyncComplete,
  };
}

export default ToastProvider;