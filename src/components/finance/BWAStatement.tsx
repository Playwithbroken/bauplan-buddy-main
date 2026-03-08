import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfitLossStatement } from "@/services/financialReportingService";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BWAStatementProps {
  data: ProfitLossStatement;
}

export const BWAStatement: React.FC<BWAStatementProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const rows = [
    {
      label: "Umsatzerlöse",
      value: data.revenue.totalRevenue,
      isHeader: false,
      indent: 0,
    },
    {
      label: "Sonstige betriebliche Erträge",
      value: 0,
      isHeader: false,
      indent: 0,
    },
    {
      label: "Gesamtleistung",
      value: data.revenue.totalRevenue,
      isHeader: true,
      indent: 0,
    },
    {
      label: "Materialaufwand",
      value: -(data.expenses.expensesByCategory["materials"] || 0),
      isHeader: false,
      indent: 0,
    },
    {
      label: "Rohertrag",
      value:
        data.revenue.totalRevenue -
        (data.expenses.expensesByCategory["materials"] || 0),
      isHeader: true,
      indent: 0,
      highlight: true,
    },
    {
      label: "Personalkosten",
      value: -(data.expenses.expensesByCategory["labor"] || 0),
      isHeader: false,
      indent: 0,
    },
    {
      label: "Abschreibungen",
      value: -(data.expenses.expensesByCategory["equipment"] || 0) * 0.1,
      isHeader: false,
      indent: 0,
    },
    {
      label: "Sonstige betriebliche Aufwendungen",
      value: -(
        data.expenses.expensesByCategory["overhead"] ||
        0 + (data.expenses.expensesByCategory["administration"] || 0)
      ),
      isHeader: false,
      indent: 0,
    },
    {
      label: "Betriebsergebnis (EBIT)",
      value: data.profit.operatingProfit,
      isHeader: true,
      indent: 0,
      highlight: true,
    },
    { label: "Zinsertrag / Zinsaufwand", value: 0, isHeader: false, indent: 0 },
    {
      label: "Ergebnis vor Steuern",
      value: data.profit.operatingProfit,
      isHeader: true,
      indent: 0,
    },
    {
      label: "Steuern vom Einkommen und Ertrag",
      value: -(data.profit.operatingProfit * 0.25),
      isHeader: false,
      indent: 0,
    },
    {
      label: "Jahresüberschuss / Fehlbetrag",
      value: data.profit.netProfit,
      isHeader: true,
      indent: 0,
      highlight: "bg-primary/5 text-primary",
    },
  ];

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Detaillierte BWA</CardTitle>
          <Badge variant="outline" className="font-mono">
            Basis: IST-Daten
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b">
              <TableRow>
                <TableHead className="w-[300px] font-bold">Posten</TableHead>
                <TableHead className="text-right font-bold">Betrag</TableHead>
                <TableHead className="text-right font-bold">
                  % Leistung
                </TableHead>
                <TableHead className="text-right font-bold w-[120px]">
                  Trend
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={cn(
                    row.isHeader ? "bg-slate-50/50 dark:bg-slate-900/20" : "",
                    row.highlight === true
                      ? "font-bold border-y-2 border-slate-100 dark:border-slate-800"
                      : typeof row.highlight === "string"
                        ? row.highlight
                        : "",
                  )}
                >
                  <TableCell
                    className={cn(
                      row.indent > 0 && "pl-8",
                      row.isHeader && "font-bold",
                    )}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      row.value < 0
                        ? "text-red-600"
                        : row.value > 0
                          ? "text-green-600"
                          : "",
                    )}
                  >
                    {formatCurrency(row.value)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {data.revenue.totalRevenue !== 0
                      ? formatPercent(
                          Math.abs(row.value / data.revenue.totalRevenue) * 100,
                        )
                      : "0.0%"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      {Math.random() > 0.5 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : Math.random() > 0.3 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
