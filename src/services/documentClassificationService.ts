/**
 * Document Classification Service
 * AI-powered document classification for construction documents
 */

export type DocumentCategory = 
  | 'contract'           // Verträge
  | 'invoice'            // Rechnungen
  | 'quote'              // Angebote
  | 'permit'             // Genehmigungen
  | 'plan'               // Pläne/Zeichnungen
  | 'protocol'           // Protokolle
  | 'report'             // Berichte
  | 'correspondence'     // Korrespondenz
  | 'insurance'          // Versicherungen
  | 'safety'             // Sicherheitsdokumente
  | 'specification'      // Leistungsverzeichnisse
  | 'photo'              // Fotos
  | 'other';             // Sonstige

export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;
  alternativeCategories: Array<{ category: DocumentCategory; confidence: number }>;
  keywords: string[];
  suggestedTags: string[];
  language: 'de' | 'en';
  extractedMetadata: {
    date?: Date;
    amount?: number;
    parties?: string[];
    projectReference?: string;
    documentNumber?: string;
  };
}

export interface DocumentAnalysis {
  wordCount: number;
  pageCount?: number;
  hasImages: boolean;
  hasSignatures: boolean;
  hasTables: boolean;
  hasStamp: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
}

// Category labels in German
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: 'Vertrag',
  invoice: 'Rechnung',
  quote: 'Angebot',
  permit: 'Genehmigung',
  plan: 'Plan/Zeichnung',
  protocol: 'Protokoll',
  report: 'Bericht',
  correspondence: 'Korrespondenz',
  insurance: 'Versicherung',
  safety: 'Sicherheitsdokument',
  specification: 'Leistungsverzeichnis',
  photo: 'Foto',
  other: 'Sonstige',
};

// Keywords associated with each category (simplified for demo)
const CATEGORY_KEYWORDS: Record<DocumentCategory, string[]> = {
  contract: ['vertrag', 'vereinbarung', 'vertragspartner', 'unterschrift', 'laufzeit', 'kündigung'],
  invoice: ['rechnung', 'rechnungsnummer', 'betrag', 'mwst', 'zahlungsziel', 'konto', 'iban', 'netto', 'brutto'],
  quote: ['angebot', 'angebotsnummer', 'gültig bis', 'preis', 'position', 'leistung', 'honorar'],
  permit: ['genehmigung', 'bauamt', 'antrag', 'bescheid', 'erlaubnis', 'auflagen'],
  plan: ['grundriss', 'schnitt', 'ansicht', 'maßstab', 'zeichnung', 'cad', 'dwg'],
  protocol: ['protokoll', 'teilnehmer', 'tagesordnung', 'beschluss', 'ergebnis', 'termin'],
  report: ['bericht', 'gutachten', 'prüfung', 'ergebnis', 'empfehlung', 'mangel'],
  correspondence: ['betreff', 'sehr geehrte', 'mit freundlichen grüßen', 'antwort', 'anfrage'],
  insurance: ['versicherung', 'police', 'deckung', 'schaden', 'prämie', 'haftpflicht'],
  safety: ['sicherheit', 'arbeitsschutz', 'gefährdung', 'schutzausrüstung', 'notfall', 'sige'],
  specification: ['position', 'leistungsverzeichnis', 'menge', 'einheit', 'gewerk', 'lv'],
  photo: ['foto', 'bild', 'dokumentation', 'jpg', 'png'],
  other: [],
};

