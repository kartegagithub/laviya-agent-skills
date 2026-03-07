import type { LogLevel } from "./env.js";
type LogContext = Record<string, unknown>;
export declare class Logger {
    private readonly level;
    private readonly staticContext;
    constructor(level: LogLevel, staticContext?: LogContext);
    child(context: LogContext): Logger;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    private write;
}
export declare function createLogger(level: LogLevel, context?: LogContext): Logger;
export {};
//# sourceMappingURL=logger.d.ts.map