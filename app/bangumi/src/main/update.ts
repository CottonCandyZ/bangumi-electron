import { BrowserWindow, app } from 'electron'
import { getRendererHandlers } from '@egoist/tipc/main'
import type { RendererHandlers } from '@main/tipc/renderer-handlers'
import { JSONStore } from '@main/lib/store'
import { setAppQuitting } from '@main/app-flags'
import type { AppUpdateChannel, AppConfig } from '@shared/config'
import { normalizeAppConfig } from '@shared/config'
import type { AppBuildInfo, AppUpdateState } from '@shared/update'
import { UpdateManager, type UpdateInfo, type VelopackAsset } from 'velopack'

declare const __APP_BUILD_HASH__: string
declare const __APP_BUILD_TIME__: string
declare const __APP_UPDATE_SOURCE_URL__: string

const APP_CONFIG_STORE_KEY = 'appConfig'
const IGNORED_UPDATE_KEY = 'ignoredUpdate'
const STARTUP_CHECK_DELAY_MS = 3000
const DEFAULT_UPDATE_SOURCE_URL = __APP_UPDATE_SOURCE_URL__
const GITHUB_API_ACCEPT = 'application/vnd.github+json'

let initialized = false
let checkPromise: Promise<unknown> | null = null
let downloadPromise: Promise<unknown> | null = null
let availableUpdateInfo: UpdateInfo | null = null
let availableUpdateSourceUrl: string | null = null
let downloadedUpdateAsset: VelopackAsset | null = null

let updateState: AppUpdateState = {
  status: app.isPackaged ? 'idle' : 'unsupported',
  currentVersion: app.getVersion(),
  channel: readUpdateChannel(),
  packageChannel: getVelopackChannel(),
  sourceUrl: getUpdateSourceUrl(),
}

function readAppConfig(): AppConfig {
  return normalizeAppConfig(JSONStore.get(APP_CONFIG_STORE_KEY))
}

function readUpdateChannel(): AppUpdateChannel {
  return readAppConfig().update.channel
}

function getUpdateSourceUrl() {
  return process.env.BANGUMI_ELECTRON_UPDATE_URL || DEFAULT_UPDATE_SOURCE_URL
}

function getPlatformChannelPrefix() {
  if (process.platform === 'win32') return 'win'
  if (process.platform === 'darwin') return 'osx'
  return 'linux'
}

function getVelopackChannel(channel = readUpdateChannel()) {
  return (
    process.env.BANGUMI_ELECTRON_UPDATE_CHANNEL ||
    `${getPlatformChannelPrefix()}-${process.arch}-${channel}`
  )
}

function getIgnoredVersion(channel = readUpdateChannel()) {
  const ignored = JSONStore.get(IGNORED_UPDATE_KEY) as
    | { version?: string; channel?: AppUpdateChannel }
    | undefined

  if (!ignored?.version) return undefined
  if (!ignored.channel) return ignored.version
  return ignored.channel === channel ? ignored.version : undefined
}

type GitHubRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: Array<{ name: string }>
}

function createUpdateManager(sourceUrl = getUpdateSourceUrl()) {
  const channel = readUpdateChannel()

  return new UpdateManager(sourceUrl, {
    ExplicitChannel: getVelopackChannel(channel),
    AllowVersionDowngrade: false,
    MaximumDeltasBeforeFallback: 10,
  })
}

function parseGitHubRepoUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl)
    if (url.hostname !== 'github.com') return undefined

    const [owner, repo, ...rest] = url.pathname.split('/').filter(Boolean)
    if (!owner || !repo || rest.length > 0) return undefined

    return { owner, repo }
  } catch {
    return undefined
  }
}

function getGitHubReleaseDownloadUrl(sourceUrl: string, tagName: string) {
  const repo = parseGitHubRepoUrl(sourceUrl)
  if (!repo) return sourceUrl

  return `https://github.com/${repo.owner}/${repo.repo}/releases/download/${tagName}`
}

async function resolveUpdateSourceUrl(channel = readUpdateChannel()) {
  const sourceUrl = getUpdateSourceUrl()
  const repo = parseGitHubRepoUrl(sourceUrl)
  if (!repo) return sourceUrl

  const packageChannel = getVelopackChannel(channel)
  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/releases`, {
    headers: {
      Accept: GITHUB_API_ACCEPT,
      'User-Agent': 'Bangumi-Electron-Updater',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub releases request failed: ${response.status}`)
  }

  const releases = (await response.json()) as GitHubRelease[]
  const release = releases.find(
    (candidate) =>
      !candidate.draft &&
      candidate.prerelease === (channel === 'beta') &&
      candidate.assets.some((asset) => asset.name === `releases.${packageChannel}.json`),
  )

  if (!release) {
    throw new Error(`No ${channel} release found for ${packageChannel}`)
  }

  return getGitHubReleaseDownloadUrl(sourceUrl, release.tag_name)
}

