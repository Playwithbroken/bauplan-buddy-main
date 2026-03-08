import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Keyboard,
  MousePointer,
  Volume2,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Palette,
  Type
} from 'lucide-react';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'contrast' | 'keyboard' | 'aria' | 'focus' | 'structure';
  message: string;
  element?: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export default function AccessibilityPanel() {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [showFocusOutlines, setShowFocusOutlines] = useState(false);
  const [showHeadingStructure, setShowHeadingStructure] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Simulate accessibility scan
  useEffect(() => {
    const mockIssues: AccessibilityIssue[] = [
      {
        id: '1',
        type: 'error',
        category: 'aria',
        message: 'Button ohne zugänglichen Namen gefunden',
        element: '<button>',
        wcagLevel: 'A'
      },
      {
        id: '2',
        type: 'warning',
        category: 'contrast',
        message: 'Farbkontrast 3.8:1 (Minimum 4.5:1 empfohlen)',
        element: '.text-gray-500',
        wcagLevel: 'AA'
      },
      {
        id: '3',
        type: 'info',
        category: 'keyboard',
        message: 'Interaktives Element sollte Tastaturzugriff haben',
        element: 'div[onClick]',
        wcagLevel: 'A'
      }
    ];
    setIssues(mockIssues);
  }, []);

  // Toggle focus outline visualization
  useEffect(() => {
    if (showFocusOutlines) {
      document.body.classList.add('show-focus-outlines');
      const style = document.createElement('style');
      style.id = 'accessibility-focus-styles';
      style.textContent = `
        .show-focus-outlines *:focus {
          outline: 3px dashed #ff00ff !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('show-focus-outlines');
      const style = document.getElementById('accessibility-focus-styles');
      if (style) style.remove();
    }
  }, [showFocusOutlines]);

  // Toggle heading structure visualization
  useEffect(() => {
    if (showHeadingStructure) {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading) => {
        const badge = document.createElement('span');
        badge.className = 'heading-badge';
        badge.textContent = heading.tagName;
        badge.style.cssText = `
          position: absolute;
          background: #4f46e5;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          margin-left: 8px;
          z-index: 9999;
        `;
        (heading as HTMLElement).style.position = 'relative';
        heading.appendChild(badge);
      });
    } else {
      document.querySelectorAll('.heading-badge').forEach(badge => badge.remove());
    }
  }, [showHeadingStructure]);

  // Toggle landmark visualization
  useEffect(() => {
    if (showLandmarks) {
      const landmarks = document.querySelectorAll('header, nav, main, aside, footer, [role]');
      const style = document.createElement('style');
      style.id = 'landmark-styles';
      style.textContent = `
        header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"] {
          outline: 2px solid #10b981 !important;
          outline-offset: -2px !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('landmark-styles');
      if (style) style.remove();
    }
  }, [showLandmarks]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contrast':
        return <Palette className="h-4 w-4" />;
      case 'keyboard':
        return <Keyboard className="h-4 w-4" />;
      case 'aria':
        return <Volume2 className="h-4 w-4" />;
      case 'focus':
        return <Eye className="h-4 w-4" />;
      case 'structure':
        return <Type className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Barrierefreiheit (A11y)
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          WCAG 2.1 Compliance Checker & Accessibility Tools
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fehler</p>
                <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnungen</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hinweise</p>
                <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
              </div>
              <Info className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WCAG Level</p>
                <p className="text-2xl font-bold text-green-600">AA</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Probleme ({issues.length})</TabsTrigger>
          <TabsTrigger value="tools">Hilfswerkzeuge</TabsTrigger>
          <TabsTrigger value="keyboard">Tastatur-Test</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gefundene Probleme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-0.5">{getTypeIcon(issue.type)}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(issue.category)}
                        <span className="font-medium">{issue.message}</span>
                      </div>
                      {issue.element && (
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {issue.element}
                        </code>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          WCAG {issue.wcagLevel}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {issue.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {issues.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>Keine Probleme gefunden! 🎉</p>
                    <p className="text-sm">Ihre Seite erfüllt die WCAG 2.1 AA Richtlinien.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualisierungs-Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="focus-outlines" className="font-medium cursor-pointer">
                    Fokus-Rahmen anzeigen
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Zeigt alle Fokus-Rahmen auf der Seite an
                  </p>
                </div>
                <Switch
                  id="focus-outlines"
                  checked={showFocusOutlines}
                  onCheckedChange={setShowFocusOutlines}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="heading-structure" className="font-medium cursor-pointer">
                    Überschriften-Struktur
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Visualisiert H1-H6 Hierarchie
                  </p>
                </div>
                <Switch
                  id="heading-structure"
                  checked={showHeadingStructure}
                  onCheckedChange={setShowHeadingStructure}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="landmarks" className="font-medium cursor-pointer">
                    ARIA Landmarks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hebt Landmark-Regionen hervor
                  </p>
                </div>
                <Switch
                  id="landmarks"
                  checked={showLandmarks}
                  onCheckedChange={setShowLandmarks}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start">
                <Zap className="mr-2 h-4 w-4" />
                Kontrast prüfen
              </Button>
              <Button variant="outline" className="justify-start">
                <Keyboard className="mr-2 h-4 w-4" />
                Tab-Reihenfolge testen
              </Button>
              <Button variant="outline" className="justify-start">
                <Volume2 className="mr-2 h-4 w-4" />
                Screenreader simulieren
              </Button>
              <Button variant="outline" className="justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Farbblindheit simulieren
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tastatur-Navigation Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium mb-2">Anleitung:</h4>
                <ul className="text-sm space-y-1 text-blue-900 dark:text-blue-200">
                  <li>• Drücken Sie <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded">Tab</kbd> um vorwärts zu navigieren</li>
                  <li>• Drücken Sie <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded">Shift+Tab</kbd> um rückwärts zu navigieren</li>
                  <li>• Drücken Sie <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded">Enter</kbd> oder <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded">Space</kbd> um Elemente zu aktivieren</li>
                  <li>• Alle interaktiven Elemente sollten erreichbar sein</li>
                  <li>• Fokus-Rahmen sollten immer sichtbar sein</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Wichtige Tastenkombinationen:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 border rounded">
                    <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Ctrl + K</kbd>
                    <p className="text-muted-foreground mt-1">Befehlspalette öffnen</p>
                  </div>
                  <div className="p-3 border rounded">
                    <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">F1</kbd>
                    <p className="text-muted-foreground mt-1">Hilfe öffnen</p>
                  </div>
                  <div className="p-3 border rounded">
                    <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Esc</kbd>
                    <p className="text-muted-foreground mt-1">Dialog schließen</p>
                  </div>
                  <div className="p-3 border rounded">
                    <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">?</kbd>
                    <p className="text-muted-foreground mt-1">Tastenkürzel anzeigen</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
