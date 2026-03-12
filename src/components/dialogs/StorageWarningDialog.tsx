import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Button } from "@/components/ui/button";
import { AlertCircle, Cloud, HardDrive, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StorageWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storagePercentage?: number;
}

export function StorageWarningDialog({
  isOpen,
  onClose,
  storagePercentage = 95,
}: StorageWarningDialogProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogFrame
        title="Speicher-Warnung"
        width="max-w-2xl"
        onClose={onClose}
      >
        <div className="p-6">
          {!showOptions ? (
            // Initial Warning View
            <div className="flex flex-col items-center text-center space-y-6 py-6">
              <div className="w-20 h-20 bg-muted/50 text-foreground/80 rounded-full flex items-center justify-center border shadow-sm">
                <AlertCircle size={40} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Dein Cloud-Speicher ist fast voll</h2>
                <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed mt-4">
                  Du hast {storagePercentage}% deines Inklusiv-Speichers für PDFs erreicht. Keine Sorge, du musst nicht zwingend ein Upgrade buchen.
                </p>
                <p className="text-muted-foreground max-w-lg mx-auto text-md">
                  Du kannst deinen eigenen Cloud-Speicher anbinden oder Dateien lokal speichern, um weiterhin unbegrenzt arbeiten zu können.
                </p>
              </div>

              <div className="pt-6 w-full max-w-md">
                 <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
                   <div className="bg-foreground h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${storagePercentage}%` }}></div>
                 </div>
                 <p className="text-sm text-muted-foreground text-right">{storagePercentage}% belegt</p>
              </div>

              <div className="flex gap-4 pt-4 w-full justify-center">
                <Button variant="outline" size="lg" onClick={onClose}>Später erinnern</Button>
                <Button size="lg" onClick={() => setShowOptions(true)}>
                  Speicher-Optionen ansehen
                </Button>
              </div>
            </div>
          ) : (
            // Options View
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Wähle deine Speicher-Option</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowOptions(false)}>
                  Zurück
                </Button>
              </div>

              <div className="grid gap-6">

                <Card className="border-border shadow-sm relative overflow-hidden transition-all hover:bg-accent/5">
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 text-xs font-medium rounded-bl-lg z-10 border-b border-l">
                    Empfohlen
                  </div>
                  <CardHeader className="pb-3 relative">
                   <div className="flex items-center gap-3">
                      <div className="p-2 border bg-background/50 text-foreground/80 rounded-lg shadow-sm">
                        <Cloud size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold tracking-tight">Deine Cloud verknüpfen (Kostenlos)</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          Nutze deinen bestehenden Google Drive, OneDrive oder Dropbox Account als Datenspeicher für unsere App.
                        </CardDescription>
                      </div>
                   </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-secondary/50 p-4 rounded-md space-y-3">
                      <div>
                         <h4 className="font-semibold mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Deine Vorteile:</h4>
                         <p className="text-sm text-muted-foreground pl-3.5">Unbegrenzter Speicherplatz (abhängig von deinem Cloud-Anbieter) und volle Kontrolle über deine Dokumente. Alle PDFs bleiben geräteübergreifend synchronisiert.</p>
                      </div>
                      <div>
                         <h4 className="font-semibold mb-1 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> So funktioniert's:</h4>
                         <p className="text-sm text-muted-foreground pl-3.5">Wir speichern nur den Link zur Datei. Deine PDFs werden direkt in deiner eigenen Cloud abgelegt.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <Button variant="outline" className="w-full text-sm h-auto py-2.5 px-3 flex items-center justify-center gap-2 whitespace-normal" onClick={() => { console.log("Connect GDrive"); onClose(); }}>
                      <svg viewBox="0 0 87.3 78" className="w-5 h-5 shrink-0">
                        <path d="m6.6 66.85 22.35 43.9h44.7l-22.35-43.9z" fill="#0066da"/>
                        <path d="m28.95 22.95 22.35-43.9h-44.7l-22.35 43.9z" fill="#00ac4f"/>
                        <path d="m51.3 22.95 22.35 43.9h44.7l-22.35-43.9z" fill="#ea4335"/>
                        <path d="m6.6 66.85 22.35-43.9 11.15 21.95-22.35 43.9z" fill="#00832d"/>
                        <path d="m51.3 22.95-22.35 43.9h22.35l22.35-43.9z" fill="#2684fc"/>
                        <path d="m73.65 66.85-22.35-43.9-11.15 21.95 22.35 43.9z" fill="#ffba00"/>
                      </svg>
                      <span>Google Drive</span>
                    </Button>
                     <Button variant="outline" className="w-full text-sm h-auto py-2.5 px-3 flex items-center justify-center gap-2 whitespace-normal" onClick={() => { console.log("Connect OneDrive"); onClose(); }}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="#0078D4">
                        <path d="M17.65 9.06A4.5 4.5 0 0010 10.43a3.5 3.5 0 00-6.16 2.5A3.17 3.17 0 003.88 16H8V8.89a2.12 2.12 0 012.12-2.12H19.5v-.06a4.5 4.5 0 00-1.85-2.35zm3.18 5.48a3.17 3.17 0 00-3.18-3.18H10.12A1.12 1.12 0 009 12.48v5.64A1.12 1.12 0 0010.12 19.2h10.71a3.17 3.17 0 003.18-3.17v-1.49zM6.88 20.25h13.25V18H6.88A3.17 3.17 0 013.7 14.83v2.24a3.18 3.18 0 003.18 3.18z"/>
                      </svg>
                      <span>OneDrive</span>
                    </Button>
                    <Button variant="outline" className="w-full text-sm h-auto py-2.5 px-3 flex items-center justify-center gap-2 whitespace-normal" onClick={() => { console.log("Connect Dropbox"); onClose(); }}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="#0061FF">
                        <path d="M12.006 1.488L2 7.749l5.002 3.125L17.008 4.61 12.006 1.488zm0 12.496l-5.004-3.125L2 13.98l10.006 6.255 10.002-6.255-4.998-3.121-5 3.125zM17.008 10.874l5.002-3.125-10.002-6.261-5.002 3.122 10.002 6.264zm-10.004 7.641l5.002 3.125 5.002-3.125v4.996l-5.002 3.003-5.002-3.003v-4.996z"/>
                      </svg>
                      <span>Dropbox</span>
                    </Button>
                  </CardFooter>
                </Card>

                 {/* Option 2: Local Storage */}
                <Card className="shadow-sm border-border transition-all hover:bg-accent/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border bg-background/50 text-foreground/80 rounded-lg shadow-sm">
                        <HardDrive size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                         <CardTitle className="text-lg font-semibold tracking-tight">Nur lokal auf diesem Gerät speichern</CardTitle>
                         <CardDescription className="text-sm mt-1">
                            Speichere neue PDFs direkt auf der Festplatte deines aktuellen Geräts. Diese Option ist komplett kostenlos und extrem datenschutzfreundlich, da deine Dokumente unsere Server nie berühren.
                         </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/40 border p-4 rounded-md">
                      <h4 className="font-medium text-foreground flex items-center gap-2 mb-2 text-sm">
                        <AlertCircle size={16} strokeWidth={1.5} /> Wichtig:
                      </h4>
                      <ul className="text-sm text-amber-800 space-y-2 ml-6 list-disc">
                        <li>Dokumente, die du ab jetzt hinzufügst, sind <strong>nur auf diesem Computer</strong> verfügbar.</li>
                        <li>Sie können nicht mit der mobilen App oder anderen Geräten synchronisiert werden.</li>
                        <li>Wenn du deine Browser-Daten löschst, ein Inkognito-Fenster nutzt oder das Gerät wechselst, sind diese Dateien nicht mehr sichtbar. Du bist selbst für Backups verantwortlich.</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800" onClick={() => { console.log("Enable Local"); onClose(); }}>
                      Lokalen Modus für dieses Gerät aktivieren
                    </Button>
                  </CardFooter>
                </Card>

                {/* Option 1: Premium (Optional addition based on feedback) */}
                <Card className="shadow-sm border-border transition-all hover:bg-accent/5">
                   <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border bg-background/50 text-foreground/80 rounded-lg shadow-sm">
                          <Zap size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold tracking-tight">Premium-Speicher erweitern (Für Teams)</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Keine Einrichtung nötig. Erweitere deinen Speicherplatz und arbeite direkt weiter. Perfekt, wenn ihr als Team nahtlos an denselben Dokumenten arbeiten wollt.
                          </CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                   <CardFooter>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium" onClick={() => { console.log("View Plans"); onClose(); }}>
                        Speicher-Pläne ansehen
                      </Button>
                   </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogFrame>
    </Dialog>
  );
}
