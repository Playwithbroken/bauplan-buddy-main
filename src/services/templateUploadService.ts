export type TemplateUploadStatus = 'active' | 'draft' | 'archived';

export interface UploadedTemplate {
  id: string;
  templateId: string;
  templateName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  status: TemplateUploadStatus;
  notes?: string;
  dataUrl?: string;
  version: number;
}

interface CreateUploadInput {
  templateId: string;
  templateName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  notes?: string;
  dataUrl?: string;
}

interface UpdateUploadInput extends Partial<Omit<UploadedTemplate, 'id' | 'uploadedAt'>> {
  id: string;
}

export interface TemplateUploadSummary {
  total: number;
  active: number;
  archived: number;
  latestUploadDate?: string;
}

class TemplateUploadService {
  private static instance: TemplateUploadService;
  private static STORAGE_KEY = 'bp_template_uploads';
  private uploads: UploadedTemplate[] = [];

  static getInstance(): TemplateUploadService {
    if (!TemplateUploadService.instance) {
      TemplateUploadService.instance = new TemplateUploadService();
    }
    return TemplateUploadService.instance;
  }

  private constructor() {
    this.uploads = this.loadUploads();
  }

  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__tpl_upload_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private loadUploads(): UploadedTemplate[] {
    if (!this.isStorageAvailable()) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(TemplateUploadService.STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as UploadedTemplate[];
      return Array.isArray(parsed)
        ? parsed.map((entry) => ({
            ...entry,
            uploadedAt: entry.uploadedAt ?? new Date().toISOString(),
            version: entry.version ?? 1
          }))
        : [];
    } catch (error) {
      console.error('Failed to load template uploads:', error);
      return [];
    }
  }

  private persist(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.setItem(
        TemplateUploadService.STORAGE_KEY,
        JSON.stringify(this.uploads)
      );
    } catch (error) {
      console.error('Failed to persist template uploads:', error);
    }
  }

  public getUploads(): UploadedTemplate[] {
    return [...this.uploads].sort((a, b) => {
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
  }

  public getUploadsByTemplate(templateId: string): UploadedTemplate[] {
    return this.getUploads().filter((upload) => upload.templateId === templateId);
  }

  public addUpload(input: CreateUploadInput): UploadedTemplate {
    const newUpload: UploadedTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      version: 1,
      status: 'active',
      uploadedAt: new Date().toISOString(),
      ...input
    };

    this.uploads.push(newUpload);
    this.persist();
    return newUpload;
  }

  public updateUpload(update: UpdateUploadInput): UploadedTemplate | null {
    const index = this.uploads.findIndex((upload) => upload.id === update.id);
    if (index === -1) {
      return null;
    }

    const current = this.uploads[index];
    const shouldIncrementVersion = Boolean(update.dataUrl || update.filename);

    const nextUpload: UploadedTemplate = {
      ...current,
      ...update,
      version: shouldIncrementVersion ? current.version + 1 : current.version
    };

    this.uploads[index] = nextUpload;
    this.persist();
    return nextUpload;
  }

  public removeUpload(id: string): boolean {
    const initialLength = this.uploads.length;
    this.uploads = this.uploads.filter((upload) => upload.id !== id);
    const removed = this.uploads.length < initialLength;
    if (removed) {
      this.persist();
    }
    return removed;
  }

  public getSummary(): TemplateUploadSummary {
    const uploads = this.getUploads();
    const active = uploads.filter((upload) => upload.status !== 'archived').length;
    const archived = uploads.length - active;

    return {
      total: uploads.length,
      active,
      archived,
      latestUploadDate: uploads[0]?.uploadedAt
    };
  }
}

export default TemplateUploadService.getInstance();