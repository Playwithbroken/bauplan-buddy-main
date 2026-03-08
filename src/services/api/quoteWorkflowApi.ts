import { getEnvVar } from '@/utils/env';

const sanitizeBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const baseQuoteUrl = sanitizeBaseUrl(getEnvVar('VITE_QUOTE_SERVICE_URL')) || sanitizeBaseUrl(getEnvVar('VITE_API_URL'));
const baseProjectUrl = sanitizeBaseUrl(getEnvVar('VITE_PROJECT_SERVICE_URL')) || sanitizeBaseUrl(getEnvVar('VITE_API_URL'));

const resolvePath = (base: string, path: string) => {
  if (!base) return path;
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const message = text || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => ({ data: undefined }));
  return (json?.data ?? json) as T;
};

export type QuoteConversionStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface QuoteConversionRequest {
  requestedStartDate?: string;
  templateId?: string;
  options?: Record<string, unknown>;
}

export interface QuoteConversionJob {
  jobId: string;
  status: QuoteConversionStatus;
  projectId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectSummary {
  id: string;
  number: string;
  quoteId?: string;
  customerId: string;
  name: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const startQuoteConversion = async (
  quoteId: string,
  payload: QuoteConversionRequest
): Promise<QuoteConversionJob> => {
  const url = resolvePath(baseQuoteUrl || '', `/quotes/${quoteId}/convert`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse<QuoteConversionJob>(response);
};

export const getQuoteConversionJob = async (jobId: string): Promise<QuoteConversionJob> => {
  const url = resolvePath(baseQuoteUrl || '', `/quotes/conversion-jobs/${jobId}`);
  const response = await fetch(url, {
    method: 'GET'
  });
  return handleResponse<QuoteConversionJob>(response);
};

export const getProjectById = async (projectId: string): Promise<ProjectSummary | null> => {
  const url = resolvePath(baseProjectUrl || '', `/projects/${projectId}`);
  const response = await fetch(url, { method: 'GET' });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<ProjectSummary>(response);
};
