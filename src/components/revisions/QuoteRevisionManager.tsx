import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Clock,
  User,
  GitBranch,
  ArrowRight,
  Eye,
  RotateCcw,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Edit3,
  AlertCircle,
  CheckCircle,
  Archive,
  Euro
} from 'lucide-react';
import QuoteRevisionService, { QuoteRevision, QuoteChange, RevisionComparison } from '../../services/quoteRevisionService';
import { useToast } from '../../hooks/use-toast';

interface QuoteRevisionManagerProps {
  quoteId: string;
  onRevisionSelect?: (revision: QuoteRevision) => void;
  onRevisionRevert?: (revision: QuoteRevision) => void;
}

interface RevisionComparisonDialogProps {
  comparison: RevisionComparison | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RevertConfirmDialogProps {
  revision: QuoteRevision | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const RevisionComparisonDialog: React.FC<RevisionComparisonDialogProps> = ({
  comparison,
  open,
  onOpenChange
}) => {
  if (!comparison) return null;

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'modified': return <Edit3 className="h-4 w-4 text-blue-600" />;
      case 'removed': return <Minus className="h-4 w-4 text-red-600" />;
      default: return <Edit3 className="h-4 w-4" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-green-50 border-green-200';
      case 'modified': return 'bg-blue-50 border-blue-200';
      case 'removed': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Revision Comparison
          </DialogTitle>
          <DialogDescription>
            Comparing {comparison.fromRevision.version} → {comparison.toRevision.version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">From: Version {comparison.fromRevision.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Created: {new Date(comparison.fromRevision.createdAt).toLocaleString('de-DE')}</p>
                  <p>By: {comparison.fromRevision.createdBy}</p>
                  <p className="font-semibold">€{comparison.fromRevision.summary.grossAmount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">To: Version {comparison.toRevision.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Created: {new Date(comparison.toRevision.createdAt).toLocaleString('de-DE')}</p>
                  <p>By: {comparison.toRevision.createdBy}</p>
                  <p className="font-semibold">€{comparison.toRevision.summary.grossAmount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Change Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Change Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{comparison.summary.totalChanges}</p>
                  <p className="text-sm text-muted-foreground">Total Changes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{comparison.summary.addedPositions}</p>
                  <p className="text-sm text-muted-foreground">Added</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{comparison.summary.modifiedPositions}</p>
                  <p className="text-sm text-muted-foreground">Modified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{comparison.summary.removedPositions}</p>
                  <p className="text-sm text-muted-foreground">Removed</p>
                </div>
                <div>
                  <div className="flex items-center justify-center">
                    {comparison.summary.priceChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <p className={`text-2xl font-bold ${comparison.summary.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.summary.priceChange >= 0 ? '+' : ''}€{comparison.summary.priceChange.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">Price Change</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Changes */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Changes ({comparison.changes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-auto">
                {comparison.changes.map((change) => (
                  <div key={change.id} className={`border rounded-lg p-3 ${getChangeColor(change.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getChangeIcon(change.type)}
                        <div className="flex-1">
                          <p className="font-medium">{change.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Category: {change.category} • Field: {change.field}
                          </p>
                          {change.oldValue && change.newValue && (
                            <div className="mt-2 text-sm">
                              <p><span className="font-medium">Old:</span> {JSON.stringify(change.oldValue)}</p>
                              <p><span className="font-medium">New:</span> {JSON.stringify(change.newValue)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={getImpactColor(change.impact)} className="ml-2">
                        {change.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {comparison.changes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No changes detected between these revisions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RevertConfirmDialog: React.FC<RevertConfirmDialogProps> = ({
  revision,
  open,
  onOpenChange,
  onConfirm
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  if (!revision) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Revert to Version {revision.version}
          </DialogTitle>
          <DialogDescription>
            This will create a new revision based on version {revision.version}. 
            The current version will be preserved in the history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Important</p>
                <p className="text-xs text-muted-foreground">
                  Reverting will create a new major version and cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for revert *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're reverting to this version..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Revert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const QuoteRevisionManager: React.FC<QuoteRevisionManagerProps> = ({
  quoteId,
  onRevisionSelect,
  onRevisionRevert
}) => {
  const { toast } = useToast();
  const revisionService = QuoteRevisionService.getInstance();
  
  const [selectedRevisions, setSelectedRevisions] = useState<[string, string] | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [revertRevision, setRevertRevision] = useState<QuoteRevision | null>(null);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  const revisions = revisionService.getRevisions(quoteId);
  const currentRevision = revisionService.getCurrentRevision(quoteId);
  const stats = revisionService.getRevisionStats(quoteId);

  const handleCompareRevisions = (fromId: string, toId: string) => {
    setSelectedRevisions([fromId, toId]);
    setShowComparison(true);
  };

  const handleRevertRevision = (revision: QuoteRevision) => {
    setRevertRevision(revision);
    setShowRevertDialog(true);
  };

  const handleRevertConfirm = (reason: string) => {
    if (!revertRevision) return;

    const newRevision = revisionService.revertToRevision(revertRevision.id, reason);
    if (newRevision) {
      toast({
        title: "Revision reverted",
        description: `Successfully reverted to version ${revertRevision.version}`,
      });
      
      if (onRevisionRevert) {
        onRevisionRevert(newRevision);
      }
    }
    
    setShowRevertDialog(false);
    setRevertRevision(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'superseded': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'superseded': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const comparison = selectedRevisions 
    ? revisionService.compareRevisions(selectedRevisions[0], selectedRevisions[1])
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Quote Revisions</h3>
          <p className="text-muted-foreground">
            Track changes and manage quote versions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRevisions}</p>
                <p className="text-xs text-muted-foreground">Total Revisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{currentRevision?.version || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Current Version</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  €{currentRevision?.summary.grossAmount.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-muted-foreground">Current Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{currentRevision?.createdBy || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">Last Modified By</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revision Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Revision History</CardTitle>
          <CardDescription>
            All versions and changes for this quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revisions.map((revision, index) => (
              <div key={revision.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(revision.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold">Version {revision.version}</h4>
                    <Badge variant={getStatusColor(revision.status)}>
                      {revision.status}
                    </Badge>
                    {revision.isCurrentVersion && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {revision.reason}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(revision.createdAt).toLocaleString('de-DE')}
                    </span>
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {revision.createdBy}
                    </span>
                    <span className="flex items-center">
                      <Euro className="h-3 w-3 mr-1" />
                      €{revision.summary.grossAmount.toLocaleString()}
                    </span>
                    {revision.changes.length > 0 && (
                      <span>{revision.changesSummary}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRevisionSelect?.(revision)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {index < revisions.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCompareRevisions(revisions[index + 1].id, revision.id)}
                    >
                      <GitBranch className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {!revision.isCurrentVersion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevertRevision(revision)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {revisions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No revisions found for this quote</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Dialog */}
      <RevisionComparisonDialog
        comparison={comparison}
        open={showComparison}
        onOpenChange={setShowComparison}
      />

      {/* Revert Dialog */}
      <RevertConfirmDialog
        revision={revertRevision}
        open={showRevertDialog}
        onOpenChange={setShowRevertDialog}
        onConfirm={handleRevertConfirm}
      />
    </div>
  );
};

export default QuoteRevisionManager;