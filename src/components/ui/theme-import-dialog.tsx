import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';

interface ThemeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manualImportText: string;
  manualImportError: string | null;
  onManualImportTextChange: (value: string) => void;
  onManualImportConfirm: () => void;
  onCancel: () => void;
  onManualFileButtonClick: () => void;
  onManualImportFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ThemeImportDialog({
  open,
  onOpenChange,
  manualImportText,
  manualImportError,
  onManualImportTextChange,
  onManualImportConfirm,
  onCancel,
  onManualFileButtonClick,
  onManualImportFileUpload,
  fileInputRef,
}: ThemeImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konfiguration importieren</DialogTitle>
          <DialogDescription>
            Fuegen Sie die exportierte JSON-Konfiguration ein oder laden Sie eine Datei hoch.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={manualImportText}
            onChange={(event) => onManualImportTextChange(event.target.value)}
            rows={8}
            placeholder='{"theme":"custom","settings":{...}}'
          />
          {manualImportError && <p className="text-xs text-destructive">{manualImportError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onManualFileButtonClick}>
              <Upload className="mr-2 h-4 w-4" />
              JSON-Datei waehlen
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onManualImportFileUpload}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button onClick={onManualImportConfirm}>Importieren</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

