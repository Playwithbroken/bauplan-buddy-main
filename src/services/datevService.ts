/**
 * DATEV Integration Service
 * Export accounting data in DATEV format for German tax advisors
 */

export type DATEVRecordType = 
  | 'booking'      // Buchungsstapel
  | 'account'      // Kontenbeschriftungen
  | 'customer'     // Debitoren
  | 'supplier';    // Kreditoren

export interface DATEVBooking {
  amount: number;        // Umsatz
  debitAccount: string;  // Sollkonto
  creditAccount: string; // Habenkonto
  date: Date;            // Belegdatum
  documentNumber: string; // Belegnummer
  description: string;   // Buchungstext
  taxCode?: string;      // BU-Schlüssel
  costCenter?: string;   // Kostenstelle
  costUnit?: string;     // Kostenträger
  currency?: string;     // Währung (default: EUR)
  exchangeRate?: number; // Wechselkurs
}

export interface DATEVAccount {
  accountNumber: string;
  name: string;
  type: 'asset' | 'liability' | 'income' | 'expense';
  taxCategory?: string;
}

export interface DATEVCustomer {
  accountNumber: string; // Debitorenkonto
  name: string;
  street?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  vatId?: string;
  email?: string;
  phone?: string;
}

export interface DATEVSupplier {
  accountNumber: string; // Kreditorenkonto
  name: string;
  street?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  vatId?: string;
  iban?: string;
  bic?: string;
}

export interface DATEVExportOptions {
  consultant: string;    // Beraternummer (7 digits)
  client: string;        // Mandantennummer (5 digits)
  fiscalYearStart: Date;
  accountLength: 4 | 5 | 6 | 7 | 8;
  dateFrom: Date;
  dateTo: Date;
  description?: string;
}

export interface DATEVExportResult {
  success: boolean;
  files: Array<{
    name: string;
    content: string;
    type: DATEVRecordType;
  }>;
  statistics: {
    bookings: number;
    accounts: number;
    customers: number;
    suppliers: number;
    totalDebit: number;
    totalCredit: number;
  };
  errors: string[];
}

// DATEV field separators
const FIELD_SEP = ';';
const DECIMAL_SEP = ',';

// Standard tax codes for German VAT
const TAX_CODES: Record<string, { rate: number; code: string }> = {
  'NO_TAX': { rate: 0, code: '0' },
  'VAT_7': { rate: 7, code: '2' },
  'VAT_19': { rate: 19, code: '3' },
  'EU_VAT': { rate: 0, code: '10' },
  'REVERSE_CHARGE': { rate: 0, code: '13' },
};

// Format number for DATEV (German decimal format)
export const formatNumber = (num: number, decimals = 2): string => {
  return num.toFixed(decimals).replace('.', DECIMAL_SEP);
};

