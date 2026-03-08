/**
 * Weather Widget Component
 * Displays current weather and construction suitability for site conditions
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Sun,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";
import {
  weatherService,
  WeatherData,
  ConstructionSuitability,
} from "@/services/weatherService";

interface WeatherWidgetProps {
  /** Location coordinates */
  location?: { lat: number; lon: number };
  /** Location name (alternative to coordinates) */
  locationName?: string;
  /** Show forecast */
  showForecast?: boolean;
  /** Show construction suitability */
  showSuitability?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Refresh interval in ms (0 to disable) */
  refreshInterval?: number;
}

// Suitability badge colors
const SUITABILITY_COLORS: Record<ConstructionSuitability["overall"], string> = {
  excellent: "bg-green-500 text-white",
  good: "bg-green-400 text-white",
  fair: "bg-yellow-500 text-white",
  poor: "bg-orange-500 text-white",
  unsafe: "bg-red-500 text-white",
};

const SUITABILITY_LABELS: Record<ConstructionSuitability["overall"], string> = {
  excellent: "Ausgezeichnet",
  good: "Gut",
  fair: "Mäßig",
  poor: "Schlecht",
  unsafe: "Unsicher",
};

// Rating icon component
const RatingIcon = ({ rating }: { rating: "good" | "warning" | "danger" }) => {
  if (rating === "good") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (rating === "warning") {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  return <XCircle className="h-4 w-4 text-red-500" />;
};

export function WeatherWidget({
  location,
  locationName,
  showForecast = true,
  showSuitability = true,
  compact = false,
  className,
  refreshInterval = 15 * 60 * 1000, // 15 minutes
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [suitability, setSuitability] =
    useState<ConstructionSuitability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let data: WeatherData;

      if (location) {
        data = await weatherService.getWeather(location.lat, location.lon);
      } else if (locationName) {
        data = await weatherService.getWeatherByCity(locationName);
      } else {
        // Try to get user's location
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              });
            }
          );
          data = await weatherService.getWeather(
            pos.coords.latitude,
            pos.coords.longitude
          );
        } catch {
          // Fallback to Berlin
          data = await weatherService.getWeatherByCity("berlin");
        }
      }

      setWeather(data);
      setSuitability(
        weatherService.evaluateConstructionSuitability(data.current)
      );
      setLastRefresh(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wetter konnte nicht geladen werden"
      );
    } finally {
      setIsLoading(false);
    }
  }, [location, locationName]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchWeather();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchWeather, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchWeather, refreshInterval]);

  // Loading state
  if (isLoading && !weather) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={fetchWeather}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!weather || !suitability) return null;

  const { current, daily } = weather;

  // Compact view
  if (compact) {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-muted/50",
            className
          )}
        >
          <span className="text-2xl">{current.condition.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{current.temperature}°C</span>
              <Badge
                className={cn(
                  "text-xs",
                  SUITABILITY_COLORS[suitability.overall]
                )}
              >
                {SUITABILITY_LABELS[suitability.overall]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {current.condition.description}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-auto"
                onClick={fetchWeather}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wetter aktualisieren</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Wetter
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastRefresh.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={fetchWeather}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {weather.location.name}, {weather.location.region}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current weather */}
          <div className="flex items-center gap-4">
            <div className="text-5xl">{current.condition.icon}</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {current.temperature}°
                </span>
                <span className="text-muted-foreground">
                  Gefühlt {current.feelsLike}°
                </span>
              </div>
              <p className="text-muted-foreground">
                {current.condition.description}
              </p>
            </div>
          </div>

          {/* Weather details */}
          <div className="grid grid-cols-4 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                  <Droplets className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-sm font-medium">
                    {current.humidity}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Feuchte
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Luftfeuchtigkeit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                  <Wind className="h-4 w-4 text-cyan-500 mb-1" />
                  <span className="text-sm font-medium">
                    {current.windSpeed}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    km/h
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Windgeschwindigkeit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                  <Eye className="h-4 w-4 text-gray-500 mb-1" />
                  <span className="text-sm font-medium">
                    {(current.visibility / 1000).toFixed(0)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">km</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Sichtweite</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center p-2 rounded bg-muted/50">
                  <Sun className="h-4 w-4 text-yellow-500 mb-1" />
                  <span className="text-sm font-medium">{current.uvIndex}</span>
                  <span className="text-[10px] text-muted-foreground">UV</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>UV-Index</TooltipContent>
            </Tooltip>
          </div>

          {/* Construction suitability */}
          {showSuitability && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={cn(
                        "text-sm px-3 py-1",
                        SUITABILITY_COLORS[suitability.overall]
                      )}
                    >
                      {SUITABILITY_LABELS[suitability.overall]}
                    </Badge>
                    <span className="text-sm">Baustellentauglichkeit</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-3 space-y-3">
                  {/* Factor ratings */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <RatingIcon
                        rating={suitability.factors.temperature.rating}
                      />
                      <div>
                        <p className="text-xs font-medium">Temperatur</p>
                        <p className="text-[10px] text-muted-foreground">
                          {suitability.factors.temperature.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <RatingIcon
                        rating={suitability.factors.precipitation.rating}
                      />
                      <div>
                        <p className="text-xs font-medium">Niederschlag</p>
                        <p className="text-[10px] text-muted-foreground">
                          {suitability.factors.precipitation.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <RatingIcon rating={suitability.factors.wind.rating} />
                      <div>
                        <p className="text-xs font-medium">Wind</p>
                        <p className="text-[10px] text-muted-foreground">
                          {suitability.factors.wind.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <RatingIcon
                        rating={suitability.factors.visibility.rating}
                      />
                      <div>
                        <p className="text-xs font-medium">Sicht</p>
                        <p className="text-[10px] text-muted-foreground">
                          {suitability.factors.visibility.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {suitability.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Empfehlungen
                      </p>
                      <ul className="space-y-1">
                        {suitability.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-1"
                          >
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* 7-day forecast */}
          {showForecast && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                7-Tage Vorschau
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {daily.slice(0, 7).map((day, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-2 rounded bg-muted/30 min-w-[60px]"
                  >
                    <span className="text-xs font-medium">
                      {index === 0
                        ? "Heute"
                        : day.date.toLocaleDateString("de-DE", {
                            weekday: "short",
                          })}
                    </span>
                    <span className="text-xl my-1">{day.condition.icon}</span>
                    <div className="text-xs">
                      <span className="font-medium">{day.maxTemp}°</span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {day.minTemp}°
                      </span>
                    </div>
                    {day.precipitationProbability > 0 && (
                      <span className="text-[10px] text-blue-500">
                        {day.precipitationProbability}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default WeatherWidget;
