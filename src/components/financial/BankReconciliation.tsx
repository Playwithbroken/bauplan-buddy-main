/**
 * Bank Reconciliation Component
 * Match bank transactions with invoices and payments
 */

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  ArrowLeftRight,
  Check,
  X,
  Search,
  Link2,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Euro,
  Calendar,
  RefreshCw,
  Download,
  Upload,
  Filter,
} from "lucide-react";

export type TransactionType = "credit" | "debit";
export type MatchStatus = "matched" | "suggested" | "unmatched" | "ignored";

export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  reference?: string;
  amount: number;
  type: TransactionType;
  counterparty?: string;
  iban?: string;
  status: MatchStatus;
  matchedTo?: string; // invoice ID or payment ID
  matchConfidence?: number; // 0-100
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "partially_paid" | "overdue";
  remainingAmount?: number;
}

export interface ReconciliationSummary {
  totalTransactions: number;
  matched: number;
  suggested: number;
  unmatched: number;
  ignored: number;
  totalCredits: number;
  totalDebits: number;
  unreconciledAmount: number;
}

interface BankReconciliationProps {
  transactions: BankTransaction[];
  invoices: Invoice[];
  onMatch: (transactionId: string, invoiceId: string) => Promise<void>;
  onUnmatch: (transactionId: string) => Promise<void>;
  onIgnore: (transactionId: string, reason?: string) => Promise<void>;
  onImport?: (file: File) => Promise<void>;
  onExport?: () => void;
  className?: string;
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

// Status badge configuration
const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; color: string; icon: typeof Check }
> = {
  matched: { label: "Zugeordnet", color: "bg-green-500", icon: CheckCircle2 },
  suggested: { label: "Vorschlag", color: "bg-blue-500", icon: Link2 },
  unmatched: { label: "Offen", color: "bg-yellow-500", icon: AlertTriangle },
  ignored: { label: "Ignoriert", color: "bg-gray-500", icon: X },
};

