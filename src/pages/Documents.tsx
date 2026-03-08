import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  TrendingUp,
  Users,
  Calendar,
  FileSearch,
} from "lucide-react";
import { AdvancedDocumentManager } from "@/components/dialogs/AdvancedDocumentManager";
import AdvancedDocumentService from "@/services/advancedDocumentService";
import { OCRProcessor } from "@/components/documents/OCRProcessor";
import DocumentWorkflowManager from "@/components/documents/DocumentWorkflowManager";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";

const Documents = () => {
  const documentService = AdvancedDocumentService;
  const [analytics, setAnalytics] = React.useState(
    documentService.getDocumentAnalytics()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(documentService.getDocumentAnalytics());
    }, 30000);
    return () => clearInterval(interval);
  }, [documentService]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Dokumente" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Verwalten Sie alle Projektdokumente mit intelligenter
            Kategorisierung und OCR-Erkennung.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamt Dokumente
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalDocuments}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(analytics.totalSize)} Speicherplatz
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(analytics.categoryCounts).length}
              </div>
              <div className="text-xs text-muted-foreground">
                {Object.entries(analytics.categoryCounts).sort(
                  ([, a], [, b]) => (b as number) - (a as number)
                )[0]?.[0] || "Keine"}{" "}
                häufigste
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Nutzer
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.topUsers.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {analytics.topUsers[0]?.userName || "Keine"} am aktivsten
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bald ablaufend
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.expiringSoon.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Erinnerungen in 30 Tagen
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList className="h-14 p-2 bg-muted/50 rounded-lg">
            <TabsTrigger
              value="documents"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Dokumente verwalten
            </TabsTrigger>
            <TabsTrigger
              value="workflows"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Versionierung & Genehmigung
            </TabsTrigger>
            <TabsTrigger
              value="ocr"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              OCR Verarbeitung
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Detailanalyse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <AdvancedDocumentManager />
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <DocumentWorkflowManager
              onVersionSelect={(version) => {
                console.log("Version selected:", version);
              }}
              onWorkflowComplete={(workflow) => {
                console.log("Workflow completed:", workflow);
              }}
            />
          </TabsContent>

          <TabsContent value="ocr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Automatische Texterkennung (OCR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OCRProcessor
                  maxFiles={10}
                  onResultUpdate={(results) => {
                    console.log(
                      "OCR results updated:",
                      results.length,
                      "documents processed"
                    );
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload-Verlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.uploadTrends.slice(-6).map((trend) => (
                      <div
                        key={trend.month}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{trend.month}</span>
                        <Badge variant="outline">{trend.count} Dokumente</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Mitwirkende</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topUsers.slice(0, 5).map((user) => (
                      <div
                        key={user.userId}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{user.userName}</span>
                        <Badge variant="outline">{user.count} Uploads</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithSidebar>
  );
};

export default Documents;
