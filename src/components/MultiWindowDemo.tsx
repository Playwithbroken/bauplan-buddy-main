import React, { useState } from 'react';
import { MultiWindowDialog as Dialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Button } from '@/components/ui/button';
import { Package, Users, FileText, Calendar, Settings } from 'lucide-react';

/**
 * Multi-Window Demo Component
 * 
 * Demonstrates how to open multiple dialogs simultaneously:
 * - Each dialog has its own state
 * - Uses MultiWindowDialog with modal={false}
 * - Each window is independently draggable, resizable, and positionable
 * - Can be moved to second monitor
 * - All windows can be minimized/maximized independently
 */
export function MultiWindowDemo() {
  const [window1Open, setWindow1Open] = useState(false);
  const [window2Open, setWindow2Open] = useState(false);
  const [window3Open, setWindow3Open] = useState(false);
  const [window4Open, setWindow4Open] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Multi-Window System Demo</h2>
        <p className="text-muted-foreground">
          Öffnen Sie mehrere Fenster gleichzeitig und arbeiten Sie parallel!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <Button onClick={() => setWindow1Open(true)} variant="outline">
          <Package className="mr-2 h-4 w-4" />
          Lager öffnen
        </Button>
        <Button onClick={() => setWindow2Open(true)} variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Team öffnen
        </Button>
        <Button onClick={() => setWindow3Open(true)} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Dokumente öffnen
        </Button>
        <Button onClick={() => setWindow4Open(true)} variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Kalender öffnen
        </Button>
      </div>

      {/* Window 1: Inventory */}
      <Dialog open={window1Open} onOpenChange={setWindow1Open} modal={false}>
        <DialogFrame
          title="Lagerbestand"
          width="fit-content"
          minWidth={600}
          maxWidth={1000}
          resizable={true}
          showFullscreenToggle={true}
          preventOutsideClose={true}
          onClose={() => setWindow1Open(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWindow1Open(false)}>
                Schließen
              </Button>
              <Button>Speichern</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Artikel</div>
                <div className="text-2xl font-bold">1,234</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Wert</div>
                <div className="text-2xl font-bold">€45,678</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Dieses Fenster kann auf den 2. Bildschirm gezogen werden!
            </p>
          </div>
        </DialogFrame>
      </Dialog>

      {/* Window 2: Team */}
      <Dialog open={window2Open} onOpenChange={setWindow2Open} modal={false}>
        <DialogFrame
          title="Team Übersicht"
          width="fit-content"
          minWidth={500}
          maxWidth={900}
          resizable={true}
          showFullscreenToggle={true}
          preventOutsideClose={true}
          onClose={() => setWindow2Open(false)}
          footer={
            <Button variant="outline" onClick={() => setWindow2Open(false)}>
              Schließen
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 border rounded">
                <div className="w-8 h-8 rounded-full bg-blue-500" />
                <div>
                  <div className="font-medium">Max Mustermann</div>
                  <div className="text-sm text-muted-foreground">Bauleiter</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <div className="w-8 h-8 rounded-full bg-green-500" />
                <div>
                  <div className="font-medium">Anna Schmidt</div>
                  <div className="text-sm text-muted-foreground">Architektin</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Alle Fenster sind unabhängig voneinander!
            </p>
          </div>
        </DialogFrame>
      </Dialog>

      {/* Window 3: Documents */}
      <Dialog open={window3Open} onOpenChange={setWindow3Open} modal={false}>
        <DialogFrame
          title="Dokumente"
          width="fit-content"
          minWidth={700}
          maxWidth={1100}
          resizable={true}
          showFullscreenToggle={true}
          preventOutsideClose={true}
          onClose={() => setWindow3Open(false)}
          footer={
            <Button variant="outline" onClick={() => setWindow3Open(false)}>
              Schließen
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Angebote</div>
                <div className="text-2xl font-bold">24</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Rechnungen</div>
                <div className="text-2xl font-bold">156</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Projekte</div>
                <div className="text-2xl font-bold">12</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Minimieren Sie Fenster, um den Überblick zu behalten!
            </p>
          </div>
        </DialogFrame>
      </Dialog>

      {/* Window 4: Calendar */}
      <Dialog open={window4Open} onOpenChange={setWindow4Open} modal={false}>
        <DialogFrame
          title="Kalender & Termine"
          width="fit-content"
          minWidth={600}
          maxWidth={1000}
          resizable={true}
          showFullscreenToggle={true}
          preventOutsideClose={true}
          onClose={() => setWindow4Open(false)}
          footer={
            <Button variant="outline" onClick={() => setWindow4Open(false)}>
              Schließen
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-2">Heute</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>09:00 - Team Meeting</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>14:00 - Kundentermin</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Öffnen Sie alle Fenster gleichzeitig und arbeiten Sie parallel!
            </p>
          </div>
        </DialogFrame>
      </Dialog>

      {/* Info Box */}
      <div className="mt-8 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Multi-Window Features:
        </h3>
        <ul className="space-y-1 text-sm">
          <li>✅ Mehrere Fenster gleichzeitig öffnen</li>
          <li>✅ Jedes Fenster frei verschiebbar (Drag Header)</li>
          <li>✅ Jedes Fenster in Größe anpassbar (8 Resize-Handles)</li>
          <li>✅ Auf 2. Bildschirm verschieben möglich</li>
          <li>✅ Minimize/Maximize pro Fenster (Ctrl+-, Ctrl+M)</li>
          <li>✅ Auto-Snap an Bildschirmrand für Maximierung</li>
          <li>✅ Keyboard Shortcuts (Esc, Ctrl+W zum Schließen)</li>
        </ul>
      </div>
    </div>
  );
}
