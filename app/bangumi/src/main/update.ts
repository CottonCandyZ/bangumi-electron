import { BrowserWindow, app } from 'electron'
import electronUpdater, { type ProgressInfo, type UpdateInfo } from 'electron-updater'
import { getRendererHandlers } from '@egoist/tipc/main'
import type { RendererHandlers } from '@main/tipc/renderer-handlers'
import { JSONStore } from '@main/lib/store'
import { setAppQuitting } from '@main/app-flags'
import type { AppUpdateState } from '@shared/update'

const { autoUpdater } = electronUpdater

const IGNORED_UPDATE_KEY = 'ignoredUpdate'
const STARTUP_CHECK_DELAY_MS = 3000

let initialized = false
let checkPromise: Promise<unknown> | null = null
let downloadPromise: Promise<unknown> | null = null

let updateState: AppUpdateState = {
  status: app.isPackaged ? 'idle' : 'unsupported',
  currentVersion: app.getVersion(),
}

function getIgnoredVersion() {
  const ignored = JSONStore.get(IGNORED_UPDATE_KEY) as { version?: string } | undefined
  return ignored?.version
}

function setState(nextState: AppUpdateState) {
  updateState = nextState
  broadcastUpdateState()
}

function getUpdateStateFromInfo(
  status: AppUpdateState['status'],
  info: UpdateInfo,
): AppUpdateState {
  const version = info.version
  return {
    status,
    currentVersion: app.getVersion(),
    version,
    releaseName: info.releaseName ?? null,
    releaseDate: info.releaseDate,
    ignored: getIgnoredVersion() === version,
    lastCheckedAt: new Date().toISOString(),
  }
}

function broadcastUpdateState() {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) continue
    const handlers = getRendererHandlers<RendererHandlers>(window.webContents)
    handlers.updateState.send(updateState)
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export function getUpdateState() {
  return updateState
}

export function setupAutoUpdate() {
  if (initialized) return
  initialized = true

  if (!app.isPackaged) {
    setState({
      status: 'unsupported',
      currentVersion: app.getVersion(),
      error: '自动更新只在打包后的应用中启用',
    })
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    setState({
      status: 'checking',
      currentVersion: app.getVersion(),
    })
  })

  autoUpdater.on('update-available', (info) => {
    setState(getUpdateStateFromInfo('available', info))
  })

  autoUpdater.on('update-not-available', () => {
    setState({
      status: 'idle',
      currentVersion: app.getVersion(),
      lastCheckedAt: new Date().toISOString(),
    })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    setState({
      ...updateState,
      status: 'downloading',
      percent: progress.percent,
    })
  })

  autoUpdater.on('update-downloaded', (event) => {
    setState(getUpdateStateFromInfo('downloaded', event))
  })

  autoUpdater.on('error', (error) => {
    setState({
      ...updateState,
      status: 'error',
      error: getErrorMessage(error),
    })
  })

  setTimeout(() => {
    void checkForUpdates()
  }, STARTUP_CHECK_DELAY_MS)
}

export async function checkForUpdates() {
  if (!app.isPackaged) return updateState
  if (checkPromise) return checkPromise.then(() => updateState)

  checkPromise = autoUpdater
    .checkForUpdates()
    .catch((error) => {
      setState({
        ...updateState,
        status: 'error',
        error: getErrorMessage(error),
      })
    })
    .finally(() => {
      checkPromise = null
    })

  await checkPromise
  return updateState
}

export async function downloadUpdate() {
  if (!app.isPackaged) return updateState
  if (updateState.status === 'downloaded') return updateState
  if (downloadPromise) return downloadPromise.then(() => updateState)

  downloadPromise = autoUpdater
    .downloadUpdate()
    .catch((error) => {
      setState({
        ...updateState,
        status: 'error',
        error: getErrorMessage(error),
      })
    })
    .finally(() => {
      downloadPromise = null
    })

  await downloadPromise
  return updateState
}

export function installUpdate() {
  if (!app.isPackaged || updateState.status !== 'downloaded') return updateState
  setAppQuitting(true)
  autoUpdater.quitAndInstall(false, true)
  return updateState
}

export function ignoreUpdate(version?: string) {
  if (!version) return updateState
  JSONStore.set(IGNORED_UPDATE_KEY, { version })
  setState({
    ...updateState,
    ignored: true,
  })
  return updateState
}
