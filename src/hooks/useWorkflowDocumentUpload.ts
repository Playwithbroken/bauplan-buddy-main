import { ChangeEvent, RefObject, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';
import {
  uploadWorkflowDocument,
  type WorkflowDocumentContext,
  type UploadDocumentOptions,
} from '@/utils/documentUpload';

interface UploadRequest {
  context: WorkflowDocumentContext;
  metadata?: UploadDocumentOptions;
  key?: string;
  onSuccess?: (documentName: string) => void;
  successMessage?: string;
}

interface UseWorkflowDocumentUploadResult {
  inputProps: {
    ref: RefObject<HTMLInputElement>;
    type: string;
    className: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    accept: string;
  };
  startUpload: (request: UploadRequest) => void;
  isUploading: boolean;
  isUploadingForKey: (key: string) => boolean;
  uploadedDocuments: Record<string, string>;
}

const DEFAULT_ACCEPT = '.pdf,.png,.jpg,.jpeg';

export function useWorkflowDocumentUpload(accept: string = DEFAULT_ACCEPT): UseWorkflowDocumentUploadResult {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingRequest, setPendingRequest] = useState<UploadRequest | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});

  const startUpload = (request: UploadRequest) => {
    setPendingRequest(request);
    const key = request.key ?? request.context.workflowId;
    setActiveKey(key ?? null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const request = pendingRequest;
    if (!file || !request) {
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const document = await uploadWorkflowDocument(file, request.context, request.metadata);
      const key = request.key ?? request.context.workflowId;
      if (key) {
        setUploadedDocuments(prev => ({ ...prev, [key]: document.name }));
      }
      request.onSuccess?.(document.name);
      toast({
        title: 'Dokument hochgeladen',
        description: request.successMessage ?? `${document.name} wurde erfolgreich gespeichert.`,
      });
    } catch (error) {
      toast({
        title: 'Upload fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Die Datei konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setPendingRequest(null);
      setActiveKey(null);
      event.target.value = '';
    }
  }, [pendingRequest, toast]);

  const inputProps = useMemo(
    () => ({
      ref: fileInputRef,
      type: 'file' as const,
      className: 'hidden',
      onChange: handleFileChange,
      accept,
    }),
    [accept, handleFileChange]
  );

  const isUploadingForKey = (key: string) => isUploading && activeKey === key;

  return {
    inputProps,
    startUpload,
    isUploading,
    isUploadingForKey,
    uploadedDocuments,
  };
}
