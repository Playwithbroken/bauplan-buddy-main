/**
 * Payment Reminder Service & Component
 * Automated payment reminder workflows
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Bell,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Calendar,
  Euro,
  FileText,
  RefreshCw,
  Settings,
  ChevronRight,
} from "lucide-react";

export type PaymentStatus =
  | "pending" // Offen
  | "overdue" // Überfällig
  | "reminded" // Erinnert
  | "escalated" // Eskaliert
  | "paid" // Bezahlt
  | "disputed"; // Strittig

export type ReminderLevel = 1 | 2 | 3;

export interface PaymentItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  amount: number;
  dueDate: Date;
  invoiceDate: Date;
  status: PaymentStatus;
  reminderLevel: ReminderLevel;
  lastReminderDate?: Date;
  notes?: string;
  projectId?: string;
  projectName?: string;
}

export interface ReminderTemplate {
  level: ReminderLevel;
  subject: string;
  body: string;
  daysAfterDue: number;
}

// Default reminder templates
const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  {
    level: 1,
    subject: "Zahlungserinnerung - Rechnung {invoiceNumber}",
    body: `Sehr geehrte Damen und Herren,

wir möchten Sie freundlich daran erinnern, dass die Rechnung {invoiceNumber} vom {invoiceDate} über {amount} am {dueDate} fällig war.

Bitte überweisen Sie den offenen Betrag zeitnah auf unser Konto.

Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben als gegenstandslos.

Mit freundlichen Grüßen`,
    daysAfterDue: 7,
  },
  {
    level: 2,
    subject: "2. Mahnung - Rechnung {invoiceNumber}",
    body: `Sehr geehrte Damen und Herren,

leider haben wir trotz unserer Zahlungserinnerung den offenen Betrag von {amount} für die Rechnung {invoiceNumber} noch nicht erhalten.

Bitte überweisen Sie den Betrag innerhalb der nächsten 7 Tage, um weitere Maßnahmen zu vermeiden.

Falls Sie Fragen zur Rechnung haben, kontaktieren Sie uns bitte umgehend.

Mit freundlichen Grüßen`,
    daysAfterDue: 21,
  },
  {
    level: 3,
    subject: "Letzte Mahnung vor Inkasso - Rechnung {invoiceNumber}",
    body: `Sehr geehrte Damen und Herren,

trotz mehrfacher Aufforderung haben wir den Rechnungsbetrag von {amount} für die Rechnung {invoiceNumber} nicht erhalten.

Dies ist unsere letzte Mahnung. Sollte der Betrag nicht innerhalb von 7 Tagen auf unserem Konto eingehen, sehen wir uns gezwungen, die Forderung an ein Inkassounternehmen zu übergeben.

Die dabei entstehenden zusätzlichen Kosten gehen zu Ihren Lasten.

Mit freundlichen Grüßen`,
    daysAfterDue: 35,
  },
];

// Status configuration
const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Offen",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  overdue: {
    label: "Überfällig",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  reminded: {
    label: "Erinnert",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  escalated: {
    label: "Eskaliert",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  paid: {
    label: "Bezahlt",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  disputed: {
    label: "Strittig",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
};

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

// Calculate days overdue
const getDaysOverdue = (dueDate: Date): number => {
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

interface PaymentReminderManagerProps {
  payments: PaymentItem[];
  templates?: ReminderTemplate[];
  onSendReminder?: (paymentId: string, level: ReminderLevel) => Promise<void>;
  onMarkPaid?: (paymentId: string) => void;
  onMarkDisputed?: (paymentId: string, notes: string) => void;
  className?: string;
}

export function PaymentReminderManager({
  payments,
  templates = DEFAULT_TEMPLATES,
  onSendReminder,
  onMarkPaid,
  onMarkDisputed,
  className,
}: PaymentReminderManagerProps) {
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(
    new Set()
  );
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<PaymentItem | null>(
    null
  );
  const [reminderLevel, setReminderLevel] = useState<ReminderLevel>(1);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (filter === "all") return p.status !== "paid";
        return p.status === filter;
      })
      .sort((a, b) => {
        // Sort by overdue first, then by due date
        const aOverdue = getDaysOverdue(a.dueDate);
        const bOverdue = getDaysOverdue(b.dueDate);
        return bOverdue - aOverdue;
      });
  }, [payments, filter]);

  // Summary stats
  const stats = useMemo(() => {
    const unpaid = payments.filter((p) => p.status !== "paid");
    const overdue = unpaid.filter((p) => getDaysOverdue(p.dueDate) > 0);
    const totalOutstanding = unpaid.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = overdue.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalCount: unpaid.length,
      overdueCount: overdue.length,
      totalOutstanding,
      totalOverdue,
    };
  }, [payments]);

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedPayments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPayments.map((p) => p.id)));
    }
  };

  // Open reminder dialog
  const openReminderDialog = (payment: PaymentItem) => {
    setCurrentPayment(payment);
    setReminderLevel(Math.min(3, payment.reminderLevel + 1) as ReminderLevel);

    const template = templates.find((t) => t.level === reminderLevel);
    if (template) {
      setCustomMessage(
        template.body
          .replace("{invoiceNumber}", payment.invoiceNumber)
          .replace("{amount}", formatCurrency(payment.amount))
          .replace("{dueDate}", payment.dueDate.toLocaleDateString("de-DE"))
          .replace(
            "{invoiceDate}",
            payment.invoiceDate.toLocaleDateString("de-DE")
          )
      );
    }

    setSendDialogOpen(true);
  };

  // Send reminder
  const handleSendReminder = async () => {
    if (!currentPayment || !onSendReminder) return;

    setIsSending(true);
    try {
      await onSendReminder(currentPayment.id, reminderLevel);
      setSendDialogOpen(false);
      setCurrentPayment(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Zahlungserinnerungen
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as typeof filter)}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle offen</SelectItem>
                  <SelectItem value="pending">Offen</SelectItem>
                  <SelectItem value="overdue">Überfällig</SelectItem>
                  <SelectItem value="reminded">Erinnert</SelectItem>
                  <SelectItem value="escalated">Eskaliert</SelectItem>
                  <SelectItem value="disputed">Strittig</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Offen</p>
              <p className="font-bold">{stats.totalCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-center">
              <p className="text-xs text-muted-foreground">Überfällig</p>
              <p className="font-bold text-orange-600">{stats.overdueCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Summe offen</p>
              <p className="font-bold text-sm">
                {formatCurrency(stats.totalOutstanding)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-center">
              <p className="text-xs text-muted-foreground">Überfällig</p>
              <p className="font-bold text-sm text-red-600">
                {formatCurrency(stats.totalOverdue)}
              </p>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedPayments.size > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
              <span className="text-sm font-medium">
                {selectedPayments.size} ausgewählt
              </span>
              <Button size="sm" variant="outline" className="ml-auto gap-1">
                <Send className="h-3 w-3" />
                Sammel-Mahnung
              </Button>
            </div>
          )}

          {/* Payment list */}
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <Checkbox
                checked={
                  selectedPayments.size === filteredPayments.length &&
                  filteredPayments.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="flex-1">Rechnung</span>
              <span className="w-32 text-right">Betrag</span>
              <span className="w-24 text-center">Status</span>
              <span className="w-20 text-center">Tage</span>
              <span className="w-24" />
            </div>

            {/* Payments */}
            {filteredPayments.map((payment) => {
              const daysOverdue = getDaysOverdue(payment.dueDate);
              const statusConfig = STATUS_CONFIG[payment.status];

              return (
                <div
                  key={payment.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                    daysOverdue > 30 &&
                      "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
                    selectedPayments.has(payment.id) && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedPayments.has(payment.id)}
                    onCheckedChange={() => toggleSelection(payment.id)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {payment.invoiceNumber}
                      </span>
                      {payment.reminderLevel > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {payment.reminderLevel}. Mahnung
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {payment.clientName}
                      {payment.projectName && ` • ${payment.projectName}`}
                    </p>
                  </div>

                  <div className="w-32 text-right">
                    <p className="font-medium">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fällig: {payment.dueDate.toLocaleDateString("de-DE")}
                    </p>
                  </div>

                  <div className="w-24 text-center">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusConfig.color)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="w-20 text-center">
                    {daysOverdue > 0 ? (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          daysOverdue > 30
                            ? "text-red-600"
                            : daysOverdue > 14
                            ? "text-orange-600"
                            : "text-yellow-600"
                        )}
                      >
                        +{daysOverdue}
                      </span>
                    ) : daysOverdue < 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {daysOverdue}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Heute
                      </span>
                    )}
                  </div>

                  <div className="w-24 flex items-center gap-1 justify-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openReminderDialog(payment)}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mahnung senden</TooltipContent>
                    </Tooltip>

                    {payment.clientPhone && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Anrufen: {payment.clientPhone}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600"
                          onClick={() => onMarkPaid?.(payment.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Als bezahlt markieren</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}

            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Keine offenen Zahlungen</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Send reminder dialog */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Zahlungserinnerung senden</DialogTitle>
              <DialogDescription>
                {currentPayment && (
                  <>
                    Rechnung {currentPayment.invoiceNumber} an{" "}
                    {currentPayment.clientName}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Betrag
                  </Label>
                  <p className="font-medium">
                    {currentPayment && formatCurrency(currentPayment.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Fällig seit
                  </Label>
                  <p className="font-medium text-red-600">
                    {currentPayment && getDaysOverdue(currentPayment.dueDate)}{" "}
                    Tagen
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mahnstufe</Label>
                <Select
                  value={String(reminderLevel)}
                  onValueChange={(v) =>
                    setReminderLevel(Number(v) as ReminderLevel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1. Mahnung (freundlich)</SelectItem>
                    <SelectItem value="2">2. Mahnung (bestimmt)</SelectItem>
                    <SelectItem value="3">
                      3. Mahnung (Inkasso-Androhung)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nachricht</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Wird gesendet an: {currentPayment?.clientEmail}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSendDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={handleSendReminder} disabled={isSending}>
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Senden...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Mahnung senden
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

export default PaymentReminderManager;
