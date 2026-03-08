import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Clock, 
  Users, 
  Wrench, 
  MapPin,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { ConflictAnalysis, Conflict } from "@/services/conflictDetectionService";

interface ConflictVisualizationProps {
  analysis: ConflictAnalysis;
  onRefresh?: () => void;
  onSuggestAlternatives?: () => void;
  className?: string;
}

const ConflictVisualization = ({ 
  analysis, 
  onRefresh, 
  onSuggestAlternatives, 
  className = "" 
}: ConflictVisualizationProps) => {
  const getConflictIcon = (conflict: Conflict) => {
    switch (conflict.type) {
      case 'team': return <Users className="h-4 w-4" />;
      case 'equipment': return <Wrench className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'time_overlap': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  if (!analysis.hasConflicts && analysis.warnings.length === 0 && analysis.suggestions.length === 0) {
    return (
      <Card className={`border-green-200 bg-green-50 dark:bg-green-900/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Keine Konflikte gefunden</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Der Termin kann wie geplant erstellt werden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Conflicts */}
      {analysis.conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-base">
              <AlertTriangle className="h-4 w-4" />
              <span>Konflikte gefunden ({analysis.conflicts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.conflicts.map((conflict, index) => (
              <div key={index} className={`border-l-4 p-3 rounded-r-lg ${getSeverityColor(conflict.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2 mt-0.5">
                      {getSeverityIcon(conflict.severity)}
                      {getConflictIcon(conflict)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {conflict.resource}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {conflict.message}
                      </p>
                      
                      {/* Conflicting appointment details */}
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{conflict.conflictingAppointment.title}</span>
                          <span>{formatTime(conflict.conflictingAppointment.startTime)} - {formatTime(conflict.conflictingAppointment.endTime)}</span>
                          {conflict.conflictingAppointment.location && (
                            <span>📍 {conflict.conflictingAppointment.location}</span>
                          )}
                        </div>
                      </div>
                      
                      {conflict.suggestion && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                          <div className="flex items-start space-x-1">
                            <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{conflict.suggestion}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300 text-base">
              <AlertCircle className="h-4 w-4" />
              <span>Warnungen ({analysis.warnings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.warnings.map((warning, index) => (
              <div key={index} className={`border-l-4 p-3 rounded-r-lg ${getSeverityColor(warning.severity)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2 mt-0.5">
                    {getSeverityIcon(warning.severity)}
                    {getConflictIcon(warning)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {warning.resource}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {warning.message}
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                      <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{warning.conflictingAppointment.title}</span>
                        <span>{formatTime(warning.conflictingAppointment.startTime)} - {formatTime(warning.conflictingAppointment.endTime)}</span>
                      </div>
                    </div>
                    
                    {warning.suggestion && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                        <div className="flex items-start space-x-1">
                          <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{warning.suggestion}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 text-base">
              <Lightbulb className="h-4 w-4" />
              <span>Empfehlungen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-blue-700 dark:text-blue-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {(analysis.hasConflicts || analysis.warnings.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Erneut prüfen</span>
            </Button>
          )}
          
          {onSuggestAlternatives && analysis.hasConflicts && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSuggestAlternatives}
              className="flex items-center space-x-2"
            >
              <Clock className="h-3 w-3" />
              <span>Alternative Zeiten vorschlagen</span>
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {analysis.hasConflicts ? (
          <span className="text-red-600 dark:text-red-400 font-medium">
            ⚠️ Konflikte müssen behoben werden, bevor der Termin gespeichert werden kann
          </span>
        ) : analysis.warnings.length > 0 ? (
          <span className="text-yellow-600 dark:text-yellow-400">
            ⚠️ Warnungen beachten - Termin kann trotzdem gespeichert werden
          </span>
        ) : (
          <span className="text-green-600 dark:text-green-400">
            ✓ Termin kann wie geplant erstellt werden
          </span>
        )}
      </div>
    </div>
  );
};

export default ConflictVisualization;