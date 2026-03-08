import React from 'react';
import { Button } from '../../ui/button';
import { Download, Loader2, Printer, Save } from 'lucide-react';

export interface FormActionsProps {
  onCancel?: () => void;
  onPrint: () => void;
  onDownload: () => void;
  isGeneratingPdf: boolean;
  isReady: boolean;
}

export const DeliveryNoteFormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onPrint,
  onDownload,
  isGeneratingPdf,
  isReady
}) => (
  <div className="flex justify-end space-x-4">
    <Button type="button" variant="outline" onClick={onCancel}>
      Abbrechen
    </Button>
    <Button type="button" variant="outline" onClick={onPrint} disabled={!isReady}>
      <Printer className="h-4 w-4 mr-2" />
      Drucken
    </Button>
    <Button
      type="button"
      variant="outline"
      onClick={onDownload}
      disabled={!isReady || isGeneratingPdf}
    >
      {isGeneratingPdf ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isGeneratingPdf ? 'Speichern...' : 'PDF speichern'}
    </Button>
    <Button type="submit" variant="gradient" disabled={!isReady}>
      <Save className="h-4 w-4 mr-2" />
      Lieferschein speichern
    </Button>
  </div>
);
