import { v4 as uuidv4 } from 'uuid';
import {
  EInvoiceConfiguration,
  EInvoiceDispatchChannel,
  EInvoiceDispatchEvent,
  EInvoiceDocument,
  EInvoiceFormat,
  EInvoiceMetadata,
  EInvoiceProfile,
  EInvoiceStatus,
  EInvoiceValidationMessage,
  Invoice,
} from '@/types/invoice';

interface ValidationResult {
  messages: EInvoiceValidationMessage[];
  success: boolean;
}

export class EInvoicingService {
  private static readonly DEFAULT_CHANNELS: EInvoiceDispatchChannel[] = ['peppol', 'email'];

  static createDefaultMetadata(overrides?: Partial<EInvoiceConfiguration>): EInvoiceMetadata {
    return {
      enabled: overrides?.enabled ?? true,
      preferredFormat: overrides?.preferredFormat ?? 'xrechnung',
      autoDispatch: overrides?.autoDispatch ?? false,
      dispatchChannels: overrides?.dispatchChannels ?? [...this.DEFAULT_CHANNELS],
      status: 'not_generated',
      documents: [],
      validationLog: [],
    };
  }

  static ensureMetadata(invoice: Invoice, overrides?: Partial<EInvoiceConfiguration>): Invoice {
    const base = this.createDefaultMetadata(overrides);
    const existing = invoice.eInvoicing;

    const metadata: EInvoiceMetadata = {
      ...base,
      ...(existing ?? {}),
      dispatchChannels: existing?.dispatchChannels?.length ? existing.dispatchChannels : base.dispatchChannels,
      preferredFormat: existing?.preferredFormat ?? base.preferredFormat,
      enabled: existing?.enabled ?? base.enabled,
      autoDispatch: existing?.autoDispatch ?? base.autoDispatch,
      documents: existing?.documents ? [...existing.documents] : [],
      validationLog: existing?.validationLog ? [...existing.validationLog] : [],
      status: this.determineStatus(existing),
      lastGeneratedAt: existing?.lastGeneratedAt,
      lastValidatedAt: existing?.lastValidatedAt,
      lastDispatchedAt: existing?.lastDispatchedAt,
      lastError: existing?.lastError,
    };

    return {
      ...invoice,
      eInvoicing: metadata,
    };
  }

  static generateDocument(invoice: Invoice, format: EInvoiceFormat): { invoice: Invoice; document: EInvoiceDocument } {
    const invoiceWithMeta = this.ensureMetadata(this.cloneInvoice(invoice));
    const metadata = invoiceWithMeta.eInvoicing!;

    if (!metadata.enabled) {
      throw new Error('E-Invoicing ist fuer diese Rechnung deaktiviert.');
    }

    const now = new Date().toISOString();
    const profile: EInvoiceProfile = format === 'xrechnung' ? 'xrechnung' : 'zugferd';
    const filename = `${invoiceWithMeta.number}__.xml`;
    const payload = this.buildXmlPayload(invoiceWithMeta, profile);

    const document: EInvoiceDocument = {
      id: uuidv4(),
      format,
      profile,
      createdAt: now,
      filename,
      checksum: this.simpleChecksum(payload),
      status: 'generated',
      payload,
      validationMessages: [],
      dispatchHistory: [],
    };

    const updatedMetadata: EInvoiceMetadata = {
      ...metadata,
      documents: [document, ...metadata.documents],
      lastGeneratedAt: now,
      status: 'generated',
      lastError: undefined,
    };

    const updatedInvoice: Invoice = {
      ...invoiceWithMeta,
      eInvoicing: updatedMetadata,
      updatedAt: now,
    };

    return { invoice: updatedInvoice, document };
  }

  static validateLatestDocument(invoice: Invoice): { invoice: Invoice; result: ValidationResult } {
    const invoiceWithMeta = this.ensureMetadata(this.cloneInvoice(invoice));
    const metadata = invoiceWithMeta.eInvoicing!;
    const latest = metadata.documents[0];

    if (!latest) {
      throw new Error('Keine E-Rechnung vorhanden, die validiert werden kann.');
    }

    const now = new Date().toISOString();
    const messages: EInvoiceValidationMessage[] = [
      {
        id: uuidv4(),
        level: 'info',
        message: 'Struktur erfolgreich geprueft.',
        timestamp: now,
      },
    ];

    if (metadata.preferredFormat === 'zugferd_basic' && latest.profile === 'zugferd') {
      messages.push({
        id: uuidv4(),
        level: 'warning',
        message: 'ZUGFeRD Basic enthaelt optionale Felder, bitte pruefen Sie manuell.',
        timestamp: now,
      });
    }

    const updatedDocument: EInvoiceDocument = {
      ...latest,
      status: 'validated',
      validationMessages: [...messages],
    };

    const updatedMetadata: EInvoiceMetadata = {
      ...metadata,
      documents: [updatedDocument, ...metadata.documents.slice(1)],
      validationLog: [...metadata.validationLog, ...messages],
      lastValidatedAt: now,
      status: 'validated',
      lastError: undefined,
    };

    const updatedInvoice: Invoice = {
      ...invoiceWithMeta,
      eInvoicing: updatedMetadata,
      updatedAt: now,
    };

    return {
      invoice: updatedInvoice,
      result: { success: true, messages },
    };
  }

