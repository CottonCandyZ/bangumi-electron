import { readdir, unlink } from 'node:fs/promises'
import path from 'node:path'
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
const VELOPACK_PACKAGE_ID = 'io.github.cottoncandyz.bangumi-electron'

let initialized = false
let checkPromise: Promise<unknown> | null = null
let checkPromiseChannel: AppUpdateChannel | null = null
let checkRunId = 0
let downloadPromise: Promise<unknown> | null = null
let availableUpdateInfo: UpdateInfo | null = null
let availableUpdateSourceUrl: string | null = null
let downloadedUpdateSourceUrl: string | null = null
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
  assets: Array<{ name: string; browser_download_url: string }>
}

type ResolvedGitHubRelease = {
  release: GitHubRelease
  feedUrl: string
  sourceUrl: string
}

type GitHubAssetFeed = {
  Assets?: Partial<VelopackAsset>[]
}

type ResolvedUpdateCheck = {
  updateInfo: UpdateInfo | null
  sourceUrl?: string
  unavailableReason?: string
}

function createUpdateManager(sourceUrl = getUpdateSourceUrl(), channel = readUpdateChannel()) {
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

async function resolveGitHubRelease(
  channel = readUpdateChannel(),
): Promise<ResolvedGitHubRelease | null> {
  const sourceUrl = getUpdateSourceUrl()
  const repo = parseGitHubRepoUrl(sourceUrl)
  if (!repo) return null

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
    return null
  }

  const feed = release.assets.find((asset) => asset.name === `releases.${packageChannel}.json`)
  if (!feed) return null

  return {
    release,
    feedUrl: feed.browser_download_url,
    sourceUrl: getGitHubReleaseDownloadUrl(sourceUrl, release.tag_name),
  }
}

async function resolveUpdateSourceUrl(channel = readUpdateChannel()) {
  const sourceUrl = getUpdateSourceUrl()
  const repo = parseGitHubRepoUrl(sourceUrl)
  if (!repo) return sourceUrl

  const resolved = await resolveGitHubRelease(channel)
  if (!resolved) return sourceUrl
  return resolved.sourceUrl
}

async function createUpdateManagerForCheck(channel = readUpdateChannel()) {
  const sourceUrl = await resolveUpdateSourceUrl(channel)
  return { manager: createUpdateManager(sourceUrl, channel), sourceUrl }
}

function getPackagesDir(packageId = VELOPACK_PACKAGE_ID) {
  if (process.platform === 'win32') {
    return path.resolve(process.resourcesPath, '..', '..', 'packages')
  }

  if (process.platform === 'darwin') {
    return path.join(app.getPath('home'), 'Library', 'Caches', 'velopack', packageId, 'packages')
  }

  return path.join(app.getPath('home'), '.cache', 'velopack', packageId, 'packages')
}

function getPackagePath(asset?: VelopackAsset | null) {
  if (!asset?.FileName) return undefined
  return path.join(getPackagesDir(asset.PackageId), asset.FileName)
}

function getPackageTempPath(asset?: VelopackAsset | null) {
  const packagePath = getPackagePath(asset)
  return packagePath ? `${packagePath}.partial` : undefined
}

function createBaseState(
  status: AppUpdateState['status'],
  channel = readUpdateChannel(),
): AppUpdateState {
  return {
    status,
    currentVersion: app.getVersion(),
    channel,
    packageChannel: getVelopackChannel(channel),
    sourceUrl: getUpdateSourceUrl(),
    downloadDir: app.isPackaged ? getPackagesDir() : undefined,
  }
}

function setState(nextState: AppUpdateState) {
  updateState = nextState
  broadcastUpdateState()
}

function getUpdateStateFromAsset(
  status: AppUpdateState['status'],
  asset: VelopackAsset,
  channel = readUpdateChannel(),
): AppUpdateState {
  const version = asset.Version

  return {
    ...createBaseState(status, channel),
    version,
    packageName: asset.FileName,
    packageSha256: asset.SHA256,
    releaseNotes: asset.NotesMarkdown || undefined,
    ignored: getIgnoredVersion(channel) === version,
    lastCheckedAt: new Date().toISOString(),
    downloadDir: getPackagesDir(),
    downloadPath: getPackagePath(asset),
    downloadTempPath: getPackageTempPath(asset),
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

function normalizeVelopackAsset(value: Partial<VelopackAsset>): VelopackAsset | null {
  if (
    typeof value.PackageId !== 'string' ||
    typeof value.Version !== 'string' ||
    typeof value.Type !== 'string' ||
    typeof value.FileName !== 'string' ||
    typeof value.SHA1 !== 'string' ||
    typeof value.SHA256 !== 'string' ||
    typeof value.Size !== 'number'
  ) {
    return null
  }

  return {
    PackageId: value.PackageId,
    Version: value.Version,
    Type: value.Type,
    FileName: value.FileName,
    SHA1: value.SHA1,
    SHA256: value.SHA256,
    Size: value.Size,
    NotesMarkdown: value.NotesMarkdown ?? '',
    NotesHtml: value.NotesHtml ?? '',
  }
}

function parseVersion(value: string) {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/)
  if (!match) return undefined

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  }
}

