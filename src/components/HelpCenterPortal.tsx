import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Keyboard, BookOpen, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { userGuides } from '@/content/userGuides';
import { troubleshootingGuides } from '@/content/troubleshooting';
import { DialogFrame } from '@/components/ui/dialog-frame';

export default function HelpCenterPortal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('shortcut:show-help', onOpen as EventListener);
    return () => window.removeEventListener('shortcut:show-help', onOpen as EventListener);
  }, []);

  const goDocs = () => {
    setOpen(false);
    navigate('/documentation');
  };

  const goDiagnostics = () => {
    setOpen(false);
    navigate('/system/diagnostics');
  };

  const openShortcuts = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('shortcut:show-shortcuts'));
  };

  type GuideEntry = {
    id: string;
    title: string;
    content?: string;
    categoryPath: string; // e.g., "appointments/gettingStarted"
    tags?: string[];
    type: 'Guide' | 'Troubleshooting';
    difficulty?: string;
    readTime?: string;
  };

  const guides: GuideEntry[] = useMemo(() => {
    type RawGuide = {
      title: string;
      content?: string;
      tags?: string[];
      difficulty?: string;
      readTime?: string;
    };
    type RawGuidesGroup = Record<string, RawGuide>;

    const list: GuideEntry[] = [];
    // Flatten user guides
    const ug = (userGuides as unknown) as Record<string, RawGuidesGroup>;
    Object.entries(ug || {}).forEach(([groupKey, groupVal]) => {
      Object.entries(groupVal).forEach(([key, val]) => {
        list.push({
          id: `guide:${groupKey}/${key}`,
          title: val.title,
          content: val.content ?? '',
          categoryPath: `${groupKey}/${key}`,
          tags: val.tags,
          difficulty: val.difficulty,
          readTime: val.readTime,
          type: 'Guide',
        });
      });
    });
    // Flatten troubleshooting
    const tg = (troubleshootingGuides as unknown) as Record<string, RawGuide>;
    Object.entries(tg || {}).forEach(([key, val]) => {
      list.push({
        id: `troubleshoot:${key}`,
        title: val.title,
        content: val.content ?? '',
        categoryPath: `troubleshooting/${key}`,
        tags: val.tags,
        difficulty: val.difficulty,
        readTime: val.readTime,
        type: 'Troubleshooting',
      });
    });
    return list;
  }, []);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GuideEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter(g =>
      g.title.toLowerCase().includes(q) ||
      (g.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (g.content || '').toLowerCase().includes(q)
    );
  }, [guides, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogFrame
        width="max-w-3xl"
        title={<span className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />Hilfe und Support</span>}
        description={<DialogDescription>Schneller Zugriff auf Dokumentation, Tastaturkürzel und Systemdiagnose.</DialogDescription>}
        footer={<Button onClick={() => setOpen(false)}>Schließen</Button>}
      >

        <div className="space-y-4 px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start gap-2" onClick={goDocs}>
              <BookOpen className="h-4 w-4" />
              Dokumentation öffnen
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={openShortcuts}>
              <Keyboard className="h-4 w-4" />
              Tastaturkürzel anzeigen
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={goDiagnostics}>
              <Activity className="h-4 w-4" />
              Systemdiagnose öffnen
            </Button>
            <a href="mailto:support@bauplan-buddy.example" className="contents">
              <Button variant="outline" className="justify-start gap-2" asChild>
                <span>
                  <HelpCircle className="h-4 w-4" />
                  Support kontaktieren
                </span>
              </Button>
            </a>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Guides & Troubleshooting</h3>
              <span className="text-xs text-muted-foreground">{filtered.length} Einträge</span>
            </div>
            <Input
              placeholder="Suchen (Titel, Tags, Inhalt)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-2">
                  {filtered.map(entry => (
                    <button
                      key={entry.id}
                      className="w-full text-left p-3 rounded-md border hover:bg-muted/40"
                      onClick={() => setSelected(entry)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.type === 'Guide' ? 'secondary' : 'outline'}>{entry.type}</Badge>
                        <span className="font-medium text-sm">{entry.title}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.tags?.slice(0, 4).map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                        {entry.difficulty && (
                          <Badge variant="outline" className="text-[10px]">{entry.difficulty}</Badge>
                        )}
                        {entry.readTime && (
                          <Badge variant="outline" className="text-[10px]">{entry.readTime}</Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {(entry.content || '').replace(/[#*`>_-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}
                      </p>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4">Keine Einträge gefunden.</div>
                  )}
                </div>
              </ScrollArea>

              <div className="h-[300px] border rounded-md p-3 overflow-auto bg-muted/20">
                {selected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={selected.type === 'Guide' ? 'secondary' : 'outline'}>{selected.type}</Badge>
                      <h4 className="font-semibold text-sm">{selected.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selected.tags?.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                      {selected.difficulty && (
                        <Badge variant="outline" className="text-[10px]">{selected.difficulty}</Badge>
                      )}
                      {selected.readTime && (
                        <Badge variant="outline" className="text-[10px]">{selected.readTime}</Badge>
                      )}
                    </div>
                    <pre className="whitespace-pre-wrap text-xs leading-5">
{selected.content}
                    </pre>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={goDocs}>In Dokumentation öffnen</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Schließen</Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
                    Wählen Sie links einen Eintrag aus, um Details anzuzeigen.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Tipp: Drücken Sie F1 jederzeit, um diese Hilfe zu öffnen. Nutzen Sie Ctrl+K für die Befehlssuche.
          </div>
        </div>

              </DialogFrame>
    </Dialog>
  );
}
