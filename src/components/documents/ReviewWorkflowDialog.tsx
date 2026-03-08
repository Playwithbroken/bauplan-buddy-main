import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, User, MessageSquare,
  Send, ThumbsUp, ThumbsDown, Eye, FileText, Loader2
} from "lucide-react";
// Add DialogFrame for standardized dialog layout
import { DialogFrame } from "@/components/ui/dialog-frame";

interface ReviewStep {
  id: string;
  title: string;
  reviewer: string;
  reviewerRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  comments?: string;
  completedAt?: string;
  required: boolean;
}

interface ReviewWorkflow {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  initiator: string;
  createdAt: string;
  status: 'draft' | 'in-review' | 'approved' | 'rejected';
  steps: ReviewStep[];
  currentStepIndex: number;
}

interface ReviewWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow?: ReviewWorkflow;
  onApprove?: (workflowId: string, comments: string) => void;
  onReject?: (workflowId: string, comments: string) => void;
  onRequestChanges?: (workflowId: string, comments: string) => void;
}

export const ReviewWorkflowDialog: React.FC<ReviewWorkflowDialogProps> = ({
  open,
  onOpenChange,
  workflow,
  onApprove,
  onReject,
  onRequestChanges,
}) => {
  const [comments, setComments] = useState("");
  const [action, setAction] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock workflow if none provided
  const mockWorkflow: ReviewWorkflow = {
    id: "WF-2024-001",
    documentId: "DOC-2024-123",
    documentTitle: "Projektplan_Neubau_Q1_2024.pdf",
    documentType: "Bauplan",
    initiator: "Max Mustermann",
    createdAt: "2024-03-15T10:30:00",
    status: 'in-review',
    currentStepIndex: 1,
    steps: [
      {
        id: "step-1",
        title: "Technische Prüfung",
        reviewer: "Anna Schmidt",
        reviewerRole: "Architektin",
        status: 'approved',
        comments: "Alle technischen Anforderungen erfüllt. Freigabe erteilt.",
        completedAt: "2024-03-16T09:15:00",
        required: true,
      },
      {
        id: "step-2",
        title: "Qualitätssicherung",
        reviewer: "Tom Weber",
        reviewerRole: "Qualitätsmanager",
        status: 'in-review',
        required: true,
      },
      {
        id: "step-3",
        title: "Bauleitung Freigabe",
        reviewer: "Klaus Müller",
        reviewerRole: "Bauleiter",
        status: 'pending',
        required: true,
      },
      {
        id: "step-4",
        title: "Finale Genehmigung",
        reviewer: "Dr. Lisa Weber",
        reviewerRole: "Geschäftsführung",
        status: 'pending',
        required: true,
      },
    ],
  };

  const currentWorkflow = workflow || mockWorkflow;
  const currentStep = currentWorkflow.steps[currentWorkflow.currentStepIndex];
  const progress = ((currentWorkflow.currentStepIndex + 1) / currentWorkflow.steps.length) * 100;

  const getStatusIcon = (status: ReviewStep['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in-review':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ReviewStep['status']) => {
    const styles = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'in-review': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    
    const labels = {
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      'in-review': 'In Prüfung',
      pending: 'Ausstehend',
    };

    return (
      <Badge className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleSubmitReview = async () => {
    if (!action) return;

    setIsSubmitting(true);
    try {
      switch (action) {
        case 'approve':
          onApprove?.(currentWorkflow.id, comments);
          break;
        case 'reject':
          onReject?.(currentWorkflow.id, comments);
          break;
        case 'changes':
          onRequestChanges?.(currentWorkflow.id, comments);
          break;
      }

      setComments("");
      setAction(null);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canReview = currentStep?.status === 'in-review';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        showFullscreenToggle
        defaultFullscreen
        width="fit-content"
        minWidth={700}
        maxWidth={1100}
        title={
          <span className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Prüfungsworkflow</span>
          </span>
        }
        description={
          <DialogDescription>
            Dokument-Freigabeprozess und Genehmigungsstatus
          </DialogDescription>
        }
        footer={
          <div className="flex justify-end gap-2">
            {/* View-only footer; actionable footer is inside the review card when canReview */}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Document Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Dokument</Label>
                  <p className="font-medium">{currentWorkflow.documentTitle}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Typ</Label>
                  <p className="font-medium">{currentWorkflow.documentType}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Initiiert von</Label>
                  <p className="font-medium">{currentWorkflow.initiator}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Datum</Label>
                  <p className="font-medium">
                    {new Date(currentWorkflow.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Fortschritt</span>
              <span className="text-muted-foreground">
                Schritt {currentWorkflow.currentStepIndex + 1} von {currentWorkflow.steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Review Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold">Prüfungsschritte</h3>
            {currentWorkflow.steps.map((step, index) => (
              <div
                key={step.id}
                className={`border rounded-lg p-4 transition-all ${
                  index === currentWorkflow.currentStepIndex ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {step.status === 'pending' ? (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    ) : (
                      getStatusIcon(step.status)
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          <span>{step.reviewer}</span>
                          <span>•</span>
                          <span>{step.reviewerRole}</span>
                        </div>
                      </div>
                      {getStatusBadge(step.status)}
                    </div>

                    {step.comments && (
                      <div className="bg-muted p-3 rounded text-sm">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p>{step.comments}</p>
                        </div>
                      </div>
                    )}

                    {step.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Abgeschlossen am {new Date(step.completedAt).toLocaleString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Review Action (if current reviewer) */}
          {canReview && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Ihre Prüfung erforderlich</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comments">Kommentare / Feedback</Label>
                  <Textarea
                    id="review-comments"
                    placeholder="Fügen Sie Ihre Anmerkungen hinzu..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-action">Aktion</Label>
                  <Select
                    value={action || undefined}
                    onValueChange={(value) => setAction(value as 'approve' | 'reject' | 'changes')}
                  >
                    <SelectTrigger id="review-action">
                      <SelectValue placeholder="Aktion wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">
                        <div className="flex items-center space-x-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span>Genehmigen</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="changes">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span>Änderungen anfordern</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="reject">
                        <div className="flex items-center space-x-2">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          <span>Ablehnen</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!action || !comments.trim() || isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? (
                      'Wird gesendet...'
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />
                      Prüfung absenden</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Only Mode */}
          {!canReview && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Eye className="h-4 w-4" />
                <span>Sie können diesen Workflow nur ansehen</span>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>
          )}
        </div>
      </DialogFrame>
    </Dialog>
  );
};

export default ReviewWorkflowDialog;
