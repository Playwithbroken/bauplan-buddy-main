import React, { useState, useEffect } from "react";
import { MultiWindowDialog, DialogDescription } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  Table,
  Calendar,
  Check,
  X,
  Info,
  BarChart3,
} from "lucide-react";
import { StoredAppointment } from "@/services/appointmentService";
import { AppointmentExportService } from "@/services/appointmentExportService";

interface AppointmentExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: StoredAppointment[];
  defaultFormat?: "pdf" | "excel" | "ical";
  title?: string;
}

const AppointmentExportDialog = ({
  isOpen,
  onClose,
  appointments,
  defaultFormat = "pdf",
  title = "Terminübersicht",
}: AppointmentExportDialogProps) => {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf" | "excel" | "ical"
  >(defaultFormat);
  const [isExporting, setIsExporting] = useState(false);
  const [exportTitle, setExportTitle] = useState(title);

  useEffect(() => {
    if (isOpen) {
      setSelectedFormat(defaultFormat);
      setExportTitle(title);
      setIsExporting(false);
    }
  }, [isOpen, defaultFormat, title]);

  const exportFormats = [
    {
      value: "pdf" as const,
      label: "PDF-Dokument",
      description: "Druckfertige Übersicht aller Termine",
      icon: FileText,
      features: [
        "Druckfertig",
        "Vollständige Details",
        "Professionelles Layout",
      ],
    },
    {
      value: "excel" as const,
      label: "Excel/CSV-Tabelle",
      description: "Tabellendaten für weitere Bearbeitung",
      icon: Table,
      features: ["Bearbeitbar", "Filterbar", "Sortierbar"],
    },
    {
      value: "ical" as const,
      label: "iCal-Kalender",
      description: "Import in Outlook, Google Calendar, etc.",
      icon: Calendar,
      features: ["Kalender-Import", "Erinnerungen", "Synchronisation"],
    },
  ];

  const handleExport = async () => {
    if (appointments.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay for UX

      AppointmentExportService.exportAppointments({
        format: selectedFormat,
        appointments,
        title: exportTitle,
      });

      // Brief success state
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
    }
  };

  const statistics = AppointmentExportService.getExportStatistics(appointments);

  const getFormatInfo = (format: "pdf" | "excel" | "ical") => {
    const formatData = exportFormats.find((f) => f.value === format);
    return formatData || exportFormats[0];
  };

  const selectedFormatInfo = getFormatInfo(selectedFormat);

  if (!isOpen) {
    return null;
  }

  return (
    <MultiWindowDialog
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState) {
          onClose();
        }
      }}
    >
      <DialogFrame
        defaultFullscreen
        showFullscreenToggle
        modal={false}
        title={
          <span className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Termine exportieren</span>
          </span>
        }
        description={
          <DialogDescription>
            Exportieren Sie {appointments.length} Termine in verschiedenen
            Formaten
          </DialogDescription>
        }
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              onClick={handleExport}
              disabled={appointments.length === 0 || isExporting}
              className="flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exportiere...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Als {selectedFormatInfo.label} exportieren</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Export Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Export-Übersicht</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.total}
                  </div>
                  <div className="text-sm text-gray-500">Termine gesamt</div>
                </div>

                {statistics.dateRange && (
                  <>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {statistics.dateRange.start}
                      </div>
                      <div className="text-xs text-gray-500">
                        Frühester Termin
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {statistics.dateRange.end}
                      </div>
                      <div className="text-xs text-gray-500">
                        Spätester Termin
                      </div>
                    </div>
                  </>
                )}

                <div className="text-center">
                  <div className="text-sm font-medium">
                    {Object.keys(statistics.byType).length}
                  </div>
                  <div className="text-xs text-gray-500">
                    Verschiedene Typen
                  </div>
                </div>
              </div>

              {statistics.total > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Nach Typ:</h4>
                      <div className="space-y-1">
                        {Object.entries(statistics.byType).map(
                          ([type, count]) => (
                            <div
                              key={type}
                              className="flex justify-between text-xs"
                            >
                              <span className="capitalize">{type}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Nach Priorität:
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(statistics.byPriority).map(
                          ([priority, count]) => (
                            <div
                              key={priority}
                              className="flex justify-between text-xs"
                            >
                              <span className="capitalize">{priority}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export-Format wählen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="format-select">Format</Label>
                <Select
                  value={selectedFormat}
                  onValueChange={(value: "pdf" | "excel" | "ical") =>
                    setSelectedFormat(value)
                  }
                >
                  <SelectTrigger className="mt-1" id="format-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex items-center space-x-2">
                          <format.icon className="h-4 w-4" />
                          <span>{format.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Format Preview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <selectedFormatInfo.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedFormatInfo.label}
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      {selectedFormatInfo.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedFormatInfo.features.map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="text-xs"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          {appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Vorschau der zu exportierenden Termine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {appointments.slice(0, 5).map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {appointment.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(appointment.date).toLocaleDateString(
                            "de-DE"
                          )}{" "}
                          • {appointment.startTime}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {appointment.type}
                      </Badge>
                    </div>
                  ))}

                  {appointments.length > 5 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      ... und {appointments.length - 5} weitere Termine
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data Warning */}
          {appointments.length === 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-200">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Keine Termine zum Exportieren verfügbar
                  </span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  Erstellen Sie zunächst einige Termine, bevor Sie einen Export
                  durchführen können.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default AppointmentExportDialog;
