/**
 * Enhanced CAD/BIM Viewer Component
 * Advanced viewer for construction plans and 3D models
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Eye,
  EyeOff,
  Move,
  Hand,
  MousePointer,
  Ruler,
  Box,
  FileText,
  Download,
  Share2,
  Printer,
  Grid3X3,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  Info,
  X,
} from "lucide-react";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  color?: string;
  type:
    | "structure"
    | "electrical"
    | "plumbing"
    | "hvac"
    | "annotation"
    | "dimension"
    | "other";
}

export interface MeasurementPoint {
  x: number;
  y: number;
  z?: number;
}

export interface Measurement {
  id: string;
  type: "distance" | "area" | "angle";
  points: MeasurementPoint[];
  value: number;
  unit: string;
}

export interface ModelInfo {
  name: string;
  format: string;
  version?: string;
  createdBy?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  fileSize?: number;
  dimensions?: { width: number; height: number; depth?: number };
}

export type ViewMode = "2d" | "3d";
export type Tool = "select" | "pan" | "measure" | "annotate";

interface CADViewerProps {
  /** Model/file URL or data */
  source: string;
  /** Model information */
  modelInfo?: ModelInfo;
  /** Initial layers */
  layers?: Layer[];
  /** View mode (2D or 3D) */
  initialViewMode?: ViewMode;
  /** Enable measurement tools */
  enableMeasurements?: boolean;
  /** Enable layer controls */
  enableLayers?: boolean;
  /** Enable annotations */
  enableAnnotations?: boolean;
  /** Custom class name */
  className?: string;
  /** Width */
  width?: number | string;
  /** Height */
  height?: number | string;
  /** Callback for measurements */
  onMeasurement?: (measurement: Measurement) => void;
  /** Callback for selection */
  onSelect?: (elementId: string | null) => void;
}

// Layer type icons and colors
const LAYER_CONFIG: Record<Layer["type"], { color: string; label: string }> = {
  structure: { color: "#6b7280", label: "Tragwerk" },
  electrical: { color: "#f59e0b", label: "Elektro" },
  plumbing: { color: "#3b82f6", label: "Sanitär" },
  hvac: { color: "#22c55e", label: "HVAC" },
  annotation: { color: "#ef4444", label: "Anmerkungen" },
  dimension: { color: "#8b5cf6", label: "Maße" },
  other: { color: "#gray", label: "Sonstige" },
};

// Default layers
const DEFAULT_LAYERS: Layer[] = [
  { id: "structure", name: "Tragwerk", visible: true, type: "structure" },
  { id: "walls", name: "Wände", visible: true, type: "structure" },
  {
    id: "electrical",
    name: "Elektroinstallation",
    visible: true,
    type: "electrical",
  },
  { id: "plumbing", name: "Sanitär", visible: false, type: "plumbing" },
  { id: "hvac", name: "Lüftung/Klima", visible: false, type: "hvac" },
  { id: "dimensions", name: "Bemaßung", visible: true, type: "dimension" },
  { id: "annotations", name: "Anmerkungen", visible: true, type: "annotation" },
];

