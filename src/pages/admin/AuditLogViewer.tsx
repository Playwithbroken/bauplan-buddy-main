import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Search,
  Download,
  Filter,
  User,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  action: string;
  resource?: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export default function AuditLogViewer() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    userId: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [filters, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Mock Data Generation for "Best in World" Demo
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network latency

      const actions = [
        "user.login",
        "project.create",
        "invoice.update",
        "settings.change",
        "report.export",
      ];
      const resources = ["project", "invoice", "quote", "user", "system"];

      const mockLogs: AuditLog[] = Array.from({ length: 50 }).map((_, i) => ({
        id: `log-${Date.now()}-${i}`,
        timestamp: new Date(
          Date.now() - Math.floor(Math.random() * 1000000000)
        ),
        userId: "u-1",
        user: {
          email: "demo@bauplan-buddy.de",
          firstName: "Max",
          lastName: "Mustermann",
        },
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        resourceId: `res-${Math.floor(Math.random() * 1000)}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        changes: { field: "status", oldValue: "pending", newValue: "active" },
      }));

      // Sort by date desc
      mockLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply Filters
      let filteredLogs = mockLogs;
      if (filters.action)
        filteredLogs = filteredLogs.filter((l) =>
          l.action.includes(filters.action)
        );
      if (filters.resource)
        filteredLogs = filteredLogs.filter(
          (l) => l.resource === filters.resource
        );

      setLogs(filteredLogs);
      setTotal(filteredLogs.length);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("POST"))
      return "bg-green-100 text-green-800";
    if (
      action.includes("update") ||
      action.includes("PUT") ||
      action.includes("PATCH")
    )
      return "bg-blue-100 text-blue-800";
    if (action.includes("delete") || action.includes("DELETE"))
      return "bg-red-100 text-red-800";
    if (action.includes("login")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const exportLogs = () => {
    const csv = [
      [
        "Timestamp",
        "User",
        "Action",
        "Resource",
        "Resource ID",
        "IP Address",
      ].join(","),
      ...logs.map((log) =>
        [
          log.timestamp.toISOString(),
          log.user.email,
          log.action,
          log.resource || "",
          log.resourceId || "",
          log.ipAddress || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all user actions and system changes
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Select
              value={filters.action}
              onValueChange={(value) =>
                setFilters({ ...filters, action: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resource</label>
            <Select
              value={filters.resource}
              onValueChange={(value) =>
                setFilters({ ...filters, resource: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All resources</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="quote">Quotes</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate
                    ? format(filters.startDate, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) =>
                    setFilters({ ...filters, startDate: date })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate
                    ? format(filters.endDate, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => setFilters({ ...filters, endDate: date })}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {logs.length} of {total} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {log.user.firstName} {log.user.lastName} (
                        {log.user.email})
                      </span>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      {log.resource && (
                        <Badge variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          {log.resource}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(log.timestamp), "PPpp")} • IP:{" "}
                      {log.ipAddress || "Unknown"}
                    </div>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-primary hover:underline">
                          View changes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 50 && (
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {Math.ceil(total / 50)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * 50 >= total}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
