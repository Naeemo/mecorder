type LogLevel = 'info' | 'log' | 'error' | 'warn' | 'debug'

export function log(level: LogLevel, ...args: unknown[]): void {
    console[level](...args)
}
