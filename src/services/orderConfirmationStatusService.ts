/**
 * Order Confirmation Status Management Service
 * 
 * Handles status transitions and validation for order confirmations:
 * - draft → sent → confirmed
 * - draft → cancelled
 * - sent → cancelled
 */

export type OrderConfirmationStatus = 'draft' | 'sent' | 'confirmed' | 'cancelled';

export interface StatusTransition {
  from: OrderConfirmationStatus;
  to: OrderConfirmationStatus;
  description: string;
  requiresConfirmation?: boolean;
  automated?: boolean;
}

export interface StatusChangeEvent {
  id: string;
  orderConfirmationId: string;
  fromStatus: OrderConfirmationStatus;
  toStatus: OrderConfirmationStatus;
  timestamp: string;
  userId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class OrderConfirmationStatusService {
  private static instance: OrderConfirmationStatusService;

  // Define valid status transitions
  private readonly validTransitions: StatusTransition[] = [
    {
      from: 'draft',
      to: 'sent',
      description: 'Auftragsbestätigung an Kunden versenden',
      requiresConfirmation: true
    },
    {
      from: 'sent',
      to: 'confirmed',
      description: 'Kunde hat Auftragsbestätigung bestätigt',
      automated: false
    },
    {
      from: 'draft',
      to: 'cancelled',
      description: 'Auftragsbestätigung stornieren (Entwurf)',
      requiresConfirmation: true
    },
    {
      from: 'sent',
      to: 'cancelled',
      description: 'Auftragsbestätigung stornieren (nach Versand)',
      requiresConfirmation: true
    }
  ];

  // In a real application, this would be stored in a database
  private statusHistory: StatusChangeEvent[] = [];

  public static getInstance(): OrderConfirmationStatusService {
    if (!OrderConfirmationStatusService.instance) {
      OrderConfirmationStatusService.instance = new OrderConfirmationStatusService();
    }
    return OrderConfirmationStatusService.instance;
  }

  /**
   * Check if a status transition is valid
   */
  public isValidTransition(from: OrderConfirmationStatus, to: OrderConfirmationStatus): boolean {
    return this.validTransitions.some(
      transition => transition.from === from && transition.to === to
    );
  }

  /**
   * Get available transitions for a given status
   */
  public getAvailableTransitions(currentStatus: OrderConfirmationStatus): StatusTransition[] {
    return this.validTransitions.filter(transition => transition.from === currentStatus);
  }

  /**
   * Get transition details
   */
  public getTransition(from: OrderConfirmationStatus, to: OrderConfirmationStatus): StatusTransition | null {
    return this.validTransitions.find(
      transition => transition.from === from && transition.to === to
    ) || null;
  }

  /**
   * Change status with validation and history tracking
   */
  public async changeStatus(
    orderConfirmationId: string,
    fromStatus: OrderConfirmationStatus,
    toStatus: OrderConfirmationStatus,
    options: {
      userId?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<{ success: boolean; error?: string; event?: StatusChangeEvent }> {
    
    // Validate transition
    if (!this.isValidTransition(fromStatus, toStatus)) {
      return {
        success: false,
        error: `Ungültiger Statusübergang von '${fromStatus}' zu '${toStatus}'`
      };
    }

    // Create status change event
    const event: StatusChangeEvent = {
      id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderConfirmationId,
      fromStatus,
      toStatus,
      timestamp: new Date().toISOString(),
      userId: options.userId,
      reason: options.reason,
      metadata: options.metadata
    };

    try {
      // In a real application, this would update the database
      this.statusHistory.push(event);
      
      // Perform any side effects based on status change
      await this.handleStatusChangeEffects(event);

      return {
        success: true,
        event
      };
    } catch (error) {
      return {
        success: false,
        error: `Fehler beim Statuswechsel: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      };
    }
  }

  /**
   * Get status history for an order confirmation
   */
  public getStatusHistory(orderConfirmationId: string): StatusChangeEvent[] {
    return this.statusHistory
      .filter(event => event.orderConfirmationId === orderConfirmationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Handle side effects of status changes
   */
  private async handleStatusChangeEffects(event: StatusChangeEvent): Promise<void> {
    switch (event.toStatus) {
      case 'sent':
        // Could trigger email sending, notifications, etc.
        console.log(`Order confirmation ${event.orderConfirmationId} sent to customer`);
        break;
      
      case 'confirmed':
        // Could trigger project creation, notifications, etc.
        console.log(`Order confirmation ${event.orderConfirmationId} confirmed by customer`);
        break;
      
      case 'cancelled':
        // Could trigger cleanup, notifications, etc.
        console.log(`Order confirmation ${event.orderConfirmationId} cancelled`);
        break;
    }
  }

  /**
   * Get status display information
   */
  public getStatusInfo(status: OrderConfirmationStatus): {
    label: string;
    description: string;
    color: string;
    icon: string;
  } {
    switch (status) {
      case 'draft':
        return {
          label: 'Entwurf',
          description: 'Auftragsbestätigung ist noch in Bearbeitung',
          color: 'orange',
          icon: 'Edit'
        };
      case 'sent':
        return {
          label: 'Versendet',
          description: 'Auftragsbestätigung wurde an den Kunden gesendet',
          color: 'blue',
          icon: 'Send'
        };
      case 'confirmed':
        return {
          label: 'Bestätigt',
          description: 'Kunde hat die Auftragsbestätigung bestätigt',
          color: 'green',
          icon: 'CheckCircle'
        };
      case 'cancelled':
        return {
          label: 'Storniert',
          description: 'Auftragsbestätigung wurde storniert',
          color: 'red',
          icon: 'XCircle'
        };
      default:
        return {
          label: 'Unbekannt',
          description: 'Unbekannter Status',
          color: 'gray',
          icon: 'AlertCircle'
        };
    }
  }

  /**
   * Check if status allows editing
   */
  public isEditable(status: OrderConfirmationStatus): boolean {
    return status === 'draft';
  }

  /**
   * Check if status allows cancellation
   */
  public isCancellable(status: OrderConfirmationStatus): boolean {
    return status === 'draft' || status === 'sent';
  }

  /**
   * Check if status allows sending
   */
  public isSendable(status: OrderConfirmationStatus): boolean {
    return status === 'draft';
  }

  /**
   * Validate status workflow rules
   */
  public validateWorkflowRules(
    orderConfirmationId: string,
    currentStatus: OrderConfirmationStatus,
    targetStatus: OrderConfirmationStatus,
    context?: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic transition validation
    if (!this.isValidTransition(currentStatus, targetStatus)) {
      errors.push(`Statusübergang von '${currentStatus}' zu '${targetStatus}' ist nicht erlaubt`);
    }

    // Business rule validations
    if (targetStatus === 'sent' && currentStatus === 'draft') {
      // Check if order confirmation is complete
      if (!context?.hasPositions) {
        errors.push('Auftragsbestätigung muss mindestens eine Position enthalten');
      }
      if (!context?.hasCustomerEmail) {
        errors.push('Kunden-E-Mail-Adresse ist erforderlich für den Versand');
      }
    }

    if (targetStatus === 'confirmed' && currentStatus === 'sent') {
      // Check if enough time has passed or customer actually confirmed
      if (!context?.customerConfirmation) {
        errors.push('Kundenbestätigung ist erforderlich');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get recommended next actions for a status
   */
  public getRecommendedActions(status: OrderConfirmationStatus): string[] {
    switch (status) {
      case 'draft':
        return [
          'Positionen hinzufügen oder bearbeiten',
          'Kundendaten vervollständigen',
          'An Kunden versenden'
        ];
      case 'sent':
        return [
          'Auf Kundenbestätigung warten',
          'Kunden kontaktieren',
          'Bei Bedarf stornieren'
        ];
      case 'confirmed':
        return [
          'Projekt erstellen',
          'Liefertermine planen',
          'Rechnung vorbereiten'
        ];
      case 'cancelled':
        return [
          'Dokumentation aktualisieren',
          'Kunde informieren',
          'Neuen Entwurf erstellen'
        ];
      default:
        return [];
    }
  }
}

export default OrderConfirmationStatusService;