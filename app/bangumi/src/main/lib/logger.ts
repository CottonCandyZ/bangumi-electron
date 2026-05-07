import { app } from 'electron'
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  scope: string
  message: string
  data?: unknown
  createdAt?: string
}

const BATCH_FLUSH_MS = 300
const BATCH_MAX_LINES = 30

interface PendingLog {
  line: string
  resolve: () => void
  reject: (error: unknown) => void
}

let writeQueue = Promise.resolve()
let pendingLogs: PendingLog[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function getLogFilePath() {
  const date = new Date().toISOString().slice(0, 10)
  const dir = app.getPath('logs')
  return {
    dir,
    filePath: path.join(dir, `renderer-${date}.log`),
  }
}

function stringifyData(data: unknown) {
  if (data === undefined) return ''
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

function formatLogLine(entry: LogEntry) {
  const createdAt = entry.createdAt ?? new Date().toISOString()
  const scope = entry.scope || 'app'
  const data = stringifyData(entry.data)
  return `${createdAt} [${entry.level.toUpperCase()}] [${scope}] ${entry.message}${data ? ` ${data}` : ''}\n`
}

async function writeLogLine(lines: string) {
  const { dir, filePath } = getLogFilePath()
  await mkdir(dir, { recursive: true })
  await appendFile(filePath, lines, 'utf8')
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushBufferedLogs()
  }, BATCH_FLUSH_MS)
}

async function flushBufferedLogs() {
  if (pendingLogs.length === 0) return
  const batch = pendingLogs
  pendingLogs = []
  const lines = batch.map((item) => item.line).join('')

  writeQueue = writeQueue
    .then(async () => {
      await writeLogLine(lines)
      batch.forEach((item) => item.resolve())
    })
    .catch((error) => {
      console.error('[logger] write log failed', error)
      batch.forEach((item) => item.reject(error))
    })

  await writeQueue
}

export async function appendRendererLog(entry: LogEntry) {
  const line = formatLogLine(entry)
  const task = new Promise<void>((resolve, reject) => {
    pendingLogs.push({ line, resolve, reject })
  })

  if (pendingLogs.length >= BATCH_MAX_LINES) {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    void flushBufferedLogs()
  } else {
    scheduleFlush()
  }

  await task
}
