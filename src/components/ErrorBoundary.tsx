import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppointmentErrorHandler, AppointmentErrorType } from '../utils/errorHandling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Home, Mail, Copy, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  copied: boolean;
}

/**
 * Error Boundary component for catching and handling React errors
 * Provides graceful error recovery and user-friendly error displays
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
      copied: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error through structured logger
    logger.error('React Error Boundary caught error', {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      errorName: error.name,
      errorMessage: error.message,
    }, error);
    
    // Log error through our error handler
    AppointmentErrorHandler.handleError(error, 'react-error-boundary');
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    logger.info('User clicked retry in error boundary', { errorId: this.state.errorId });
    this.setState({ hasError: false, error: null, errorId: null, copied: false });
  };

  handleReload = () => {
    logger.info('User clicked reload in error boundary', { errorId: this.state.errorId });
    window.location.reload();
  };

  handleGoHome = () => {
    logger.info('User navigated home from error boundary', { errorId: this.state.errorId });
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorDetails = `Fehler-ID: ${this.state.errorId}\nFehler: ${this.state.error?.message}\nURL: ${window.location.href}\nZeit: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Etwas ist schiefgelaufen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 text-center">
                Ein unerwarteter Fehler ist aufgetreten. Keine Sorge, Ihre Daten sind sicher.
              </div>
              
              {this.state.errorId && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Fehler-ID:</div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {this.state.errorId}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Erneut versuchen
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  Seite neu laden
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="ghost"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Zur Startseite
                </Button>
              </div>

              <div className="pt-4 border-t text-center">
                <div className="text-xs text-gray-500 mb-2">
                  Problem weiterhin vorhanden?
                </div>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => window.open('mailto:support@bauplan-buddy.de?subject=Fehler-ID: ' + this.state.errorId, '_blank')}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Support kontaktieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export default ErrorBoundary;