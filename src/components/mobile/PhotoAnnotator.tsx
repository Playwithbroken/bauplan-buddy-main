/**
 * Photo Annotator Component
 * Canvas-based photo annotation tool for damage documentation
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Circle,
  Square,
  ArrowRight,
  Type,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Download,
  Trash2,
  Palette,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";

type AnnotationTool =
  | "select"
  | "circle"
  | "rectangle"
  | "arrow"
  | "text"
  | "freehand"
  | "eraser";

interface Annotation {
  id: string;
  tool: AnnotationTool;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
}

interface PhotoAnnotatorProps {
  /** Source image URL or base64 */
  imageSrc: string;
  /** Callback when annotations change */
  onChange?: (annotations: Annotation[]) => void;
  /** Callback when exporting annotated image */
  onExport?: (dataUrl: string) => void;
  /** Initial annotations */
  initialAnnotations?: Annotation[];
  /** Custom class name */
  className?: string;
  /** Width of the annotator */
  width?: number;
  /** Height of the annotator */
  height?: number;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#ffffff", // white
  "#000000", // black
];

const TOOL_CONFIG: Record<
  AnnotationTool,
  { icon: typeof Circle; label: string }
> = {
  select: { icon: Move, label: "Auswählen" },
  circle: { icon: Circle, label: "Kreis" },
  rectangle: { icon: Square, label: "Rechteck" },
  arrow: { icon: ArrowRight, label: "Pfeil" },
  text: { icon: Type, label: "Text" },
  freehand: { icon: Pencil, label: "Freihand" },
  eraser: { icon: Eraser, label: "Radierer" },
};

