/**
 * API Rate Limiting Utility
 * 
 * Enterprise-grade rate limiting with:
 * - Token bucket algorithm
 * - Per-endpoint limits
 * - Automatic retry with backoff
 * - Queue management
 * - Request prioritization
 */

export interface RateLimitConfig {
  maxRequests: number;      // Max requests per window
  windowMs: number;         // Time window in milliseconds
  maxQueueSize: number;     // Max queued requests
  retryAfterMs: number;     // Retry delay when rate limited
}

export interface RequestOptions {
  priority?: "high" | "normal" | "low";
  skipQueue?: boolean;
}

interface QueuedRequest {
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

const PRIORITY_WEIGHTS = {
  high: 3,
  normal: 2,
  low: 1,
};

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[] = [];
  private processing = false;
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequests: 100,       // 100 requests
      windowMs: 60000,        // per minute
      maxQueueSize: 50,       // max 50 queued requests
      retryAfterMs: 1000,     // 1 second retry
      ...config,
    };
    
    this.tokens = this.config.maxRequests;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillAmount = (elapsed / this.config.windowMs) * this.config.maxRequests;
    
    this.tokens = Math.min(this.config.maxRequests, this.tokens + refillAmount);
    this.lastRefill = now;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      this.refillTokens();

      if (this.tokens < 1) {
        // Wait for tokens to refill
        await new Promise(resolve => setTimeout(resolve, this.config.retryAfterMs));
        continue;
      }

      // Sort by priority (higher first) then by timestamp (earlier first)
      this.queue.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });

      const request = this.queue.shift()!;
      this.tokens -= 1;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.processing = false;
  }

  async execute<T>(
    fn: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { priority = "normal", skipQueue = false } = options;

    // Refill tokens
    this.refillTokens();

    // If we have tokens and skipQueue is true, execute immediately
    if (skipQueue && this.tokens >= 1) {
      this.tokens -= 1;
      return fn();
    }

    // Check if we have tokens available
    if (this.tokens >= 1 && this.queue.length === 0) {
      this.tokens -= 1;
      return fn();
    }

    // Check queue size
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error("Rate limit queue full. Please try again later.");
    }

    // Add to queue
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority: PRIORITY_WEIGHTS[priority],
        timestamp: Date.now(),
      });

      // Start processing queue
      this.processQueue();
    });
  }

  // Get current status
  getStatus(): { tokens: number; queueSize: number; isProcessing: boolean } {
    this.refillTokens();
    return {
      tokens: Math.floor(this.tokens),
      queueSize: this.queue.length,
      isProcessing: this.processing,
    };
  }

  // Clear the queue
  clearQueue(): void {
    const error = new Error("Queue cleared");
    this.queue.forEach(request => request.reject(error));
    this.queue = [];
  }
}

// Create endpoint-specific rate limiters
const rateLimiters: Map<string, RateLimiter> = new Map();

export function getRateLimiter(endpoint: string, config?: Partial<RateLimitConfig>): RateLimiter {
  if (!rateLimiters.has(endpoint)) {
    rateLimiters.set(endpoint, new RateLimiter(config));
  }
  return rateLimiters.get(endpoint)!;
}

// Default global rate limiter
export const globalRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

// Convenience wrapper for fetch with rate limiting
export async function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RequestOptions
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const endpoint = new URL(url, window.location.origin).pathname;
  
  const limiter = getRateLimiter(endpoint);
  
  return limiter.execute(() => fetch(input, init), options);
}

// Decorator for rate limiting class methods
export function rateLimit(config?: Partial<RateLimitConfig>) {
  const limiter = new RateLimiter(config);
  
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      return limiter.execute(() => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}

export { RateLimiter };