class DocumentClassificationService {
  /**
   * Classify a document based on its content
   */
  async classifyDocument(
    content: string,
    fileName?: string,
    mimeType?: string
  ): Promise<ClassificationResult> {
    // Normalize content
    const normalizedContent = content.toLowerCase();
    const words = normalizedContent.split(/\s+/);
    
    // Calculate scores for each category
    const scores: Record<DocumentCategory, number> = {
      contract: 0,
      invoice: 0,
      quote: 0,
      permit: 0,
      plan: 0,
      protocol: 0,
      report: 0,
      correspondence: 0,
      insurance: 0,
      safety: 0,
      specification: 0,
      photo: 0,
      other: 0,
    };

    // Score based on keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        const count = (normalizedContent.match(new RegExp(keyword, 'gi')) || []).length;
        scores[category as DocumentCategory] += count * 10;
      }
    }

    // Score based on file name patterns
    if (fileName) {
      const lowerFileName = fileName.toLowerCase();
      if (lowerFileName.includes('rechnung') || lowerFileName.includes('invoice')) {
        scores.invoice += 50;
      }
      if (lowerFileName.includes('angebot') || lowerFileName.includes('quote')) {
        scores.quote += 50;
      }
      if (lowerFileName.includes('vertrag') || lowerFileName.includes('contract')) {
        scores.contract += 50;
      }
      if (lowerFileName.includes('protokoll') || lowerFileName.includes('protocol')) {
        scores.protocol += 50;
      }
      if (lowerFileName.includes('plan') || lowerFileName.includes('zeichnung')) {
        scores.plan += 50;
      }
      if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(lowerFileName)) {
        scores.photo += 100;
      }
      if (/\.(dwg|dxf|ifc)$/i.test(lowerFileName)) {
        scores.plan += 100;
      }
    }

    // Score based on mime type
    if (mimeType) {
      if (mimeType.startsWith('image/')) {
        scores.photo += 80;
      }
    }

    // Find best category
    const sortedCategories = (Object.entries(scores) as [DocumentCategory, number][])
      .sort((a, b) => b[1] - a[1]);

    const topCategory = sortedCategories[0][0];
    const topScore = sortedCategories[0][1];
    const totalScore = sortedCategories.reduce((sum, [, score]) => sum + score, 0) || 1;
    const confidence = Math.min(0.95, topScore / Math.max(totalScore, 100));

    // Extract keywords found
    const foundKeywords = new Set<string>();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedContent.includes(keyword)) {
          foundKeywords.add(keyword);
        }
      }
    }

    // Extract metadata
    const extractedMetadata = this.extractMetadata(content);

    // Suggested tags based on category and content
    const suggestedTags = this.generateTags(topCategory, content, extractedMetadata);

    return {
      category: topCategory,
      confidence,
      alternativeCategories: sortedCategories.slice(1, 4).map(([cat, score]) => ({
        category: cat,
        confidence: score / Math.max(totalScore, 100),
      })),
      keywords: Array.from(foundKeywords).slice(0, 10),
      suggestedTags,
      language: this.detectLanguage(content),
      extractedMetadata,
    };
  }

  /**
   * Analyze document structure and content
   */
  async analyzeDocument(content: string): Promise<DocumentAnalysis> {
    const words = content.split(/\s+/).filter(Boolean);
    
    // Simple heuristics for demo
    const hasImages = /\[bild\]|\[foto\]|\[image\]/i.test(content);
    const hasSignatures = /unterschrift|signature|gez\./i.test(content);
    const hasTables = /\|.*\|.*\|/m.test(content) || /\t.*\t/m.test(content);
    const hasStamp = /stempel|stamp|siegel/i.test(content);

    // Sentiment analysis (very simplified)
    const positiveWords = ['gut', 'erfolgreich', 'positiv', 'zufrieden', 'excellent', 'good'];
    const negativeWords = ['mangel', 'fehler', 'problem', 'schlecht', 'verzögerung', 'defekt'];
    
    let sentimentScore = 0;
    const lowerContent = content.toLowerCase();
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) sentimentScore++;
    });
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) sentimentScore--;
    });

    const sentiment: DocumentAnalysis['sentiment'] = 
      sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';

    // Urgency detection
    let urgency: DocumentAnalysis['urgency'] = 'low';
    if (/dringend|urgent|sofort|eilig/i.test(content)) {
      urgency = 'critical';
    } else if (/frist|deadline|bis zum/i.test(content)) {
      urgency = 'high';
    } else if (/bitte|zeitnah/i.test(content)) {
      urgency = 'medium';
    }

    // Action required detection
    const actionRequired = /bitte.*prüfen|handlung erforderlich|action required|zu erledigen/i.test(content);

    return {
      wordCount: words.length,
      hasImages,
      hasSignatures,
      hasTables,
      hasStamp,
      sentiment,
      urgency,
      actionRequired,
    };
  }

  /**
   * Batch classify multiple documents
   */
  async classifyBatch(
    documents: Array<{ content: string; fileName?: string; mimeType?: string }>
  ): Promise<ClassificationResult[]> {
    return Promise.all(
      documents.map(doc => this.classifyDocument(doc.content, doc.fileName, doc.mimeType))
    );
  }

  // Private helpers

  private extractMetadata(content: string): ClassificationResult['extractedMetadata'] {
    const metadata: ClassificationResult['extractedMetadata'] = {};

    // Extract date patterns (German format: DD.MM.YYYY)
    const dateMatch = content.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      metadata.date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Extract amounts (Euro)
    const amountMatch = content.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:€|EUR|Euro)/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));
      metadata.amount = amount;
    }

    // Extract document/invoice numbers
    const docNumberMatch = content.match(
      /(?:Rechnungs?-?Nr\.?|Angebots?-?Nr\.?|Vertrags?-?Nr\.?|Dok\.?-?Nr\.?)[:\s]*([A-Z0-9\-\/]+)/i
    );
    if (docNumberMatch) {
      metadata.documentNumber = docNumberMatch[1].trim();
    }

    // Extract project reference
    const projectMatch = content.match(
      /(?:Projekt|Bauvorhaben|Objekt)[:\s]*([^\n,;]+)/i
    );
    if (projectMatch) {
      metadata.projectReference = projectMatch[1].trim().slice(0, 100);
    }

    return metadata;
  }

  private generateTags(
    category: DocumentCategory,
    content: string,
    metadata: ClassificationResult['extractedMetadata']
  ): string[] {
    const tags: string[] = [CATEGORY_LABELS[category]];

    // Add year if date found
    if (metadata.date) {
      tags.push(metadata.date.getFullYear().toString());
    }

    // Add project reference as tag
    if (metadata.projectReference) {
      tags.push(metadata.projectReference);
    }

    // Category-specific tags
    if (category === 'invoice') {
      if (metadata.amount) {
        if (metadata.amount > 10000) tags.push('Großbetrag');
        if (metadata.amount > 50000) tags.push('Freigabe erforderlich');
      }
    }

    if (category === 'permit') {
      if (/bauantrag/i.test(content)) tags.push('Bauantrag');
      if (/baugenehmigung/i.test(content)) tags.push('Genehmigt');
    }

    if (category === 'safety') {
      tags.push('Arbeitsschutz');
      if (/gefährdungsbeurteilung/i.test(content)) tags.push('Gefährdungsbeurteilung');
    }

    return tags.slice(0, 8);
  }

  private detectLanguage(content: string): 'de' | 'en' {
    const germanIndicators = ['und', 'der', 'die', 'das', 'ist', 'mit', 'für', 'von'];
    const englishIndicators = ['the', 'and', 'is', 'for', 'with', 'this', 'that'];

    const lowerContent = content.toLowerCase();
    let germanScore = 0;
    let englishScore = 0;

    germanIndicators.forEach(word => {
      germanScore += (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    });

    englishIndicators.forEach(word => {
      englishScore += (lowerContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    });

    return germanScore >= englishScore ? 'de' : 'en';
  }
}

// Export singleton
export const documentClassificationService = new DocumentClassificationService();
export default documentClassificationService;
