import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full-screen mobile search dialog
 */
export function MobileSearchDialog({ open, onOpenChange }: MobileSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = [
    'Projekt München',
    'Angebot Familie Müller',
    'Rechnung AR-2024-001',
  ];

  const quickActions = [
    { label: 'Neues Angebot', path: '/quotes?create=true' },
    { label: 'Neues Projekt', path: '/projects?create=true' },
    { label: 'Termin erstellen', path: '/calendar?create=true' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-full h-full max-h-full p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Projekte, Kunden, Angebote suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Recent Searches */}
          {searchQuery === '' && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Letzte Suchen</h3>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(search)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <p className="text-sm">{search}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Schnellzugriff</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        onOpenChange(false);
                        // Navigate to action.path
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Search Results */}
          {searchQuery !== '' && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Suche nach "{searchQuery}"...
              </p>
              {/* Add actual search results here */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
