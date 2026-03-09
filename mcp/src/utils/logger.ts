import type { LogLevel } from "./env.js";

type LogContext = Record<string, unknown>;

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export class Logger {
  constructor(
    private readonly level: LogLevel,
    private readonly staticContext: LogContext = {}
  ) {}

  child(context: LogContext): Logger {
    return new Logger(this.level, { ...this.staticContext, ...context });
  }

  debug(message: string, context: LogContext = {}): void {
    this.write("debug", message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.write("info", message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.write("warn", message, context);
  }

  error(message: string, context: LogContext = {}): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context: LogContext): void {
    if (levelWeight[level] < levelWeight[this.level]) {
      return;
    }

    const payload = {
      ts: new Date().toISOString(),
      level,
      message,
      ...this.staticContext,
      ...context
    };

    // MCP stdio transport uses stdout for protocol frames.
    // Any non-protocol stdout output can break initialization.
    const line = `${JSON.stringify(payload)}\n`;
    process.stderr.write(line);
  }
}

export function createLogger(level: LogLevel, context: LogContext = {}): Logger {
  return new Logger(level, context);
}