export function BankReconciliation({
  transactions,
  invoices,
  onMatch,
  onUnmatch,
  onIgnore,
  onImport,
  onExport,
  className,
}: BankReconciliationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<BankTransaction | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [ignoreDialogOpen, setIgnoreDialogOpen] = useState(false);
  const [ignoreReason, setIgnoreReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "all" && t.type !== typeFilter) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          t.description.toLowerCase().includes(query) ||
          t.reference?.toLowerCase().includes(query) ||
          t.counterparty?.toLowerCase().includes(query) ||
          Math.abs(t.amount).toString().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [transactions, statusFilter, typeFilter, searchQuery]);

  // Calculate summary
  const summary: ReconciliationSummary = useMemo(() => {
    const matched = transactions.filter((t) => t.status === "matched");
    const suggested = transactions.filter((t) => t.status === "suggested");
    const unmatched = transactions.filter((t) => t.status === "unmatched");
    const ignored = transactions.filter((t) => t.status === "ignored");

    const credits = transactions.filter((t) => t.type === "credit");
    const debits = transactions.filter((t) => t.type === "debit");

    const unreconciledCredits = credits
      .filter((t) => t.status !== "matched" && t.status !== "ignored")
      .reduce((sum, t) => sum + t.amount, 0);
    const unreconciledDebits = debits
      .filter((t) => t.status !== "matched" && t.status !== "ignored")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalTransactions: transactions.length,
      matched: matched.length,
      suggested: suggested.length,
      unmatched: unmatched.length,
      ignored: ignored.length,
      totalCredits: credits.reduce((sum, t) => sum + t.amount, 0),
      totalDebits: debits.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      unreconciledAmount: unreconciledCredits - unreconciledDebits,
    };
  }, [transactions]);

  // Find suggested invoices for a transaction
  const getSuggestedInvoices = useCallback(
    (transaction: BankTransaction) => {
      if (transaction.type !== "credit") return [];

      return invoices
        .filter((inv) => {
          // Only show unpaid or partially paid invoices
          if (inv.status === "paid") return false;

          // Match by amount
          const amountMatch =
            Math.abs(inv.amount - transaction.amount) / inv.amount < 0.01;

          // Match by remaining amount if partially paid
          const remainingMatch =
            inv.remainingAmount &&
            Math.abs(inv.remainingAmount - transaction.amount) /
              inv.remainingAmount <
              0.01;

          // Match by reference
          const referenceMatch =
            transaction.reference?.includes(inv.number) ||
            transaction.description.includes(inv.number);

          // Match by client name
          const clientMatch =
            transaction.counterparty
              ?.toLowerCase()
              .includes(inv.clientName.toLowerCase()) ||
            transaction.description
              .toLowerCase()
              .includes(inv.clientName.toLowerCase());

          return amountMatch || remainingMatch || referenceMatch || clientMatch;
        })
        .map((inv) => {
          // Calculate confidence score
          let confidence = 50;

          if (Math.abs(inv.amount - transaction.amount) < 0.01)
            confidence += 30;
          if (
            transaction.reference?.includes(inv.number) ||
            transaction.description.includes(inv.number)
          )
            confidence += 15;
          if (
            transaction.counterparty?.toLowerCase() ===
            inv.clientName.toLowerCase()
          )
            confidence += 5;

          return { invoice: inv, confidence: Math.min(100, confidence) };
        })
        .sort((a, b) => b.confidence - a.confidence);
    },
    [invoices]
  );

  // Handle matching
  const handleMatch = async (invoiceId: string) => {
    if (!selectedTransaction) return;

    setIsProcessing(true);
    try {
      await onMatch(selectedTransaction.id, invoiceId);
      setMatchDialogOpen(false);
      setSelectedTransaction(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle unmatching
  const handleUnmatch = async (transactionId: string) => {
    setIsProcessing(true);
    try {
      await onUnmatch(transactionId);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle ignoring
  const handleIgnore = async () => {
    if (!selectedTransaction) return;

    setIsProcessing(true);
    try {
      await onIgnore(selectedTransaction.id, ignoreReason);
      setIgnoreDialogOpen(false);
      setSelectedTransaction(null);
      setIgnoreReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      await onImport(file);
    }
    e.target.value = "";
  };

  // Toggle transaction selection
  const toggleSelection = (id: string) => {
    setSelectedTransactions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const reconciledPercent =
    summary.totalTransactions > 0
      ? ((summary.matched + summary.ignored) / summary.totalTransactions) * 100
      : 0;

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank-Abstimmung
            </CardTitle>
            <div className="flex items-center gap-2">
              {onImport && (
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv,.mt940,.camt"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" className="gap-1">
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
              <span>
                {summary.matched + summary.ignored} von{" "}
                {summary.totalTransactions} abgestimmt
              </span>
              <span>{reconciledPercent.toFixed(0)}%</span>
            </div>
            <Progress value={reconciledPercent} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
              <p className="text-xs text-muted-foreground">Zugeordnet</p>
              <p className="font-bold text-green-600">{summary.matched}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center">
              <p className="text-xs text-muted-foreground">Vorschläge</p>
              <p className="font-bold text-blue-600">{summary.suggested}</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-center">
              <p className="text-xs text-muted-foreground">Offen</p>
              <p className="font-bold text-yellow-600">{summary.unmatched}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted text-center">
              <p className="text-xs text-muted-foreground">Nicht abgestimmt</p>
              <p
                className={cn(
                  "font-bold",
                  summary.unreconciledAmount < 0 ? "text-red-600" : ""
                )}
              >
                {formatCurrency(summary.unreconciledAmount)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="matched">Zugeordnet</SelectItem>
                <SelectItem value="suggested">Vorschlag</SelectItem>
                <SelectItem value="unmatched">Offen</SelectItem>
                <SelectItem value="ignored">Ignoriert</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
            >
              <SelectTrigger className="w-28 h-9">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="credit">Eingang</SelectItem>
                <SelectItem value="debit">Ausgang</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTransactions.map((transaction) => {
              const statusConfig = STATUS_CONFIG[transaction.status];
              const StatusIcon = statusConfig.icon;
              const suggestedMatches = getSuggestedInvoices(transaction);

              return (
                <div
                  key={transaction.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                    transaction.status === "suggested" &&
                      "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30",
                    selectedTransactions.has(transaction.id) && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={() => toggleSelection(transaction.id)}
                  />

                  {/* Amount */}
                  <div
                    className={cn(
                      "w-28 text-right font-medium",
                      transaction.type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {transaction.type === "credit" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {transaction.date.toLocaleDateString("de-DE")}
                      </span>
                      {transaction.counterparty && (
                        <>
                          <span>•</span>
                          <span className="truncate">
                            {transaction.counterparty}
                          </span>
                        </>
                      )}
                      {transaction.reference && (
                        <>
                          <span>•</span>
                          <span className="truncate">
                            Ref: {transaction.reference}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      transaction.status === "matched" && "text-green-600"
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>

                  {/* Match confidence */}
                  {transaction.matchConfidence && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs">
                          {transaction.matchConfidence}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Match-Konfidenz</TooltipContent>
                    </Tooltip>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {transaction.status === "matched" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUnmatch(transaction.id)}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zuordnung aufheben</TooltipContent>
                      </Tooltip>
                    )}

                    {(transaction.status === "unmatched" ||
                      transaction.status === "suggested") && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setMatchDialogOpen(true);
                              }}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Zuordnen</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIgnoreDialogOpen(true);
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ignorieren</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowLeftRight className="h-8 w-8 mx-auto mb-2" />
                <p>Keine Transaktionen gefunden</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Match dialog */}
        <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaktion zuordnen</DialogTitle>
              <DialogDescription>
                {selectedTransaction && (
                  <>
                    {formatCurrency(selectedTransaction.amount)} -{" "}
                    {selectedTransaction.description}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedTransaction &&
                getSuggestedInvoices(selectedTransaction).map(
                  ({ invoice, confidence }) => (
                    <div
                      key={invoice.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleMatch(invoice.id)}
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invoice.number}</span>
                          <Badge variant="outline" className="text-xs">
                            {confidence}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.clientName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fällig: {invoice.dueDate.toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    </div>
                  )
                )}

              {selectedTransaction &&
                getSuggestedInvoices(selectedTransaction).length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    Keine passenden Rechnungen gefunden
                  </p>
                )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMatchDialogOpen(false)}
              >
                Abbrechen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ignore dialog */}
        <Dialog open={ignoreDialogOpen} onOpenChange={setIgnoreDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaktion ignorieren</DialogTitle>
              <DialogDescription>
                Diese Transaktion wird bei der Abstimmung übersprungen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Grund (optional)</Label>
                <Textarea
                  value={ignoreReason}
                  onChange={(e) => setIgnoreReason(e.target.value)}
                  placeholder="z.B. Gebühren, interne Überweisung..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIgnoreDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button onClick={handleIgnore} disabled={isProcessing}>
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Ignorieren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

export default BankReconciliation;
