export function log(level: keyof Console, ...args: unknown[]): void {
  console[level](...args)
}