function comparePrerelease(left: string[], right: string[]) {
  if (left.length === 0 && right.length === 0) return 0
  if (left.length === 0) return 1
  if (right.length === 0) return -1

  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index]
    const rightPart = right[index]
    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1

    const leftNumber = /^\d+$/.test(leftPart) ? Number(leftPart) : undefined
    const rightNumber = /^\d+$/.test(rightPart) ? Number(rightPart) : undefined

    if (leftNumber !== undefined && rightNumber !== undefined) {
      if (leftNumber !== rightNumber) return leftNumber - rightNumber
      continue
    }

    if (leftNumber !== undefined) return -1
    if (rightNumber !== undefined) return 1

    const compared = leftPart.localeCompare(rightPart)
    if (compared !== 0) return compared
  }

  return 0
}

function compareVersions(leftValue: string, rightValue: string) {
  const left = parseVersion(leftValue)
  const right = parseVersion(rightValue)
  if (!left || !right) return leftValue.localeCompare(rightValue)

  if (left.major !== right.major) return left.major - right.major
  if (left.minor !== right.minor) return left.minor - right.minor
  if (left.patch !== right.patch) return left.patch - right.patch

  return comparePrerelease(left.prerelease, right.prerelease)
}

async function fetchGitHubFeed(feedUrl: string) {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Bangumi-Electron-Updater',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub release feed request failed: ${response.status}`)
  }

  return (await response.json()) as GitHubAssetFeed
}

async function checkGitHubForUpdates(channel = readUpdateChannel()): Promise<ResolvedUpdateCheck> {
  const resolved = await resolveGitHubRelease(channel)
  if (!resolved) {
    return {
      updateInfo: null,
      unavailableReason: `当前通道暂无发布包。通道：${getVelopackChannel(channel)}`,
    }
  }

  const feed = await fetchGitHubFeed(resolved.feedUrl)
  const target = (feed.Assets ?? [])
    .map(normalizeVelopackAsset)
    .filter((asset): asset is VelopackAsset => asset !== null)
    .filter((asset) => asset.Type.toLowerCase() === 'full')
    .filter((asset) => compareVersions(asset.Version, app.getVersion()) > 0)
    .sort((left, right) => compareVersions(right.Version, left.Version))[0]

  if (!target) return { updateInfo: null, sourceUrl: resolved.sourceUrl }

  if (!resolved.release.assets.some((asset) => asset.name === target.FileName)) {
    throw new Error(`GitHub release is missing update package: ${target.FileName}`)
  }

  return {
    updateInfo: {
      TargetFullRelease: target,
      DeltasToTarget: [],
      IsDowngrade: false,
    },
    sourceUrl: resolved.sourceUrl,
  }
}