export function CADViewer({
  source,
  modelInfo,
  layers: initialLayers = DEFAULT_LAYERS,
  initialViewMode = "2d",
  enableMeasurements = true,
  enableLayers = true,
  enableAnnotations = true,
  className,
  width = "100%",
  height = 500,
  onMeasurement,
  onSelect,
}: CADViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [currentTool, setCurrentTool] = useState<Tool>("pan");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurePoints, setMeasurePoints] = useState<MeasurementPoint[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  // Toggle all layers
  const toggleAllLayers = (visible: boolean) => {
    setLayers((prev) => prev.map((l) => ({ ...l, visible })));
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setRotation({ x: 0, y: 0, z: 0 });
    setPan({ x: 0, y: 0 });
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      await document.exitFullscreen?.();
      setIsFullscreen(false);
    } else {
      await containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    }
  };

  // Handle measurement completion
  const completeMeasurement = useCallback(() => {
    if (measurePoints.length < 2) return;

    // Calculate distance (simplified 2D)
    const dx = measurePoints[1].x - measurePoints[0].x;
    const dy = measurePoints[1].y - measurePoints[0].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const measurement: Measurement = {
      id: `measure-${Date.now()}`,
      type: "distance",
      points: [...measurePoints],
      value: distance,
      unit: "m",
    };

    setMeasurements((prev) => [...prev, measurement]);
    setMeasurePoints([]);
    onMeasurement?.(measurement);
  }, [measurePoints, onMeasurement]);

  // Clear measurements
  const clearMeasurements = () => {
    setMeasurements([]);
    setMeasurePoints([]);
  };

  // Export handling
  const handleExport = (format: string) => {
    console.log(`Exporting as ${format}...`);
    // Implementation would export the current view/model
  };

  // Print handling
  const handlePrint = () => {
    window.print();
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unbekannt";
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <TooltipProvider>
      <Card
        ref={containerRef}
        className={cn(
          "overflow-hidden",
          isFullscreen && "fixed inset-0 z-50 rounded-none",
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Box className="h-5 w-5" />
                {modelInfo?.name || "CAD Viewer"}
              </CardTitle>
              {modelInfo?.format && (
                <Badge variant="outline" className="text-xs uppercase">
                  {modelInfo.format}
                </Badge>
              )}
            </div>

            {/* View mode tabs */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="2d" className="text-xs px-3">
                  2D
                </TabsTrigger>
                <TabsTrigger value="3d" className="text-xs px-3">
                  3D
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1">
              {/* Info panel toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showInfoPanel ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dateiinfo</TooltipContent>
              </Tooltip>

              {/* Settings dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Raster {showGrid ? "ausblenden" : "einblenden"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {isDarkMode ? "Hell" : "Dunkel"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <Download className="h-4 w-4 mr-2" />
                    Als PDF exportieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("png")}>
                    <Download className="h-4 w-4 mr-2" />
                    Als Bild exportieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Drucken
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? "Beenden" : "Vollbild"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex">
            {/* Main viewer area */}
            <div className="flex-1 relative">
              {/* Toolbar */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 bg-background/95 rounded-lg border p-1 shadow-sm">
                {/* Tool buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "select" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentTool("select")}
                    >
                      <MousePointer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Auswählen</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "pan" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentTool("pan")}
                    >
                      <Hand className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Verschieben</TooltipContent>
                </Tooltip>

                {enableMeasurements && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          currentTool === "measure" ? "secondary" : "ghost"
                        }
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentTool("measure")}
                      >
                        <Ruler className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Messen</TooltipContent>
                  </Tooltip>
                )}

                <div className="h-px bg-border my-1" />

                {/* Zoom controls */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Vergrößern</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Verkleinern</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={resetView}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Ansicht zurücksetzen
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Zoom indicator */}
              <div className="absolute top-2 right-2 z-10 bg-background/95 rounded px-2 py-1 text-xs border">
                {Math.round(zoom * 100)}%
              </div>

              {/* Canvas / Viewer */}
              <div
                className={cn(
                  "relative overflow-hidden",
                  isDarkMode ? "bg-gray-900" : "bg-gray-100"
                )}
                style={{
                  height: typeof height === "number" ? `${height}px` : height,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                />

                {/* Grid overlay */}
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, ${
                          isDarkMode
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)"
                        } 1px, transparent 1px),
                        linear-gradient(to bottom, ${
                          isDarkMode
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.05)"
                        } 1px, transparent 1px)
                      `,
                      backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                      transform: `translate(${pan.x}px, ${pan.y}px)`,
                    }}
                  />
                )}

                {/* Placeholder for actual viewer */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">CAD/BIM Viewer</p>
                    <p className="text-xs opacity-70">
                      {viewMode === "3d"
                        ? "3D-Modellansicht"
                        : "2D-Planansicht"}
                    </p>
                  </div>
                </div>

                {/* Measurements overlay */}
                {measurements.map((m) => (
                  <div
                    key={m.id}
                    className="absolute pointer-events-none text-xs bg-primary text-primary-foreground px-1 rounded"
                    style={{
                      left:
                        ((m.points[0].x + m.points[1].x) / 2) * zoom + pan.x,
                      top: ((m.points[0].y + m.points[1].y) / 2) * zoom + pan.y,
                    }}
                  >
                    {m.value.toFixed(2)} {m.unit}
                  </div>
                ))}
              </div>

              {/* Measurement info bar */}
              {currentTool === "measure" && measurements.length > 0 && (
                <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2 bg-background/95 rounded-lg border p-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {measurements.length} Messungen
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={clearMeasurements}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Löschen
                  </Button>
                </div>
              )}
            </div>

            {/* Layers panel */}
            {enableLayers && (
              <div className="w-56 border-l bg-muted/30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span className="text-sm font-medium">Ebenen</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => toggleAllLayers(true)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Alle einblenden
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleAllLayers(false)}>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Alle ausblenden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleLayer(layer.id)}
                    >
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: LAYER_CONFIG[layer.type].color,
                        }}
                      />
                      <span
                        className={cn(
                          "text-sm flex-1 truncate",
                          !layer.visible && "text-muted-foreground"
                        )}
                      >
                        {layer.name}
                      </span>
                      {layer.visible ? (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info panel */}
            {showInfoPanel && modelInfo && (
              <div className="w-64 border-l bg-muted/30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Dateiinfo</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowInfoPanel(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium truncate">{modelInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <p className="font-medium uppercase">{modelInfo.format}</p>
                  </div>
                  {modelInfo.fileSize && (
                    <div>
                      <span className="text-muted-foreground">Größe:</span>
                      <p className="font-medium">
                        {formatFileSize(modelInfo.fileSize)}
                      </p>
                    </div>
                  )}
                  {modelInfo.dimensions && (
                    <div>
                      <span className="text-muted-foreground">
                        Abmessungen:
                      </span>
                      <p className="font-medium">
                        {modelInfo.dimensions.width}×
                        {modelInfo.dimensions.height}
                        {modelInfo.dimensions.depth &&
                          `×${modelInfo.dimensions.depth}`}{" "}
                        m
                      </p>
                    </div>
                  )}
                  {modelInfo.createdBy && (
                    <div>
                      <span className="text-muted-foreground">
                        Erstellt von:
                      </span>
                      <p className="font-medium">{modelInfo.createdBy}</p>
                    </div>
                  )}
                  {modelInfo.modifiedAt && (
                    <div>
                      <span className="text-muted-foreground">Geändert:</span>
                      <p className="font-medium">
                        {modelInfo.modifiedAt.toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default CADViewer;
