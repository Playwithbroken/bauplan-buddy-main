import React, { useId, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';

interface ExcelSyncPanelProps {
  className?: string;
  onUpload: (files: File[]) => void;
  isSyncing?: boolean;
  headline?: string;
  title?: string;
  description?: string;
  uploadButtonLabel?: string;
  statusTitle?: string;
  statusDescription?: string;
}

const ExcelSyncPanel: React.FC<ExcelSyncPanelProps> = ({
  className,
  onUpload,
  isSyncing = false,
  headline = 'Excel Synchronisation',
  title = 'Excel-Dateien hochladen',
  description = 'Laden Sie aktualisierte Excel-Dateien hoch, um die Projektdaten zu synchronisieren',
  uploadButtonLabel = 'Dateien auswaehlen',
  statusTitle = 'Automatische Synchronisation',
  statusDescription,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      onUpload(Array.from(files));
    }
    // Reset the input so selecting the same files again triggers onChange
    event.target.value = '';
  };

  return (
    <div className={["space-y-4", className].filter(Boolean).join(' ')}>
      {headline ? <h4 className="font-semibold">{headline}</h4> : null}
      <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">{title}</p>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          accept=".xls,.xlsx,.xlsm"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          disabled={isSyncing}
          onClick={() => inputRef.current?.click()}
        >
          {isSyncing ? (
            <span className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Synchronisation laeuft...</span>
            </span>
          ) : (
            uploadButtonLabel
          )}
        </Button>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
        <h5 className="font-medium mb-2">{statusTitle}</h5>
        <p className="text-sm text-muted-foreground">
          {statusDescription || 'Aenderungen in Excel-Dateien werden automatisch im Dashboard aktualisiert.'}
        </p>
      </div>
    </div>
  );
};

export default ExcelSyncPanel;
