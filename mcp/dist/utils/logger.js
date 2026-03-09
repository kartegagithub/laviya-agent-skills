const levelWeight = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};
export class Logger {
    level;
    staticContext;
    constructor(level, staticContext = {}) {
        this.level = level;
        this.staticContext = staticContext;
    }
    child(context) {
        return new Logger(this.level, { ...this.staticContext, ...context });
    }
    debug(message, context = {}) {
        this.write("debug", message, context);
    }
    info(message, context = {}) {
        this.write("info", message, context);
    }
    warn(message, context = {}) {
        this.write("warn", message, context);
    }
    error(message, context = {}) {
        this.write("error", message, context);
    }
    write(level, message, context) {
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
export function createLogger(level, context = {}) {
    return new Logger(level, context);
}
//# sourceMappingURL=logger.js.map