async function createUpdateManagerForCheck() {
  const sourceUrl = await resolveUpdateSourceUrl()
  return { manager: createUpdateManager(sourceUrl), sourceUrl }
}

function createBaseState(status: AppUpdateState['status']): AppUpdateState {
  const channel = readUpdateChannel()

  return {
    status,
    currentVersion: app.getVersion(),
    channel,
    packageChannel: getVelopackChannel(channel),
    sourceUrl: getUpdateSourceUrl(),
  }
}

function setState(nextState: AppUpdateState) {
  updateState = nextState
  broadcastUpdateState()
}

function getUpdateStateFromAsset(
  status: AppUpdateState['status'],
  asset: VelopackAsset,
): AppUpdateState {
  const channel = readUpdateChannel()
  const version = asset.Version

  return {
    ...createBaseState(status),
    version,
    packageName: asset.FileName,
    packageSha256: asset.SHA256,
    releaseNotes: asset.NotesMarkdown || undefined,
    ignored: getIgnoredVersion(channel) === version,
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

export function getBuildInfo(): AppBuildInfo {
  return {
    version: app.getVersion(),
    buildTime: __APP_BUILD_TIME__,
    hash: __APP_BUILD_HASH__,
  }
}

export function setupAutoUpdate() {
  if (initialized) return
  initialized = true

  if (!app.isPackaged) {
    setState({
      ...createBaseState('unsupported'),
      error: '自动更新只在打包后的应用中启用',
    })
    return
  }

  let hasPendingRestart = false

  try {
    const pendingRestart = createUpdateManager().getUpdatePendingRestart()
    if (pendingRestart) {
      hasPendingRestart = true
      downloadedUpdateAsset = pendingRestart
      setState(getUpdateStateFromAsset('downloaded', pendingRestart))
    }
  } catch (error) {
    setState({
      ...createBaseState('error'),
      error: getErrorMessage(error),
    })
  }

  if (!hasPendingRestart) {
    setTimeout(() => {
      void checkForUpdates()
    }, STARTUP_CHECK_DELAY_MS)
  }
}

export async function checkForUpdates() {
  if (!app.isPackaged) return updateState
  if (checkPromise) return checkPromise.then(() => updateState)

  availableUpdateInfo = null
  availableUpdateSourceUrl = null
  downloadedUpdateAsset = null
  setState(createBaseState('checking'))

  checkPromise = createUpdateManagerForCheck()
    .then(({ manager, sourceUrl }) => {
      availableUpdateSourceUrl = sourceUrl
      return manager.checkForUpdatesAsync()
    })
    .then((updateInfo) => {
      if (!updateInfo) {
        setState({
          ...createBaseState('idle'),
          lastCheckedAt: new Date().toISOString(),
        })
        return
      }

      availableUpdateInfo = updateInfo
      setState(getUpdateStateFromAsset('available', updateInfo.TargetFullRelease))
    })
    .catch((error) => {
      setState({
        ...createBaseState('error'),
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

  if (!availableUpdateInfo) {
    await checkForUpdates()
  }

  if (!availableUpdateInfo) return updateState

  const updateInfo = availableUpdateInfo
  const manager = createUpdateManager(availableUpdateSourceUrl ?? (await resolveUpdateSourceUrl()))

  setState({
    ...getUpdateStateFromAsset('downloading', updateInfo.TargetFullRelease),
    percent: 0,
  })

  downloadPromise = manager
    .downloadUpdateAsync(updateInfo, (percent) => {
      setState({
        ...getUpdateStateFromAsset('downloading', updateInfo.TargetFullRelease),
        percent,
      })
    })
    .then(() => {
      downloadedUpdateAsset = updateInfo.TargetFullRelease
      setState(getUpdateStateFromAsset('downloaded', updateInfo.TargetFullRelease))
    })
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

  const updateToApply = downloadedUpdateAsset ?? createUpdateManager().getUpdatePendingRestart()
  if (!updateToApply) return updateState

  setAppQuitting(true)
  createUpdateManager().waitExitThenApplyUpdate(updateToApply, false, true)
  app.quit()

  return updateState
}

export function ignoreUpdate(version?: string) {
  if (!version) return updateState
  JSONStore.set(IGNORED_UPDATE_KEY, { version, channel: readUpdateChannel() })
  setState({
    ...updateState,
    ignored: true,
  })
  return updateState
}
