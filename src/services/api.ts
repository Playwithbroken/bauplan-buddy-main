import { ApiResponse } from '@/types/calendar';
import { getEnvVar } from '@/utils/env';

// API Configuration
const API_BASE_URL = getEnvVar('VITE_API_URL', 'http://localhost:3001/api');

// HTTP Client Configuration
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Add authorization token if available
  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP Error: ${response.status}`,
          code: response.status.toString(),
        }));
        
        throw new ApiError({
          message: errorData.message || `Request failed with status ${response.status}`,
          code: errorData.code || response.status.toString(),
          details: errorData,
        });
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      throw new ApiError({
        message: error instanceof Error ? error.message : 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: error,
      });
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const searchParams = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${searchParams}`);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Custom ApiError class
class ApiError extends Error {
  public code: string;
  public details?: unknown;

  constructor({ message, code, details }: { message: string; code: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// Create and export the API client instance
const apiClient = new ApiClient(API_BASE_URL);

export { apiClient, ApiError };
export default apiClient;