/**
 * Quote Revision Service
 * 
 * Manages quote revisions, version tracking, and change history
 */

import { QuoteFormData, QuotePosition, QuoteSummary } from '../components/forms/EnhancedQuoteCreation';

export interface QuoteRevision {
  id: string;
  quoteId: string;
  version: string; // e.g., "1.0", "1.1", "2.0"
  majorVersion: number;
  minorVersion: number;
  data: QuoteFormData & { id: string; number: string };
  summary: QuoteSummary;
  changes: QuoteChange[];
  changesSummary: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'active' | 'superseded' | 'archived';
  reason: string;
  parentRevisionId?: string;
  isCurrentVersion: boolean;
}

export interface QuoteChange {
  id: string;
  type: 'added' | 'modified' | 'removed';
  category: 'position' | 'customer' | 'project' | 'pricing' | 'terms';
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface RevisionComparison {
  fromRevision: QuoteRevision;
  toRevision: QuoteRevision;
  changes: QuoteChange[];
  summary: {
    totalChanges: number;
    priceChange: number;
    priceChangePercentage: number;
    addedPositions: number;
    modifiedPositions: number;
    removedPositions: number;
  };
}

export class QuoteRevisionService {
  private static instance: QuoteRevisionService;
  
  // In a real application, this would be stored in a database
  private revisions: QuoteRevision[] = [];
  private revisionIdCounter = 1;

  public static getInstance(): QuoteRevisionService {
    if (!QuoteRevisionService.instance) {
      QuoteRevisionService.instance = new QuoteRevisionService();
    }
    return QuoteRevisionService.instance;
  }

  /**
   * Create initial revision for a new quote
   */
  public createInitialRevision(
    quoteData: QuoteFormData & { id: string; number: string },
    summary: QuoteSummary,
    createdBy: string = 'current-user'
  ): QuoteRevision {
    const revision: QuoteRevision = {
      id: `rev_${this.revisionIdCounter++}`,
      quoteId: quoteData.id,
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
      data: quoteData,
      summary,
      changes: [],
      changesSummary: 'Initial version created',
      createdAt: new Date().toISOString(),
      createdBy,
      status: 'active',
      reason: 'Initial quote creation',
      isCurrentVersion: true
    };

    this.revisions.push(revision);
    return revision;
  }

  /**
   * Create a new revision with changes
   */
  public createRevision(
    quoteId: string,
    updatedData: QuoteFormData & { id: string; number: string },
    updatedSummary: QuoteSummary,
    reason: string,
    isMajorChange: boolean = false,
    createdBy: string = 'current-user'
  ): QuoteRevision {
    const currentRevision = this.getCurrentRevision(quoteId);
    if (!currentRevision) {
      throw new Error('No current revision found for quote');
    }

    // Detect changes
    const changes = this.detectChanges(currentRevision.data, updatedData);
    
    // Determine version number
    const newMajorVersion = isMajorChange ? currentRevision.majorVersion + 1 : currentRevision.majorVersion;
    const newMinorVersion = isMajorChange ? 0 : currentRevision.minorVersion + 1;
    const newVersion = `${newMajorVersion}.${newMinorVersion}`;

    // Mark current revision as superseded
    currentRevision.isCurrentVersion = false;
    currentRevision.status = 'superseded';

    // Create new revision
    const newRevision: QuoteRevision = {
      id: `rev_${this.revisionIdCounter++}`,
      quoteId,
      version: newVersion,
      majorVersion: newMajorVersion,
      minorVersion: newMinorVersion,
      data: updatedData,
      summary: updatedSummary,
      changes,
      changesSummary: this.generateChangesSummary(changes),
      createdAt: new Date().toISOString(),
      createdBy,
      status: 'active',
      reason,
      parentRevisionId: currentRevision.id,
      isCurrentVersion: true
    };

    this.revisions.push(newRevision);
    return newRevision;
  }

  /**
   * Get current revision for a quote
   */
  public getCurrentRevision(quoteId: string): QuoteRevision | null {
    return this.revisions.find(rev => rev.quoteId === quoteId && rev.isCurrentVersion) || null;
  }