export function PhotoAnnotator({
  imageSrc,
  onChange,
  onExport,
  initialAnnotations = [],
  className,
  width = 800,
  height = 600,
}: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] =
    useState<Annotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>("freehand");
  const [currentColor, setCurrentColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<
    { x: number; y: number }[]
  >([]);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw image
    const scale = Math.min(
      canvas.width / image.width,
      canvas.height / image.height
    );
    const x = (canvas.width / zoom - image.width * scale) / 2;
    const y = (canvas.height / zoom - image.height * scale) / 2;
    ctx.drawImage(image, x, y, image.width * scale, image.height * scale);

    // Draw annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (annotation.tool) {
        case "freehand":
          if (annotation.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;

        case "circle":
          if (annotation.points.length === 2) {
            const [start, end] = annotation.points;
            const radius = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        case "rectangle":
          if (annotation.points.length === 2) {
            const [start, end] = annotation.points;
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
          }
          break;

        case "arrow":
          if (annotation.points.length === 2) {
            const [start, end] = annotation.points;
            const headLength = 15;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            // Line
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle - Math.PI / 6),
              end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle + Math.PI / 6),
              end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;

        case "text":
          if (annotation.points.length === 1 && annotation.text) {
            ctx.font = `${annotation.fontSize || 16}px sans-serif`;
            ctx.fillText(
              annotation.text,
              annotation.points[0].x,
              annotation.points[0].y
            );
          }
          break;
      }
    });

    // Draw current annotation being created
    if (isDrawing && currentPoints.length > 0) {
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentColor;
      ctx.lineWidth = strokeWidth;

      switch (currentTool) {
        case "freehand":
          ctx.beginPath();
          ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
          currentPoints.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
          break;

        case "circle":
          if (currentPoints.length === 2) {
            const [start, end] = currentPoints;
            const radius = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        case "rectangle":
          if (currentPoints.length === 2) {
            const [start, end] = currentPoints;
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
          }
          break;

        case "arrow":
          if (currentPoints.length === 2) {
            const [start, end] = currentPoints;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
          break;
      }
    }

    ctx.restore();
  }, [
    image,
    annotations,
    currentPoints,
    isDrawing,
    currentTool,
    currentColor,
    strokeWidth,
    zoom,
    pan,
  ]);

  // Redraw on changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get canvas coordinates
  const getCanvasCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      };
    },
    [zoom, pan]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (currentTool === "select") return;

      const coords = getCanvasCoordinates(e);

      if (currentTool === "text") {
        setTextPosition(coords);
        return;
      }

      setIsDrawing(true);
      setCurrentPoints([coords]);
    },
    [currentTool, getCanvasCoordinates]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const coords = getCanvasCoordinates(e);

      if (currentTool === "freehand") {
        setCurrentPoints((prev) => [...prev, coords]);
      } else {
        setCurrentPoints((prev) => [prev[0], coords]);
      }
    },
    [isDrawing, currentTool, getCanvasCoordinates]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || currentPoints.length === 0) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      tool: currentTool,
      points: [...currentPoints],
      color: currentColor,
      strokeWidth,
    };

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    onChange?.(newAnnotations);

    setIsDrawing(false);
    setCurrentPoints([]);
  }, [
    isDrawing,
    currentPoints,
    currentTool,
    currentColor,
    strokeWidth,
    annotations,
    history,
    historyIndex,
    onChange,
  ]);

  // Add text annotation
  const handleAddText = useCallback(() => {
    if (!textPosition || !textInput.trim()) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      tool: "text",
      points: [textPosition],
      color: currentColor,
      strokeWidth,
      text: textInput,
      fontSize,
    };

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    onChange?.(newAnnotations);
    setTextInput("");
    setTextPosition(null);
  }, [
    textPosition,
    textInput,
    currentColor,
    strokeWidth,
    fontSize,
    annotations,
    history,
    historyIndex,
    onChange,
  ]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
      onChange?.(history[historyIndex - 1]);
    }
  }, [historyIndex, history, onChange]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
      onChange?.(history[historyIndex + 1]);
    }
  }, [historyIndex, history, onChange]);

  // Clear all
  const handleClear = useCallback(() => {
    setAnnotations([]);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange?.([]);
  }, [history, historyIndex, onChange]);

  // Export
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    onExport?.(dataUrl);
  }, [onExport]);

  return (
    <TooltipProvider>
      <div ref={containerRef} className={cn("flex flex-col gap-4", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg">
          {/* Tools */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            {(
              Object.entries(TOOL_CONFIG) as [
                AnnotationTool,
                (typeof TOOL_CONFIG)[AnnotationTool]
              ][]
            ).map(([tool, config]) => (
              <Tooltip key={tool}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === tool ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentTool(tool)}
                  >
                    <config.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{config.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="h-4 w-4" style={{ color: currentColor }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      currentColor === color
                        ? "border-primary"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Stroke width */}
          <div className="flex items-center gap-2 border-r border-border pr-2">
            <span className="text-xs text-muted-foreground">Stärke:</span>
            <Slider
              value={[strokeWidth]}
              onValueChange={([value]) => setStrokeWidth(value)}
              min={1}
              max={10}
              step={1}
              className="w-20"
            />
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Verkleinern</TooltipContent>
            </Tooltip>
            <span className="text-xs w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vergrößern</TooltipContent>
            </Tooltip>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rückgängig</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Wiederholen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alles löschen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                  Exportieren
                </Button>
              </TooltipTrigger>
              <TooltipContent>Als Bild speichern</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative border rounded-lg overflow-hidden bg-muted/50">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={cn(
              "cursor-crosshair",
              currentTool === "select" && "cursor-move"
            )}
          />

          {/* Text input overlay */}
          {textPosition && (
            <div
              className="absolute z-10"
              style={{
                left: textPosition.x + pan.x,
                top: textPosition.y + pan.y,
              }}
            >
              <div className="flex items-center gap-1 bg-background border rounded-md shadow-lg p-1">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Text eingeben..."
                  className="h-8 w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddText();
                    if (e.key === "Escape") setTextPosition(null);
                  }}
                />
                <Button size="sm" onClick={handleAddText}>
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTextPosition(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Annotations count */}
        <div className="text-xs text-muted-foreground text-center">
          {annotations.length} Markierung{annotations.length !== 1 && "en"}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default PhotoAnnotator;