async function unlinkIfExists(filePath: string) {
  try {
    await unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

function isUpdatePackageFile(fileName: string) {
  return fileName.endsWith('.nupkg') || fileName.endsWith('.nupkg.partial')
}

function isCurrentVersionPackage(fileName: string) {
  return fileName.endsWith('.nupkg') && fileName.includes(`-${app.getVersion()}-`)
}

async function cleanupPackageFiles(keepFileName?: string) {
  const packagesDir = getPackagesDir()

  try {
    const files = await readdir(packagesDir)
    await Promise.all(
      files.map(async (fileName) => {
        if (!isUpdatePackageFile(fileName)) return
        if (fileName === keepFileName) return
        if (!keepFileName && isCurrentVersionPackage(fileName)) return
        await unlinkIfExists(path.join(packagesDir, fileName))
      }),
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

async function cleanupInstalledPackages() {
  await cleanupPackageFiles()
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
    void cleanupInstalledPackages().catch(() => undefined)
    setTimeout(() => {
      void checkForUpdates()
    }, STARTUP_CHECK_DELAY_MS)
  }
}

export async function checkForUpdates() {
  if (!app.isPackaged) return updateState

  const channel = readUpdateChannel()
  if (checkPromise && checkPromiseChannel === channel) {
    return checkPromise.then(() => updateState)
  }

  const runId = checkRunId + 1
  checkRunId = runId
  checkPromiseChannel = channel

  availableUpdateInfo = null
  availableUpdateSourceUrl = null
  downloadedUpdateSourceUrl = null
  downloadedUpdateAsset = null
  setState(createBaseState('checking', channel))

  checkPromise = (
    parseGitHubRepoUrl(getUpdateSourceUrl())
      ? checkGitHubForUpdates(channel)
      : createUpdateManagerForCheck(channel).then(({ manager, sourceUrl }) => {
          return manager.checkForUpdatesAsync().then((updateInfo) => ({ updateInfo, sourceUrl }))
        })
  )
    .then((result) => {
      if (runId !== checkRunId || readUpdateChannel() !== channel) return

      availableUpdateSourceUrl = result.sourceUrl ?? null

      const updateInfo = result.updateInfo
      if (!updateInfo) {
        if (result.unavailableReason) {
          setState({
            ...createBaseState('unavailable', channel),
            unavailableReason: result.unavailableReason,
            lastCheckedAt: new Date().toISOString(),
          })
          return
        }

        setState({
          ...createBaseState('idle', channel),
          lastCheckedAt: new Date().toISOString(),
        })
        return
      }

      availableUpdateInfo = updateInfo
      setState(getUpdateStateFromAsset('available', updateInfo.TargetFullRelease, channel))
    })
    .catch((error) => {
      if (runId !== checkRunId || readUpdateChannel() !== channel) return

      setState({
        ...createBaseState('error', channel),
        error: getErrorMessage(error),
      })
    })
    .finally(() => {
      if (runId !== checkRunId) return
      checkPromise = null
      checkPromiseChannel = null
    })

  await checkPromise
  return updateState
}

export async function downloadUpdate() {
  if (!app.isPackaged) return updateState
  if (updateState.status === 'downloaded') return updateState
  if (downloadPromise) return downloadPromise.then(() => updateState)

  const channel = readUpdateChannel()
  if (!availableUpdateInfo || updateState.channel !== channel) {
    await checkForUpdates()
  }

  if (!availableUpdateInfo || updateState.channel !== channel) return updateState

  const updateInfo = availableUpdateInfo

  setState({
    ...getUpdateStateFromAsset('downloading', updateInfo.TargetFullRelease, channel),
    percent: 0,
  })

  const sourceUrl = availableUpdateSourceUrl ?? (await resolveUpdateSourceUrl(channel))

  downloadPromise = createUpdateManager(sourceUrl, channel)
    .downloadUpdateAsync(updateInfo, (percent) => {
      setState({
        ...getUpdateStateFromAsset('downloading', updateInfo.TargetFullRelease, channel),
        percent,
      })
    })
    .then(() => {
      downloadedUpdateAsset = updateInfo.TargetFullRelease
      downloadedUpdateSourceUrl = sourceUrl
      setState(getUpdateStateFromAsset('downloaded', updateInfo.TargetFullRelease, channel))
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

export async function installUpdate() {
  if (!app.isPackaged || updateState.status !== 'downloaded') return updateState

  const updateToApply = downloadedUpdateAsset ?? createUpdateManager().getUpdatePendingRestart()
  if (!updateToApply) return updateState

  const channel = updateState.channel
  const sourceUrl =
    downloadedUpdateSourceUrl ?? availableUpdateSourceUrl ?? (await resolveUpdateSourceUrl(channel))

  setAppQuitting(true)
  createUpdateManager(sourceUrl, channel).waitExitThenApplyUpdate(updateToApply, false, true)
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

export async function clearUpdateDownloads() {
  if (!app.isPackaged) return updateState

  await cleanupPackageFiles()
  downloadedUpdateAsset = null
  downloadedUpdateSourceUrl = null

  if (availableUpdateInfo) {
    setState(getUpdateStateFromAsset('available', availableUpdateInfo.TargetFullRelease))
  } else {
    const status = updateState.status === 'unavailable' ? 'unavailable' : 'idle'
    setState({
      ...createBaseState(status),
      lastCheckedAt: updateState.lastCheckedAt,
      unavailableReason: updateState.unavailableReason,
    })
  }

  return updateState
}
