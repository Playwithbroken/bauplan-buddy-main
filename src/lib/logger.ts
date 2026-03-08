/**
 * Structured Logging Service
 * 
 * Enterprise-grade logging with:
 * - Log levels (debug, info, warn, error)
 * - Structured metadata
 * - Console output with colors
 * - Remote logging support (configurable)
 * - Performance timing
 * - Error tracking integration ready
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  appName: string;
  environment: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "#9CA3AF", // gray
  info: "#3B82F6",  // blue
  warn: "#F59E0B",  // amber
  error: "#EF4444", // red
};

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.config = {
      minLevel: import.meta.env.DEV ? "debug" : "info",
      enableConsole: true,
      enableRemote: false,
      appName: "bauplan-buddy",
      environment: import.meta.env.MODE || "development",
    };

    // Start flush timer for remote logging
    if (typeof window !== "undefined") {
      this.startFlushTimer();
    }
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        app: this.config.appName,
        env: this.config.environment,
        url: typeof window !== "undefined" ? window.location.pathname : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
    };
  }

  private consoleLog(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const color = LOG_COLORS[entry.level];
    const prefix = `%c[${entry.level.toUpperCase()}]`;
    const style = `color: ${color}; font-weight: bold;`;

    const args: unknown[] = [prefix, style, entry.message];
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      args.push(entry.context);
    }

    if (entry.stack) {
      args.push("\n" + entry.stack);
    }

    switch (entry.level) {
      case "debug":
        console.debug(...args);
        break;
      case "info":
        console.info(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    
    // Keep buffer size manageable
    if (this.buffer.length > this.BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Immediately flush errors
    if (entry.level === "error" && this.config.enableRemote) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      if (this.config.enableRemote && this.buffer.length > 0) {
        this.flush();
      }
    }, this.FLUSH_INTERVAL);
  }

  async flush(): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint || this.buffer.length === 0) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      // Re-add entries to buffer on failure
      this.buffer = [...entries, ...this.buffer].slice(-this.BUFFER_SIZE);
      console.error("Failed to send logs to remote:", error);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;
    
    const entry = this.formatMessage("debug", message, context);
    this.consoleLog(entry);
    this.addToBuffer(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;
    
    const entry = this.formatMessage("info", message, context);
    this.consoleLog(entry);
    this.addToBuffer(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    
    const entry = this.formatMessage("warn", message, context);
    this.consoleLog(entry);
    this.addToBuffer(entry);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog("error")) return;
    
    const entry = this.formatMessage("error", message, {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message,
    });
    
    if (error?.stack) {
      entry.stack = error.stack;
    }

    this.consoleLog(entry);
    this.addToBuffer(entry);
  }

  // Performance timing helper
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { durationMs: Math.round(duration) });
    };
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.buffer.slice(-count);
  }

  // Group related logs
  group(label: string): void {
    if (this.config.enableConsole) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.config.enableConsole) {
      console.groupEnd();
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