  /**
   * Get all revisions for a quote
   */
  public getRevisions(quoteId: string): QuoteRevision[] {
    return this.revisions
      .filter(rev => rev.quoteId === quoteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get specific revision by ID
   */
  public getRevision(revisionId: string): QuoteRevision | null {
    return this.revisions.find(rev => rev.id === revisionId) || null;
  }

  /**
   * Compare two revisions
   */
  public compareRevisions(fromRevisionId: string, toRevisionId: string): RevisionComparison | null {
    const fromRevision = this.getRevision(fromRevisionId);
    const toRevision = this.getRevision(toRevisionId);

    if (!fromRevision || !toRevision) {
      return null;
    }

    const changes = this.detectChanges(fromRevision.data, toRevision.data);
    const priceChange = toRevision.summary.grossAmount - fromRevision.summary.grossAmount;
    const priceChangePercentage = fromRevision.summary.grossAmount > 0 
      ? (priceChange / fromRevision.summary.grossAmount) * 100 
      : 0;

    // Count position changes
    const addedPositions = changes.filter(c => c.type === 'added' && c.category === 'position').length;
    const modifiedPositions = changes.filter(c => c.type === 'modified' && c.category === 'position').length;
    const removedPositions = changes.filter(c => c.type === 'removed' && c.category === 'position').length;

    return {
      fromRevision,
      toRevision,
      changes,
      summary: {
        totalChanges: changes.length,
        priceChange,
        priceChangePercentage,
        addedPositions,
        modifiedPositions,
        removedPositions
      }
    };
  }

  /**
   * Revert to a previous revision
   */
  public revertToRevision(revisionId: string, reason: string): QuoteRevision | null {
    const targetRevision = this.getRevision(revisionId);
    if (!targetRevision) {
      return null;
    }

    // Create new revision based on the target revision data
    return this.createRevision(
      targetRevision.quoteId,
      { ...targetRevision.data },
      { ...targetRevision.summary },
      `Reverted to version ${targetRevision.version}: ${reason}`,
      true // Mark as major change since it's a revert
    );
  }

  /**
   * Archive old revisions (keep only recent ones)
   */
  public archiveOldRevisions(quoteId: string, keepCount: number = 10): number {
    const quoteRevisions = this.getRevisions(quoteId);
    const toArchive = quoteRevisions.slice(keepCount);
    
    toArchive.forEach(revision => {
      if (!revision.isCurrentVersion) {
        revision.status = 'archived';
      }
    });

    return toArchive.length;
  }

  /**
   * Detect changes between two quote data sets
   */
  private detectChanges(oldData: QuoteFormData, newData: QuoteFormData): QuoteChange[] {
    const changes: QuoteChange[] = [];
    let changeId = 1;

    // Customer changes
    if (oldData.customer?.id !== newData.customer?.id) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'customer',
        field: 'customer',
        oldValue: oldData.customer?.name,
        newValue: newData.customer?.name,
        description: `Customer changed from "${oldData.customer?.name}" to "${newData.customer?.name}"`,
        impact: 'medium'
      });
    }