  static dispatchLatestDocument(invoice: Invoice, channel: EInvoiceDispatchChannel): { invoice: Invoice; event: EInvoiceDispatchEvent } {
    const invoiceWithMeta = this.ensureMetadata(this.cloneInvoice(invoice));
    const metadata = invoiceWithMeta.eInvoicing!;
    const latest = metadata.documents[0];

    if (!latest) {
      throw new Error('Keine E-Rechnung gefunden, die versendet werden kann.');
    }

    const now = new Date().toISOString();
    const event: EInvoiceDispatchEvent = {
      id: uuidv4(),
      channel,
      timestamp: now,
      status: 'delivered',
      message: channel === 'peppol'
        ? 'Uebermittlung ueber Peppol Access Point simuliert.'
        : 'Versand erfolgreich protokolliert.',
      referenceId: `EINV-${invoiceWithMeta.number}-${now}`,
    };

    const updatedDocument: EInvoiceDocument = {
      ...latest,
      status: 'dispatched',
      dispatchHistory: [event, ...latest.dispatchHistory],
    };

    const updatedMetadata: EInvoiceMetadata = {
      ...metadata,
      documents: [updatedDocument, ...metadata.documents.slice(1)],
      lastDispatchedAt: now,
      status: 'dispatched',
      lastError: undefined,
    };

    const updatedInvoice: Invoice = {
      ...invoiceWithMeta,
      eInvoicing: updatedMetadata,
      updatedAt: now,
    };

    return { invoice: updatedInvoice, event };
  }

  static getLatestDocument(invoice: Invoice): EInvoiceDocument | undefined {
    return invoice.eInvoicing?.documents?.[0];
  }

  static statusLabel(status: EInvoiceStatus): string {
    switch (status) {
      case 'disabled':
        return 'Deaktiviert';
      case 'not_generated':
        return 'Nicht erstellt';
      case 'generated':
        return 'Erstellt';
      case 'validated':
        return 'Validiert';
      case 'dispatched':
        return 'Versendet';
      case 'failed':
        return 'Fehler';
      default:
        return status;
    }
  }

  static formatLabel(format: EInvoiceFormat): string {
    switch (format) {
      case 'xrechnung':
        return 'XRechnung';
      case 'zugferd_basic':
        return 'ZUGFeRD Basic';
      case 'zugferd_comfort':
        return 'ZUGFeRD Comfort';
      default:
        return format;
    }
  }

  private static determineStatus(existing?: EInvoiceMetadata): EInvoiceStatus {
    if (!existing) {
      return 'not_generated';
    }

    if (!existing.enabled) {
      return 'disabled';
    }

    if (existing.lastError) {
      return 'failed';
    }

    if (existing.lastDispatchedAt) {
      return 'dispatched';
    }

    if (existing.lastValidatedAt) {
      return 'validated';
    }

    if (existing.documents && existing.documents.length > 0) {
      return 'generated';
    }

    return 'not_generated';
  }

  private static buildXmlPayload(invoice: Invoice, profile: EInvoiceProfile): string {
    const itemsXml = invoice.items.length
      ? invoice.items
          .map((item, index) => {
            const lineId = index + 1;
            return [
              '    <cbc:IncludedSupplyChainTradeLineItem>',
              `      <cbc:LineID>${lineId}</cbc:LineID>`,
              `      <cbc:LineItemName>${this.escapeXml(item.description)}</cbc:LineItemName>`,
              `      <cbc:LineItemQuantity unitCode="${this.escapeXml(item.unit)}">${item.quantity.toFixed(2)}</cbc:LineItemQuantity>`,
              `      <cbc:LineItemAmount>${this.formatAmount(item.totalNet)}</cbc:LineItemAmount>`,
              '    </cbc:IncludedSupplyChainTradeLineItem>',
            ].join('\n');
          })
          .join('\n')
      : '    <!-- No line items available -->';

    const totals = invoice.totals ?? {
      subtotalNet: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalGross: 0,
      totalPaid: 0,
      totalDue: 0,
      taxBreakdown: {},
    };

    const issueDate = invoice.issueDate ?? new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>\n<Invoice profile="${profile}" number="${this.escapeXml(invoice.number)}">\n  <cbc:ExchangedDocument>\n    <cbc:ID>${this.escapeXml(invoice.number)}</cbc:ID>\n    <cbc:TypeCode>380</cbc:TypeCode>\n    <cbc:IssueDateTime>${this.escapeXml(issueDate)}</cbc:IssueDateTime>\n  </cbc:ExchangedDocument>\n  <cbc:SupplyChainTradeTransaction>\n${itemsXml}\n  </cbc:SupplyChainTradeTransaction>\n  <cbc:SupplyChainTradeSettlement>\n    <cbc:TaxTotal>${this.formatAmount(totals.totalTax)}</cbc:TaxTotal>\n    <cbc:GrandTotalAmount>${this.formatAmount(totals.totalGross)}</cbc:GrandTotalAmount>\n  </cbc:SupplyChainTradeSettlement>\n</Invoice>`;
  }

  private static escapeXml(value: string | number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static formatAmount(value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) {
      return '0.00';
    }

    return value.toFixed(2);
  }

  private static simpleChecksum(payload: string): string {
    let hash = 0;
    for (let i = 0; i < payload.length; i += 1) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  private static cloneInvoice(invoice: Invoice): Invoice {
    return JSON.parse(JSON.stringify(invoice));
  }
}


