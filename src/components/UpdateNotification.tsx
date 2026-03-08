/**
 * Update Notification Component
 * Zeigt verfügbare Updates an
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Info, AlertTriangle } from 'lucide-react';
import { updateService } from '@/services/updateService';

interface UpdateCheck {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  changelog: {
    version: string;
    releaseDate: string;
    changes: {
      features: string[];
      improvements: string[];
      bugfixes: string[];
    };
    critical: boolean;
  } | null;
  critical: boolean;
}

const UpdateNotification: React.FC = () => {
  const [update, setUpdate] = useState<UpdateCheck | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    const result = await updateService.checkForUpdates();
    
    if (result.hasUpdate && !updateService.wasUpdateDismissed(result.latestVersion)) {
      setUpdate(result);
    }
  };

  const handleUpdate = () => {
    updateService.applyUpdate();
  };

  const handleDismiss = () => {
    if (update) {
      updateService.dismissUpdateNotification();
      setUpdate(null);
    }
  };

  if (!update || !update.hasUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className={`shadow-2xl ${update.critical ? 'border-red-500 border-2' : ''}`}>
        <CardHeader className={`${update.critical ? 'bg-red-50' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {update.critical ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Download className="h-5 w-5 text-blue-600" />
              )}
              <CardTitle className="text-lg">
                {update.critical ? '🚨 Kritisches Update' : '✨ Neue Version verfügbar'}
              </CardTitle>
            </div>
            {!update.critical && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Version Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktuelle Version</p>
                <p className="font-semibold">{update.currentVersion}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Neue Version</p>
                <p className="font-semibold text-blue-600">{update.latestVersion}</p>
              </div>
            </div>

            {/* Changelog Toggle */}
            {update.changelog && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                <Info className="h-4 w-4 mr-2" />
                {showDetails ? 'Weniger anzeigen' : 'Was ist neu?'}
              </Button>
            )}

            {/* Changelog Details */}
            {showDetails && update.changelog && (
              <div className="space-y-3 text-sm">
                {/* Features */}
                {update.changelog.changes.features.length > 0 && (
                  <div>
                    <p className="font-semibold text-green-600 mb-1">✨ Neue Features</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {update.changelog.changes.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {update.changelog.changes.improvements.length > 0 && (
                  <div>
                    <p className="font-semibold text-blue-600 mb-1">🚀 Verbesserungen</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {update.changelog.changes.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bugfixes */}
                {update.changelog.changes.bugfixes.length > 0 && (
                  <div>
                    <p className="font-semibold text-orange-600 mb-1">🐛 Bugfixes</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {update.changelog.changes.bugfixes.map((bugfix, index) => (
                        <li key={index}>{bugfix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Update Button */}
            <Button
              onClick={handleUpdate}
              className={`w-full ${update.critical ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              <Download className="h-4 w-4 mr-2" />
              {update.critical ? 'Jetzt aktualisieren (erforderlich)' : 'Jetzt aktualisieren'}
            </Button>

            {!update.critical && (
              <p className="text-xs text-gray-500 text-center">
                Die App wird neu geladen
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateNotification;
