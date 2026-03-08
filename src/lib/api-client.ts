/**
 * Universal API Client
 * Handles all HTTP requests to backend microservices
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  private mergeHeaders(override?: HeadersInit): HeadersInit {
    if (!override) {
      return { ...this.defaultHeaders };
    }

    const headers = new Headers(this.defaultHeaders);

    if (override instanceof Headers) {
      override.forEach((value, key) => headers.set(key, value));
    } else if (Array.isArray(override)) {
      override.forEach(([key, value]) => headers.set(key, value));
    } else {
      Object.entries(override).forEach(([key, value]) => headers.set(key, value));
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: Partial<ApiError> | undefined;
      
      if (isJson) {
        errorData = await response.json() as Partial<ApiError>;
      } else {
        const message = await response.text();
        errorData = { message };
      }

      const message = typeof errorData?.message === 'string'
        ? errorData.message
        : `HTTP ${response.status}: ${response.statusText}`;

      throw new ApiClientError(
        message,
        response.status,
        errorData?.code,
        errorData?.details
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    if (isJson) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: 'GET',
      headers: this.mergeHeaders(fetchOptions.headers),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.mergeHeaders(fetchOptions.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: this.mergeHeaders(fetchOptions.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.mergeHeaders(fetchOptions.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.mergeHeaders(fetchOptions.headers),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  setAuthToken(token: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`,
    };
  }

  clearAuthToken() {
    const { Authorization: _removed, ...rest } = this.defaultHeaders;
    this.defaultHeaders = rest;
  }
}

export const apiClient = new ApiClient();