// Format date for DATEV (DDMM)
export const formatDateDATEV = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}${month}`;
};

// Format date for header (YYYYMMDD)
const formatDateFull = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
};

// Escape text for DATEV (remove special characters)
const escapeText = (text: string, maxLength = 60): string => {
  return text
    .replace(/[;"\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength);
};

class DATEVService {
  /**
   * Export bookings to DATEV format
   */
  exportBookings(
    bookings: DATEVBooking[],
    options: DATEVExportOptions
  ): string {
    const lines: string[] = [];

    // Build header (EXTF format, version 700)
    const header = this.buildHeader(options, 'Buchungsstapel', bookings.length);
    lines.push(header);

    // Build column header
    const columnHeader = this.buildBookingColumnHeader();
    lines.push(columnHeader);

    // Build booking lines
    for (const booking of bookings) {
      const line = this.buildBookingLine(booking, options);
      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Export accounts to DATEV format
   */
  exportAccounts(
    accounts: DATEVAccount[],
    options: DATEVExportOptions
  ): string {
    const lines: string[] = [];

    // Header
    const header = this.buildHeader(options, 'Kontenbeschriftungen', accounts.length);
    lines.push(header);

    // Column header
    lines.push(['Konto', 'Kontobeschriftung', 'SprachId'].join(FIELD_SEP));

    // Account lines
    for (const account of accounts) {
      lines.push([
        account.accountNumber,
        `"${escapeText(account.name, 40)}"`,
        'de-DE',
      ].join(FIELD_SEP));
    }

    return lines.join('\n');
  }

  /**
   * Export customers (Debitoren) to DATEV format
   */
  exportCustomers(
    customers: DATEVCustomer[],
    options: DATEVExportOptions
  ): string {
    const lines: string[] = [];

    // Header
    const header = this.buildHeader(options, 'Debitoren/Kreditoren', customers.length);
    lines.push(header);

    // Column header
    const columns = [
      'Konto', 'Name (Adressattyp Unternehmen)', 'Unternehmensgegenstand',
      'Straße', 'Postfach', 'PLZ', 'Ort', 'Land', 'Telefon',
      'E-Mail', 'Internet', 'USt-IdNr.', 'Steuernummer',
      'Bankverbindung', 'IBAN', 'BIC', 'Kunden-/Lieferantennummer',
    ];
    lines.push(columns.join(FIELD_SEP));

    // Customer lines
    for (const customer of customers) {
      lines.push([
        customer.accountNumber,
        `"${escapeText(customer.name, 50)}"`,
        '', // Unternehmensgegenstand
        customer.street ? `"${escapeText(customer.street, 36)}"` : '',
        '', // Postfach
        customer.zipCode || '',
        customer.city ? `"${escapeText(customer.city, 30)}"` : '',
        customer.country || 'DE',
        customer.phone || '',
        customer.email || '',
        '', // Internet
        customer.vatId || '',
        '', // Steuernummer
        '', // Bankverbindung
        '', // IBAN
        '', // BIC
        '', // Kunden-/Lieferantennummer
      ].join(FIELD_SEP));
    }

    return lines.join('\n');
  }

  /**
   * Export suppliers (Kreditoren) to DATEV format
   */
  exportSuppliers(
    suppliers: DATEVSupplier[],
    options: DATEVExportOptions
  ): string {
    const lines: string[] = [];

    // Header
    const header = this.buildHeader(options, 'Debitoren/Kreditoren', suppliers.length);
    lines.push(header);

    // Column header (same as customers)
    const columns = [
      'Konto', 'Name (Adressattyp Unternehmen)', 'Unternehmensgegenstand',
      'Straße', 'Postfach', 'PLZ', 'Ort', 'Land', 'Telefon',
      'E-Mail', 'Internet', 'USt-IdNr.', 'Steuernummer',
      'Bankverbindung', 'IBAN', 'BIC', 'Kunden-/Lieferantennummer',
    ];
    lines.push(columns.join(FIELD_SEP));

    // Supplier lines
    for (const supplier of suppliers) {
      lines.push([
        supplier.accountNumber,
        `"${escapeText(supplier.name, 50)}"`,
        '', // Unternehmensgegenstand
        supplier.street ? `"${escapeText(supplier.street, 36)}"` : '',
        '', // Postfach
        supplier.zipCode || '',
        supplier.city ? `"${escapeText(supplier.city, 30)}"` : '',
        supplier.country || 'DE',
        '', // Telefon
        '', // E-Mail
        '', // Internet
        supplier.vatId || '',
        '', // Steuernummer
        '', // Bankverbindung
        supplier.iban || '',
        supplier.bic || '',
        '', // Kunden-/Lieferantennummer
      ].join(FIELD_SEP));
    }

    return lines.join('\n');
  }

  /**
   * Full export to DATEV
   */
  async fullExport(
    bookings: DATEVBooking[],
    accounts: DATEVAccount[],
    customers: DATEVCustomer[],
    suppliers: DATEVSupplier[],
    options: DATEVExportOptions
  ): Promise<DATEVExportResult> {
    const errors: string[] = [];
    const files: DATEVExportResult['files'] = [];

    // Validate options
    if (options.consultant.length !== 7) {
      errors.push('Beraternummer muss 7-stellig sein');
    }
    if (options.client.length > 5) {
      errors.push('Mandantennummer darf maximal 5-stellig sein');
    }

    // Export bookings
    if (bookings.length > 0) {
      try {
        const content = this.exportBookings(bookings, options);
        files.push({
          name: `EXTF_Buchungsstapel_${formatDateFull(new Date())}.csv`,
          content,
          type: 'booking',
        });
      } catch (e) {
        errors.push(`Fehler beim Export der Buchungen: ${e}`);
      }
    }

    // Export accounts
    if (accounts.length > 0) {
      try {
        const content = this.exportAccounts(accounts, options);
        files.push({
          name: `EXTF_Kontenbeschriftungen_${formatDateFull(new Date())}.csv`,
          content,
          type: 'account',
        });
      } catch (e) {
        errors.push(`Fehler beim Export der Konten: ${e}`);
      }
    }

    // Export customers
    if (customers.length > 0) {
      try {
        const content = this.exportCustomers(customers, options);
        files.push({
          name: `EXTF_Debitoren_${formatDateFull(new Date())}.csv`,
          content,
          type: 'customer',
        });
      } catch (e) {
        errors.push(`Fehler beim Export der Debitoren: ${e}`);
      }
    }

    // Export suppliers
    if (suppliers.length > 0) {
      try {
        const content = this.exportSuppliers(suppliers, options);
        files.push({
          name: `EXTF_Kreditoren_${formatDateFull(new Date())}.csv`,
          content,
          type: 'supplier',
        });
      } catch (e) {
        errors.push(`Fehler beim Export der Kreditoren: ${e}`);
      }
    }

    // Calculate statistics
    const totalDebit = bookings.reduce((sum, b) => sum + b.amount, 0);

    return {
      success: errors.length === 0,
      files,
      statistics: {
        bookings: bookings.length,
        accounts: accounts.length,
        customers: customers.length,
        suppliers: suppliers.length,
        totalDebit,
        totalCredit: totalDebit, // In double-entry bookkeeping, these are equal
      },
      errors,
    };
  }

  /**
   * Download export as ZIP file
   */
  async downloadExport(result: DATEVExportResult): Promise<void> {
    // For simplicity, download files individually if JSZip is not available
    for (const file of result.files) {
      const blob = new Blob([file.content], { type: 'text/csv;charset=iso-8859-1' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Validate DATEV export options
   */
  validateOptions(options: DATEVExportOptions): string[] {
    const errors: string[] = [];

    if (!options.consultant || !/^\d{7}$/.test(options.consultant)) {
      errors.push('Beraternummer muss genau 7 Ziffern haben');
    }

    if (!options.client || !/^\d{1,5}$/.test(options.client)) {
      errors.push('Mandantennummer muss 1-5 Ziffern haben');
    }

    if (options.dateFrom > options.dateTo) {
      errors.push('Startdatum muss vor Enddatum liegen');
    }

    if (![4, 5, 6, 7, 8].includes(options.accountLength)) {
      errors.push('Kontenlänge muss zwischen 4 und 8 liegen');
    }

    return errors;
  }

  /**
   * Get tax code for common scenarios
   */
  getTaxCode(scenario: keyof typeof TAX_CODES): string {
    return TAX_CODES[scenario]?.code || '0';
  }

  // Private methods

  private buildHeader(
    options: DATEVExportOptions,
    dataType: string,
    recordCount: number
  ): string {
    const now = new Date();
    const fields = [
      '"EXTF"',                                    // Format
      '700',                                       // Version
      '21',                                        // Data category (21 = Buchungsstapel)
      `"${dataType}"`,                            // Dateibezeichnung
      '1',                                        // Versionsnummer
      formatDateFull(now),                        // Erzeugt am
      '',                                         // Importiert
      '"RE"',                                     // Herkunft (RE = Rechnungswesen)
      `"${escapeText(options.description || 'Bauplan Buddy Export', 25)}"`, // Exportiert von
      '',                                         // Importiert von
      options.consultant,                         // Beraternummer
      options.client.padStart(5, '0'),           // Mandantennummer
      formatDateFull(options.fiscalYearStart),   // WJ-Beginn
      options.accountLength.toString(),          // Sachkontenlänge
      formatDateFull(options.dateFrom),          // Datum von
      formatDateFull(options.dateTo),            // Datum bis
      `"${escapeText(options.description || '', 30)}"`, // Bezeichnung
      '',                                         // Diktatzeichen
      '1',                                        // Buchungstyp (1 = Finanzbuchführung)
      '0',                                        // Rechnungslegungszweck
      '',                                         // Festschreibung
      'EUR',                                      // WKZ
      '',                                         // Derivatskennzeichen
      '',                                         // Reserved
      '',                                         // Reserved
      '',                                         // SKR
      '',                                         // Branchen-Lösungs-Id
      '',                                         // Reserved
      '',                                         // Reserved
      '',                                         // Anwendungsinformation
    ];

    return fields.join(FIELD_SEP);
  }

  private buildBookingColumnHeader(): string {
    const columns = [
      'Umsatz (ohne Soll/Haben-Kz)',
      'Soll/Haben-Kennzeichen',
      'WKZ Umsatz',
      'Kurs',
      'Basis-Umsatz',
      'WKZ Basis-Umsatz',
      'Konto',
      'Gegenkonto (ohne BU-Schlüssel)',
      'BU-Schlüssel',
      'Belegdatum',
      'Belegfeld 1',
      'Belegfeld 2',
      'Skonto',
      'Buchungstext',
      'Postensperre',
      'Diverse Adressnummer',
      'Geschäftspartnerbank',
      'Sachverhalt',
      'Zinssperre',
      'Beleglink',
      'Beleginfo - Art 1',
      'Beleginfo - Inhalt 1',
      'Beleginfo - Art 2',
      'Beleginfo - Inhalt 2',
      'Beleginfo - Art 3',
      'Beleginfo - Inhalt 3',
      'Beleginfo - Art 4',
      'Beleginfo - Inhalt 4',
      'Beleginfo - Art 5',
      'Beleginfo - Inhalt 5',
      'Beleginfo - Art 6',
      'Beleginfo - Inhalt 6',
      'Beleginfo - Art 7',
      'Beleginfo - Inhalt 7',
      'Beleginfo - Art 8',
      'Beleginfo - Inhalt 8',
      'KOST1 - Kostenstelle',
      'KOST2 - Kostenstelle',
      'KOST-Menge',
      'EU-Mitgliedstaat u. UStIdNr.',
      'EU-Steuersatz',
      'Abweichende Versteuerungsart',
      'Sachverhalt L+L',
      'Funktionsergänzung L+L',
      'BU 49 Hauptfunktionstyp',
      'BU 49 Hauptfunktionsnummer',
      'BU 49 Funktionsergänzung',
      'Zusatzinformation - Art 1',
      'Zusatzinformation - Inhalt 1',
      'Zusatzinformation - Art 2',
      'Zusatzinformation - Inhalt 2',
      'Zusatzinformation - Art 3',
      'Zusatzinformation - Inhalt 3',
      'Zusatzinformation - Art 4',
      'Zusatzinformation - Inhalt 4',
      'Zusatzinformation - Art 5',
      'Zusatzinformation - Inhalt 5',
      'Zusatzinformation - Art 6',
      'Zusatzinformation - Inhalt 6',
      'Zusatzinformation - Art 7',
      'Zusatzinformation - Inhalt 7',
      'Zusatzinformation - Art 8',
      'Zusatzinformation - Inhalt 8',
      'Zusatzinformation - Art 9',
      'Zusatzinformation - Inhalt 9',
      'Zusatzinformation - Art 10',
      'Zusatzinformation - Inhalt 10',
      'Zusatzinformation - Art 11',
      'Zusatzinformation - Inhalt 11',
      'Zusatzinformation - Art 12',
      'Zusatzinformation - Inhalt 12',
      'Zusatzinformation - Art 13',
      'Zusatzinformation - Inhalt 13',
      'Zusatzinformation - Art 14',
      'Zusatzinformation - Inhalt 14',
      'Zusatzinformation - Art 15',
      'Zusatzinformation - Inhalt 15',
      'Zusatzinformation - Art 16',
      'Zusatzinformation - Inhalt 16',
      'Zusatzinformation - Art 17',
      'Zusatzinformation - Inhalt 17',
      'Zusatzinformation - Art 18',
      'Zusatzinformation - Inhalt 18',
      'Zusatzinformation - Art 19',
      'Zusatzinformation - Inhalt 19',
      'Zusatzinformation - Art 20',
      'Zusatzinformation - Inhalt 20',
      'Stück',
      'Gewicht',
      'Zahlweise',
      'Forderungsart',
      'Veranlagungsjahr',
      'Zugeordnete Fälligkeit',
      'Skontotyp',
      'Auftragsnummer',
      'Buchungstyp',
      'USt-Schlüssel (Anzahlungen)',
      'EU-Mitgliedstaat (Anzahlungen)',
      'Sachverhalt L+L (Anzahlungen)',
      'EU-Steuersatz (Anzahlungen)',
      'Erlöskonto (Anzahlungen)',
      'Herkunft-Kz',
      'Buchungs GUID',
      'KOST-Datum',
      'SEPA-Mandatsreferenz',
      'Skontosperre',
      'Gesellschaftername',
      'Beteiligtennummer',
      'Identifikationsnummer',
      'Zeichnernummer',
      'Postensperre bis',
      'Bezeichnung SoBil-Sachverhalt',
      'Kennzeichen SoBil-Buchung',
      'Festschreibung',
      'Leistungsdatum',
      'Datum Zuord. Steuerperiode',
    ];

    return columns.join(FIELD_SEP);
  }

  private buildBookingLine(
    booking: DATEVBooking,
    options: DATEVExportOptions
  ): string {
    const fields = [
      formatNumber(Math.abs(booking.amount)),     // Umsatz
      booking.amount >= 0 ? 'S' : 'H',            // Soll/Haben
      booking.currency || 'EUR',                   // WKZ
      booking.exchangeRate ? formatNumber(booking.exchangeRate, 6) : '', // Kurs
      '',                                          // Basis-Umsatz
      '',                                          // WKZ Basis-Umsatz
      booking.debitAccount,                        // Konto
      booking.creditAccount,                       // Gegenkonto
      booking.taxCode || '',                       // BU-Schlüssel
      formatDateDATEV(booking.date),              // Belegdatum
      `"${escapeText(booking.documentNumber, 36)}"`, // Belegfeld 1
      '',                                          // Belegfeld 2
      '',                                          // Skonto
      `"${escapeText(booking.description, 60)}"`, // Buchungstext
      '',                                          // Postensperre
      '',                                          // Diverse Adressnummer
      '',                                          // Geschäftspartnerbank
      '',                                          // Sachverhalt
      '',                                          // Zinssperre
      '',                                          // Beleglink
    ];

    // Add empty fields for remaining columns
    const remainingFields = 96 - fields.length;
    for (let i = 0; i < remainingFields; i++) {
      if (i === 16 && booking.costCenter) {
        // KOST1
        fields.push(`"${escapeText(booking.costCenter, 8)}"`);
      } else if (i === 17 && booking.costUnit) {
        // KOST2
        fields.push(`"${escapeText(booking.costUnit, 8)}"`);
      } else {
        fields.push('');
      }
    }

    return fields.join(FIELD_SEP);
  }
}

// Export singleton
export const datevService = new DATEVService();
export default datevService;
