import { app } from 'electron'
import { appendFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
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
const LOG_RETENTION_DAYS = 14
const RENDERER_LOG_FILE_RE = /^renderer-(\d{4}-\d{2}-\d{2})\.log$/

interface PendingLog {
  line: string
  resolve: () => void
  reject: (error: unknown) => void
}

let writeQueue = Promise.resolve()
let pendingLogs: PendingLog[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let lastCleanupDay: string | null = null

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
  await cleanupOldRendererLogs(dir)
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

export async function exportLogs(targetFilePath: string) {
  await flushBufferedLogs()

  const logsDir = app.getPath('logs')
  await mkdir(logsDir, { recursive: true })
  await cleanupOldRendererLogs(logsDir)

  const fileNames = (await readdir(logsDir)).filter((fileName) => fileName.endsWith('.log')).sort()
  const sections = await Promise.all(
    fileNames.map(async (fileName) => {
      const content = await readFile(path.join(logsDir, fileName), 'utf8')
      return `===== ${fileName} =====\n${content.trimEnd()}\n`
    }),
  )

  const output =
    sections.length > 0
      ? sections.join('\n')
      : `===== empty =====\nNo renderer logs were found in ${logsDir}\n`

  await writeFile(targetFilePath, output, 'utf8')
}

async function cleanupOldRendererLogs(logsDir: string) {
  const cleanupDay = new Date().toISOString().slice(0, 10)
  if (lastCleanupDay === cleanupDay) return
  lastCleanupDay = cleanupDay

  const cutoffTime = startOfUtcDay(new Date()).getTime() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
  const fileNames = await readdir(logsDir)

  await Promise.all(
    fileNames.map(async (fileName) => {
      const match = RENDERER_LOG_FILE_RE.exec(fileName)
      if (!match) return

      const createdAt = new Date(`${match[1]}T00:00:00.000Z`)
      if (Number.isNaN(createdAt.getTime()) || createdAt.getTime() >= cutoffTime) return

      await rm(path.join(logsDir, fileName), { force: true })
    }),
  )
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}
