import { getEnvVar } from '@/utils/env';

type RequestParams = Record<string, string | number | boolean | undefined>;

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    statusCode?: number;
    details?: unknown;
  };
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  params?: RequestParams;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiClient {
  private readonly baseURL: string;
  private timeout = 30_000;
  private maxRetries = 3;
  private retryDelay = 1_000;
  private accessToken: string | null = null;
  private organizationId: string | null = null;
  private unauthorizedHandler?: () => Promise<boolean>;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL.replace(/\/+$/, '') || '/api';
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setOrganizationId(orgId: string | null) {
    this.organizationId = orgId;
  }

  setUnauthorizedHandler(handler?: () => Promise<boolean>) {
    this.unauthorizedHandler = handler;
  }

  private buildUrl(endpoint: string, params?: RequestParams): string {
    const [rawPath, existingQuery] = endpoint.split('?');
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const base = this.baseURL.endsWith('/')
      ? this.baseURL.slice(0, -1)
      : this.baseURL;

    const urlWithoutQuery = `${base}${normalizedPath}`.replace(/([^:]\/)\/+/g, '$1');
    const searchParams = new URLSearchParams(existingQuery ?? '');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        searchParams.set(key, String(value));
      });
    }

    const queryString = searchParams.toString();
    return queryString ? `${urlWithoutQuery}?${queryString}` : urlWithoutQuery;
  }

  private resolveHeaders(headers?: HeadersInit): HeadersInit {
    const resolved: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      resolved.Authorization = `Bearer ${this.accessToken}`;
    }

    if (this.organizationId) {
      resolved['x-organization-id'] = this.organizationId;
    }

    if (!headers) {
      return resolved;
    }

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        resolved[key] = value;
      });
      return resolved;
    }

    if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        resolved[key] = value;
      });
      return resolved;
    }

    return { ...resolved, ...headers };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number, baseDelay: number): number {
    return baseDelay * Math.pow(2, attempt);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private createApiError(response: Response, body: string): ApiError {
    let payload: ApiErrorPayload | null = null;
    if (body) {
      try {
        payload = JSON.parse(body) as ApiErrorPayload;
      } catch {
        // ignore invalid JSON and fall back to raw body
      }
    }

    const message =
      payload?.error?.message ??
      payload?.message ??
      (body ? body : response.statusText) ??
      `Request failed with status ${response.status}`;

    const code =
      payload?.error?.code ??
      payload?.code ??
      payload?.error?.statusCode?.toString() ??
      response.status.toString();

    const details = payload?.error?.details ?? payload ?? body;

    return new ApiError(message, response.status, code, details);
  }

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      timeout = this.timeout,
      retries = this.maxRetries,
      retryDelay: retryDelayOverride,
      params,
      headers,
      ...init
    } = options;

    const retryDelay = retryDelayOverride ?? this.retryDelay;
    const url = this.buildUrl(endpoint, params);
    const resolvedHeaders = this.resolveHeaders(headers);

    let lastError: Error | null = null;
    let hasRetriedUnauthorized = false;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            ...init,
            headers: resolvedHeaders,
          },
          timeout
        );

        if (response.ok) {
          if (response.status === 204) {
            return {} as T;
          }

          const contentType = response.headers.get('content-type') ?? '';

          if (contentType.includes('application/json')) {
            return (await response.json()) as T;
          }

          if (
            contentType.includes('application/pdf') ||
            contentType.includes('application/octet-stream')
          ) {
            const blob = await response.blob();
            return blob as unknown as T;
          }

          if (contentType.startsWith('text/')) {
            const text = await response.text();
            return (text as unknown) as T;
          }

          // Fallback: attempt to parse as JSON, otherwise return ArrayBuffer
          const raw = await response.arrayBuffer();
          return raw as unknown as T;
        }

        const rawBody = await response.text().catch(() => '');
        const apiError = this.createApiError(response, rawBody);

        if (response.status === 401) {
          if (this.unauthorizedHandler && !hasRetriedUnauthorized) {
            try {
              const handled = await this.unauthorizedHandler();
              if (handled) {
                hasRetriedUnauthorized = true;
                lastError = null;
                continue;
              }
            } catch (handlerError) {
              lastError = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
              throw lastError;
            }
          }
          throw apiError;
        }

        if (response.status < 500) {
          throw apiError;
        }

        // For 5xx errors, attempt retry
        lastError = apiError;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isTimeoutError =
          lastError instanceof Error &&
          typeof lastError.message === 'string' &&
          lastError.message.includes('Request timeout');

        if (
          (lastError instanceof ApiError && lastError.statusCode < 500) ||
          (!isTimeoutError && !(lastError instanceof ApiError))
        ) {
          throw lastError;
        }
      }

      if (attempt < retries && lastError) {
        const delay = this.calculateBackoff(attempt, retryDelay);
        await this.sleep(delay);
      }
    }

    throw (
      lastError ||
      new ApiError('Request failed', 500, 'UNKNOWN_ERROR')
    );
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

const DEFAULT_BASE_URL =
  getEnvVar('VITE_API_URL', 'http://localhost:3001/api/v1') ?? 'http://localhost:3001/api/v1';

export const apiClient = new ApiClient(DEFAULT_BASE_URL);

export default ApiClient;
