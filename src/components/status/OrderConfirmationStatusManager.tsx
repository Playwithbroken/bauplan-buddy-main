import React, { useState } from "react";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { DialogFrame } from "../ui/dialog-frame";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import {
  CheckCircle,
  Clock,
  Edit,
  XCircle,
  AlertCircle,
  Send,
  ArrowRight,
  MessageSquare,
  History,
  AlertTriangle,
} from "lucide-react";
import OrderConfirmationStatusService, {
  OrderConfirmationStatus,
  StatusChangeEvent,
  StatusTransition,
} from "../../services/orderConfirmationStatusService";
import { useToast } from "../../hooks/use-toast";

interface StatusManagerProps {
  orderConfirmationId: string;
  currentStatus: OrderConfirmationStatus;
  onStatusChange?: (
    newStatus: OrderConfirmationStatus,
    event: StatusChangeEvent
  ) => void;
  showHistory?: boolean;
  context?: Record<string, unknown>;
}

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition: StatusTransition;
  orderConfirmationId: string;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  onOpenChange,
  transition,
  orderConfirmationId,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        title="Statusänderung bestätigen"
        description={transition.description}
        width="max-w-xl"
        modal={false}
        onClose={() => onOpenChange(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Wird geändert..." : "Bestätigen"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <ArrowRight className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              Status wird geändert von "{transition.from}" zu "{transition.to}"
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Grund (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Grund für die Statusänderung..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export const OrderConfirmationStatusManager: React.FC<StatusManagerProps> = ({
  orderConfirmationId,
  currentStatus,
  onStatusChange,
  showHistory = false,
  context = {},
}) => {
  const { toast } = useToast();
  const statusService = OrderConfirmationStatusService.getInstance();

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [selectedTransition, setSelectedTransition] =
    useState<StatusTransition | null>(null);

  const statusInfo = statusService.getStatusInfo(currentStatus);
  const availableTransitions =
    statusService.getAvailableTransitions(currentStatus);
  const statusHistory = statusService.getStatusHistory(orderConfirmationId);
  const recommendedActions = statusService.getRecommendedActions(currentStatus);

  const getStatusIcon = (status: OrderConfirmationStatus) => {
    switch (status) {
      case "draft":
        return <Edit className="h-4 w-4" />;
      case "sent":
        return <Send className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OrderConfirmationStatus) => {
    switch (status) {
      case "draft":
        return "outline";
      case "sent":
        return "secondary";
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleStatusChange = async (
    transition: StatusTransition,
    reason?: string
  ) => {
    setIsChangingStatus(true);

    try {
      // Validate workflow rules
      const validation = statusService.validateWorkflowRules(
        orderConfirmationId,
        currentStatus,
        transition.to,
        context
      );

      if (!validation.valid) {
        toast({
          title: "Statusänderung nicht möglich",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }

      const result = await statusService.changeStatus(
        orderConfirmationId,
        currentStatus,
        transition.to,
        {
          userId: "current-user", // In a real app, get from auth context
          reason,
        }
      );

      if (result.success && result.event) {
        toast({
          title: "Status erfolgreich geändert",
          description: `Status wurde zu "${
            statusService.getStatusInfo(transition.to).label
          }" geändert`,
        });

        if (onStatusChange) {
          onStatusChange(transition.to, result.event);
        }
      } else {
        toast({
          title: "Fehler bei Statusänderung",
          description: result.error || "Unbekannter Fehler",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler bei Statusänderung",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsChangingStatus(false);
      setShowChangeDialog(false);
      setSelectedTransition(null);
    }
  };

  const initiateStatusChange = (transition: StatusTransition) => {
    if (transition.requiresConfirmation) {
      setSelectedTransition(transition);
      setShowChangeDialog(true);
    } else {
      handleStatusChange(transition);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            Aktueller Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge
                variant={getStatusColor(currentStatus)}
                className="text-base px-3 py-1"
              >
                {statusInfo.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Available Actions */}
          {availableTransitions.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Verfügbare Aktionen</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTransitions.map((transition) => (
                    <Button
                      key={`${transition.from}-${transition.to}`}
                      variant="outline"
                      size="sm"
                      onClick={() => initiateStatusChange(transition)}
                      disabled={isChangingStatus}
                      className="flex items-center gap-2"
                    >
                      {getStatusIcon(transition.to)}
                      {statusService.getStatusInfo(transition.to).label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Empfohlene nächste Schritte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendedActions.map((action, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {showHistory && statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Statusverlauf
            </CardTitle>
            <CardDescription>
              Chronologie aller Statusänderungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusHistory.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="mt-0.5">{getStatusIcon(event.toStatus)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={getStatusColor(event.toStatus)}
                        className="text-xs"
                      >
                        {statusService.getStatusInfo(event.toStatus).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString("de-DE")}
                      </span>
                    </div>
                    <p className="text-sm">
                      Status geändert von "
                      {statusService.getStatusInfo(event.fromStatus).label}" zu
                      "{statusService.getStatusInfo(event.toStatus).label}"
                    </p>
                    {event.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Grund: {event.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Change Dialog */}
      {selectedTransition && (
        <StatusChangeDialog
          open={showChangeDialog}
          onOpenChange={setShowChangeDialog}
          transition={selectedTransition}
          orderConfirmationId={orderConfirmationId}
          onConfirm={(reason) => handleStatusChange(selectedTransition, reason)}
          isLoading={isChangingStatus}
        />
      )}
    </div>
  );
};

export default OrderConfirmationStatusManager;
