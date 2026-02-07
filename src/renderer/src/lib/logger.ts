import { client } from '@renderer/lib/client'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function toSerializable(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: toSerializable(value.cause, seen),
    }
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item, seen))
  }
  const record: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    record[key] = toSerializable(item, seen)
  }
  return record
}

async function write(level: LogLevel, scope: string, message: string, data?: unknown) {
  try {
    await client.writeLog({
      level,
      scope,
      message,
      data: toSerializable(data),
    })
  } catch (error) {
    console.error('[renderer-logger] write failed', error)
  }
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) => write('debug', scope, message, data),
  info: (scope: string, message: string, data?: unknown) => write('info', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => write('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) => write('error', scope, message, data),
}