    // Project changes
    if (oldData.projectName !== newData.projectName) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'project',
        field: 'projectName',
        oldValue: oldData.projectName,
        newValue: newData.projectName,
        description: `Project name changed from "${oldData.projectName}" to "${newData.projectName}"`,
        impact: 'low'
      });
    }

    if (oldData.projectAddress !== newData.projectAddress) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'project',
        field: 'projectAddress',
        oldValue: oldData.projectAddress,
        newValue: newData.projectAddress,
        description: 'Project address updated',
        impact: 'low'
      });
    }

    if (oldData.validUntil !== newData.validUntil) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'project',
        field: 'validUntil',
        oldValue: oldData.validUntil,
        newValue: newData.validUntil,
        description: 'Quote validity period changed',
        impact: 'medium'
      });
    }

    // Position changes
    const positionChanges = this.detectPositionChanges(oldData.positions, newData.positions, changeId);
    changes.push(...positionChanges);
    changeId += positionChanges.length;

    // Pricing changes
    if (oldData.taxRate !== newData.taxRate) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'pricing',
        field: 'taxRate',
        oldValue: oldData.taxRate,
        newValue: newData.taxRate,
        description: `Tax rate changed from ${oldData.taxRate}% to ${newData.taxRate}%`,
        impact: 'high'
      });
    }

    if (oldData.discountType !== newData.discountType || oldData.discountValue !== newData.discountValue) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'pricing',
        field: 'discount',
        oldValue: { type: oldData.discountType, value: oldData.discountValue },
        newValue: { type: newData.discountType, value: newData.discountValue },
        description: 'Discount settings changed',
        impact: 'high'
      });
    }

    // Terms changes
    if (oldData.terms !== newData.terms) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'terms',
        field: 'terms',
        oldValue: oldData.terms,
        newValue: newData.terms,
        description: 'Terms and conditions updated',
        impact: 'low'
      });
    }

    if (oldData.notes !== newData.notes) {
      changes.push({
        id: `change_${changeId++}`,
        type: 'modified',
        category: 'terms',
        field: 'notes',
        oldValue: oldData.notes,
        newValue: newData.notes,
        description: 'Notes updated',
        impact: 'low'
      });
    }

    return changes;
  }

  /**
   * Detect position changes
   */
  private detectPositionChanges(oldPositions: QuotePosition[], newPositions: QuotePosition[], startId: number): QuoteChange[] {
    const changes: QuoteChange[] = [];
    let changeId = startId;

    // Create maps for easier comparison
    const oldPositionsMap = new Map(oldPositions.map(p => [p.id, p]));
    const newPositionsMap = new Map(newPositions.map(p => [p.id, p]));

    // Find removed positions
    oldPositions.forEach(oldPos => {
      if (!newPositionsMap.has(oldPos.id)) {
        changes.push({
          id: `change_${changeId++}`,
          type: 'removed',
          category: 'position',
          field: 'position',
          oldValue: oldPos,
          description: `Position "${oldPos.description}" removed`,
          impact: 'high'
        });
      }
    });

    // Find added positions
    newPositions.forEach(newPos => {
      if (!oldPositionsMap.has(newPos.id)) {
        changes.push({
          id: `change_${changeId++}`,
          type: 'added',
          category: 'position',
          field: 'position',
          newValue: newPos,
          description: `Position "${newPos.description}" added`,
          impact: 'high'
        });
      }
    });

    // Find modified positions
    newPositions.forEach(newPos => {
      const oldPos = oldPositionsMap.get(newPos.id);
      if (oldPos) {
        const positionChanges = this.detectSinglePositionChanges(oldPos, newPos, changeId);
        changes.push(...positionChanges);
        changeId += positionChanges.length;
      }
    });

    return changes;
  }

  /**
   * Detect changes in a single position
   */
  private detectSinglePositionChanges(oldPos: QuotePosition, newPos: QuotePosition, startId: number): QuoteChange[] {
    const changes: QuoteChange[] = [];
    let changeId = startId;

    const fieldsToCheck = [
      { field: 'description', impact: 'medium' as const },
      { field: 'quantity', impact: 'high' as const },
      { field: 'unit', impact: 'low' as const },
      { field: 'unitPrice', impact: 'high' as const },
      { field: 'category', impact: 'low' as const },
      { field: 'notes', impact: 'low' as const },
      { field: 'discount', impact: 'medium' as const }
    ];

    fieldsToCheck.forEach(({ field, impact }) => {
      if (oldPos[field] !== newPos[field]) {
        changes.push({
          id: `change_${changeId++}`,
          type: 'modified',
          category: 'position',
          field: `position.${field}`,
          oldValue: oldPos[field],
          newValue: newPos[field],
          description: `Position "${newPos.description}" ${field} changed`,
          impact
        });
      }
    });

    return changes;
  }

  /**
   * Generate a human-readable summary of changes
   */
  private generateChangesSummary(changes: QuoteChange[]): string {
    if (changes.length === 0) {
      return 'No changes';
    }

    const summaryParts: string[] = [];
    
    const positionChanges = changes.filter(c => c.category === 'position');
    if (positionChanges.length > 0) {
      const added = positionChanges.filter(c => c.type === 'added').length;
      const modified = positionChanges.filter(c => c.type === 'modified').length;
      const removed = positionChanges.filter(c => c.type === 'removed').length;
      
      if (added > 0) summaryParts.push(`${added} positions added`);
      if (modified > 0) summaryParts.push(`${modified} positions modified`);
      if (removed > 0) summaryParts.push(`${removed} positions removed`);
    }

    const otherChanges = changes.filter(c => c.category !== 'position');
    if (otherChanges.length > 0) {
      summaryParts.push(`${otherChanges.length} other changes`);
    }

    return summaryParts.join(', ');
  }

  /**
   * Get revision statistics
   */
  public getRevisionStats(quoteId?: string): {
    totalRevisions: number;
    averageRevisionsPerQuote: number;
    mostRevisedQuote: string | null;
    recentRevisions: QuoteRevision[];
  } {
    const relevantRevisions = quoteId 
      ? this.revisions.filter(rev => rev.quoteId === quoteId)
      : this.revisions;

    const quoteRevisionCounts: Record<string, number> = {};
    relevantRevisions.forEach(rev => {
      quoteRevisionCounts[rev.quoteId] = (quoteRevisionCounts[rev.quoteId] || 0) + 1;
    });

    const mostRevisedQuote = Object.entries(quoteRevisionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    const uniqueQuotes = Object.keys(quoteRevisionCounts).length;
    const averageRevisionsPerQuote = uniqueQuotes > 0 
      ? relevantRevisions.length / uniqueQuotes 
      : 0;

    const recentRevisions = relevantRevisions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalRevisions: relevantRevisions.length,
      averageRevisionsPerQuote,
      mostRevisedQuote,
      recentRevisions
    };
  }
}

export default QuoteRevisionService;