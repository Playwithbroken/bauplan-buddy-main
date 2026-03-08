import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export interface DocumentDownloadItem {
  id: string;
  title: string;
  description: string;
  accentColorClass?: string;
  onDownload?: () => void;
}

interface DocumentDownloadListProps {
  items: DocumentDownloadItem[];
  downloadLabel?: string;
}

const DocumentDownloadList: React.FC<DocumentDownloadListProps> = ({
  items,
  downloadLabel = 'Download',
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <FileText
              className={["h-8 w-8", item.accentColorClass || 'text-muted-foreground'].join(' ')}
            />
            <div>
              <h5 className="font-medium">{item.title}</h5>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => item.onDownload?.()}
          >
            {downloadLabel}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default DocumentDownloadList;
