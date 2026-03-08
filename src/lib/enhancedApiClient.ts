/**
 * Enhanced API Client
 * 
 * Enterprise-grade HTTP client with:
 * - Circuit breaker pattern
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Request deduplication
 * - Timeout handling
 * - Offline detection
 */

import { logger } from "./logger";
import { globalRateLimiter } from "./rateLimiter";

export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTime: number;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  skipRateLimit?: boolean;
  deduplicate?: boolean;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

class EnhancedApiClient {
  private config: ApiClientConfig;
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  };
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private accessToken: string | null = null;
  private unauthorizedHandler?: () => Promise<boolean>;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1",
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTime: 30000,
      ...config,
    };
  }

  /**
   * Configure the client
   */
  configure(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set access token for authentication
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Set unauthorized handler
   */
  setUnauthorizedHandler(handler?: () => Promise<boolean>): void {
    this.unauthorizedHandler = handler;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index >= 0) this.requestInterceptors.splice(index, 1);
    };
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index >= 0) this.responseInterceptors.splice(index, 1);
    };
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index >= 0) this.errorInterceptors.splice(index, 1);
    };
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (!this.circuitBreaker.isOpen) return false;

    // Check if reset time has passed
    const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
    if (timeSinceLastFailure >= this.config.circuitBreakerResetTime) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      logger.info("Circuit breaker reset");
      return false;
    }

    return true;
  }

  /**
   * Record a failure for circuit breaker
   */
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      logger.warn("Circuit breaker opened", {
        failures: this.circuitBreaker.failures,
        resetIn: this.config.circuitBreakerResetTime,
      });
    }
  }

  /**
   * Record a success for circuit breaker
   */
  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    if (this.circuitBreaker.isOpen) {
      this.circuitBreaker.isOpen = false;
      logger.info("Circuit breaker closed after success");
    }
  }

  /**
   * Generate request key for deduplication
   */
  private getRequestKey(url: string, config: RequestConfig): string {
    const method = config.method || "GET";
    const body = config.body ? JSON.stringify(config.body) : "";
    return `${method}:${url}:${body}`;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const timeout = config.timeout || this.config.timeout;
      
      const fetchPromise = fetch(url, config);
      const response = await Promise.race([
        fetchPromise,
        this.createTimeoutPromise(timeout),
      ]);

      // Handle unauthorized
      if (response.status === 401 && this.unauthorizedHandler) {
        const refreshed = await this.unauthorizedHandler();
        if (refreshed && attempt === 1) {
          // Retry with new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
          return this.executeWithRetry(url, config, attempt + 1);
        }
      }

      // Record success for circuit breaker
      if (response.ok) {
        this.recordSuccess();
      }

      return response;
    } catch (error) {
      const retries = config.retries ?? this.config.retryAttempts;
      
      if (attempt < retries && this.shouldRetry(error)) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        logger.debug(`Retrying request (attempt ${attempt + 1})`, { url, delay });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(url, config, attempt + 1);
      }

      this.recordFailure();
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors or timeouts
      if (error.message.includes("timeout")) return true;
      if (error.message.includes("network")) return true;
      if (error.message.includes("fetch")) return true;
    }
    return false;
  }

  /**
   * Main request method
   */
  async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error("Service temporarily unavailable (circuit breaker open)");
    }

    // Check online status
    if (!navigator.onLine) {
      throw new Error("No network connection");
    }

    const url = endpoint.startsWith("http") 
      ? endpoint 
      : `${this.config.baseUrl}${endpoint}`;

    // Apply request interceptors
    let finalConfig: RequestConfig = {
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    // Add auth token
    if (!config.skipAuth && this.accessToken) {
      finalConfig.headers = {
        ...finalConfig.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // Check for duplicate request
    if (config.deduplicate !== false && config.method?.toUpperCase() === "GET") {
      const requestKey = this.getRequestKey(url, finalConfig);
      const pending = this.pendingRequests.get(requestKey);
      
      if (pending && Date.now() - pending.timestamp < 5000) {
        logger.debug("Deduplicating request", { url });
        const response = await pending.promise;
        return response.clone().json();
      }
    }

    // Rate limiting
    const executeRequest = async (): Promise<Response> => {
      const requestKey = this.getRequestKey(url, finalConfig);
      
      const promise = this.executeWithRetry(url, finalConfig);
      this.pendingRequests.set(requestKey, { promise, timestamp: Date.now() });

      try {
        const response = await promise;
        return response;
      } finally {
        // Clean up pending request after a delay
        setTimeout(() => this.pendingRequests.delete(requestKey), 100);
      }
    };

    let response: Response;
    if (config.skipRateLimit) {
      response = await executeRequest();
    } else {
      response = await globalRateLimiter.execute(executeRequest);
    }

    // Apply response interceptors
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    // Parse response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
      
      // Apply error interceptors
      let finalError = error;
      for (const interceptor of this.errorInterceptors) {
        finalError = await interceptor(finalError);
      }
      
      throw finalError;
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Convenience methods
   */
  async get<T = unknown>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  /**
   * Get circuit breaker status
   */
  getCircuitStatus(): { isOpen: boolean; failures: number } {
    return {
      isOpen: this.circuitBreaker.isOpen,
      failures: this.circuitBreaker.failures,
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuit(): void {
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    logger.info("Circuit breaker manually reset");
  }
}

// Singleton instance
export const enhancedApiClient = new EnhancedApiClient();

// Export for testing
export { EnhancedApiClient };
