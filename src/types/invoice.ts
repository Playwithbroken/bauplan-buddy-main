export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate: number;
  totalNet: number;
  totalGross: number;
  category?: string;
  projectPhase?: string;
}

export interface InvoiceAddress {
  company?: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
}

export interface InvoicePaymentTerms {
  paymentDueDate: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'card' | 'check';
  bankDetails?: {
    accountHolder: string;
    iban: string;
    bic: string;
    bankName: string;
  };
  earlyPaymentDiscount?: {
    percentage: number;
    daysLimit: number;
  };
  latePaymentFee?: {
    percentage: number;
    afterDays: number;
  };
}

export interface InvoiceTotals {
  subtotalNet: number;
  totalDiscount: number;
  totalTax: number;
  totalGross: number;
  totalPaid: number;
  totalDue: number;
  taxBreakdown: Record<string, {
    net: number;
    tax: number;
    gross: number;
  }>;
}

export type EInvoiceFormat = 'xrechnung' | 'zugferd_basic' | 'zugferd_comfort';

export type EInvoiceProfile = 'xrechnung' | 'zugferd';

export type EInvoiceStatus =
  | 'disabled'
  | 'not_generated'
  | 'generated'
  | 'validated'
  | 'dispatched'
  | 'failed';

export type EInvoiceDispatchChannel = 'peppol' | 'email' | 'portal';

export interface EInvoiceValidationMessage {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  code?: string;
  timestamp: string;
}

export interface EInvoiceDispatchEvent {
  id: string;
  channel: EInvoiceDispatchChannel;
  timestamp: string;
  status: 'queued' | 'delivered' | 'failed';
  message?: string;
  referenceId?: string;
}

export interface EInvoiceDocument {
  id: string;
  format: EInvoiceFormat;
  profile: EInvoiceProfile;
  createdAt: string;
  filename: string;
  checksum: string;
  status: 'generated' | 'validated' | 'dispatched' | 'archived' | 'error';
  payload: string;
  validationMessages: EInvoiceValidationMessage[];
  dispatchHistory: EInvoiceDispatchEvent[];
}

export interface EInvoiceConfiguration {
  enabled: boolean;
  preferredFormat: EInvoiceFormat;
  autoDispatch: boolean;
  dispatchChannels: EInvoiceDispatchChannel[];
}

export interface EInvoiceMetadata extends EInvoiceConfiguration {
  status: EInvoiceStatus;
  lastGeneratedAt?: string;
  lastValidatedAt?: string;
  lastDispatchedAt?: string;
  lastError?: string;
  documents: EInvoiceDocument[];
  validationLog: EInvoiceValidationMessage[];
}

export interface InvoiceStatus {
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
    user?: string;
  }[];
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  sentDate?: string;
  viewedDate?: string;
  paidDate?: string;
  remindersSent: number;
  lastReminderDate?: string;
}

export interface Invoice {
  id: string;
  number: string;
  type: 'invoice' | 'credit_note' | 'proforma' | 'recurring';
  
  // Dates
  issueDate: string;
  dueDate: string;
  serviceDate?: string;
  
  // Parties
  issuer: InvoiceAddress;
  recipient: InvoiceAddress;
  
  // Project and Reference
  projectId?: string;
  projectName?: string;
  customerRef?: string;
  orderNumber?: string;
  quoteNumber?: string;
  
  // Items and Financial
  items: InvoiceItem[];
  totals: InvoiceTotals;
  paymentTerms: InvoicePaymentTerms;
  
  // Status and Tracking
  status: InvoiceStatus;
  
  // Configuration
  currency: string;
  language: 'de' | 'en';
  template: string;
  
  // Notes and Attachments
  notes?: string;
  internalNotes?: string;
  attachments?: string[];
  
  // Recurring Information (if applicable)
  recurring?: {
    enabled: boolean;
    interval: 'monthly' | 'quarterly' | 'yearly';
    nextIssueDate?: string;
    endDate?: string;
    count?: number;
    issuedCount: number;
  };
  
  // E-Invoicing
  eInvoicing?: EInvoiceMetadata;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface InvoiceFormData {
  type: 'invoice' | 'credit_note' | 'proforma';
  issueDate: string;
  dueDate: string;
  serviceDate?: string;
  
  recipient: InvoiceAddress;
  
  projectId?: string;
  customerRef?: string;
  orderNumber?: string;
  quoteNumber?: string;
  
  items: Omit<InvoiceItem, 'id' | 'totalNet' | 'totalGross'>[];
  
  currency: string;
  language: 'de' | 'en';
  template: string;
  
  paymentTerms: Omit<InvoicePaymentTerms, 'paymentDueDate'> & {
    paymentDueDays: number;
  };
  
  notes?: string;
  internalNotes?: string;
  
  eInvoicing?: Partial<EInvoiceConfiguration>;
  
  recurring?: {
    enabled: boolean;
    interval: 'monthly' | 'quarterly' | 'yearly';
    endDate?: string;
    count?: number;
  };
}

export interface InvoiceFilters {
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  customerId?: string;
  amountMin?: number;
  amountMax?: number;
  overdue?: boolean;
  type?: string[];
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'card' | 'check';
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  template: string; // HTML template
  isDefault: boolean;
  settings: {
    showLogo: boolean;
    showWatermark: boolean;
    headerHeight: number;
    footerHeight: number;
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
}

export interface InvoiceSettings {
  companyInfo: InvoiceAddress;
  defaultPaymentTerms: InvoicePaymentTerms;
  taxSettings: {
    defaultTaxRate: number;
    taxRates: Array<{
      name: string;
      rate: number;
      description: string;
    }>;
  };
  numberingScheme: {
    prefix: string;
    nextNumber: number;
    resetYearly: boolean;
    format: string; // e.g., "RG-{YYYY}-{NNNNNN}"
  };
  defaultTemplate: string;
  defaultCurrency: string;
  defaultLanguage: 'de' | 'en';
  reminderSettings: {
    enabled: boolean;
    firstReminderDays: number;
    secondReminderDays: number;
    finalReminderDays: number;
    autoSend: boolean;
  };
}

export interface InvoiceEmailTemplate {
  id: string;
  name: string;
  type: 'invoice_send' | 'reminder_1' | 'reminder_2' | 'reminder_final' | 'payment_received';
  language: 'de' | 'en';
  subject: string;
  body: string; // HTML template with placeholders
  isDefault: boolean;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  averagePaymentTime: number;
  byStatus: Record<string, {
    count: number;
    amount: number;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
    amount: number;
    paidAmount: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
}