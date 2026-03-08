import { useState } from "react";
import { Euro, FolderOpen, Users, Download, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedDashboard } from "@/components/analytics/AdvancedDashboard";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("6months");

  return (
    <LayoutWithSidebar
      breadcrumbItems={[{ label: "Analytics" }]}
      pageTitle="Analytics"
    >
      <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Übersicht über Ihre Geschäftskennzahlen und Leistung
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] h-10 text-sm">
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Letzter Monat</SelectItem>
                <SelectItem value="3months">Letzte 3 Monate</SelectItem>
                <SelectItem value="6months">Letzte 6 Monate</SelectItem>
                <SelectItem value="1year">Letztes Jahr</SelectItem>
                <SelectItem value="all">Alle Zeit</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="subtle" size="compact">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="h-14 p-2 bg-muted/50 rounded-lg">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="revenue">Umsatz</TabsTrigger>
            <TabsTrigger value="projects">Projekte</TabsTrigger>
            <TabsTrigger value="customers">Kunden</TabsTrigger>
            <TabsTrigger value="custom">
              <Layout className="h-4 w-4 mr-2" />
              Anpassbar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 md:p-5">
              <AdvancedDashboard
                dashboardId="analytics-overview"
                editable={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 md:p-5">
              <AdvancedDashboard
                dashboardId="analytics-revenue"
                editable={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 md:p-5">
              <AdvancedDashboard
                dashboardId="analytics-projects"
                editable={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 md:p-5">
              <AdvancedDashboard
                dashboardId="analytics-customers"
                editable={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 md:p-5">
              <AdvancedDashboard
                dashboardId="analytics-custom"
                editable={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithSidebar>
  );
};

export default Analytics;
