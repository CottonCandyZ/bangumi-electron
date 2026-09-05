import { existsSync } from 'node:fs'
import { readdir, unlink } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { BrowserWindow, app } from 'electron'
import { getRendererHandlers } from '@egoist/tipc/main'
import type { RendererHandlers } from '@main/tipc/renderer-handlers'
import { JSONStore } from '@main/lib/store'
import { setAppQuitting } from '@main/app-flags'
import type { AppUpdateChannel, AppConfig } from '@shared/config'
import { normalizeAppConfig } from '@shared/config'
import type { AppBuildInfo, AppUpdateState } from '@shared/update'
import { getUpdatePackageSizes } from '@shared/update-size'
import { UpdateManager, type UpdateInfo, type VelopackAsset } from 'velopack'

declare const __APP_BUILD_HASH__: string
declare const __APP_BUILD_TIME__: string
declare const __APP_UPDATE_SOURCE_URL__: string

const APP_CONFIG_STORE_KEY = 'appConfig'
const IGNORED_UPDATE_KEY = 'ignoredUpdate'
const STARTUP_CHECK_DELAY_MS = 3000
const DEFAULT_UPDATE_SOURCE_URL = __APP_UPDATE_SOURCE_URL__
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

type ResolvedUpdateCheck = {
  updateInfo: UpdateInfo | null
  sourceUrl?: string
  unavailableReason?: string
}

type VelopackBridgeEvent =
  | { event: 'progress'; percent: number }
  | { event: 'result'; update?: UpdateInfo | null }

type VelopackLocatorConfig = {
  RootAppDir: string
  UpdateExePath: string
  PackagesDir: string
  ManifestPath: string
  CurrentBinaryDir: string
  IsPortable: boolean
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

async function resolveUpdateSourceUrl() {
  return getUpdateSourceUrl()
}

async function createUpdateManagerForCheck(channel = readUpdateChannel()) {
  const sourceUrl = await resolveUpdateSourceUrl()
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

function getVelopackLocatorConfig(): VelopackLocatorConfig {
  const currentBinaryDir = path.dirname(app.getPath('exe'))

  if (process.platform === 'win32') {
    const rootAppDir = path.resolve(currentBinaryDir, '..')
    return {
      RootAppDir: rootAppDir,
      UpdateExePath: path.join(rootAppDir, 'Update.exe'),
      PackagesDir: getPackagesDir(),
      ManifestPath: path.join(currentBinaryDir, 'sq.version'),
      CurrentBinaryDir: currentBinaryDir,
      IsPortable: existsSync(path.join(rootAppDir, '.portable')),
    }
  }

  if (process.platform === 'darwin') {
    // TODO(release): Verify these locator paths with an installed and a portable package on both
    // Intel and Apple Silicon macOS before enabling delta updates for the macOS release channel.
    return {
      RootAppDir: path.resolve(currentBinaryDir, '..', '..'),
      UpdateExePath: path.join(currentBinaryDir, 'UpdateMac'),
      PackagesDir: getPackagesDir(),
      ManifestPath: path.join(currentBinaryDir, 'sq.version'),
      CurrentBinaryDir: currentBinaryDir,
      IsPortable: true,
    }
  }

  // TODO(release): Build and test the bridge on each supported Linux packaging target. The current
  // electron-builder AppImage/deb/snap flow has not yet been migrated to a Velopack Linux package,
  // so its actual APPIMAGE, UpdateNix and sq.version layout must be verified before updates ship.
  return {
    RootAppDir: process.env.APPIMAGE || app.getPath('exe'),
    UpdateExePath: path.join(currentBinaryDir, 'UpdateNix'),
    PackagesDir: getPackagesDir(),
    ManifestPath: path.join(currentBinaryDir, 'sq.version'),
    CurrentBinaryDir: currentBinaryDir,
    IsPortable: true,
  }
}

function getVelopackBridgePath() {
  const executable =
    process.platform === 'win32' ? 'bangumi-velopack-bridge.exe' : 'bangumi-velopack-bridge'
  return path.join(process.resourcesPath, 'velopack-bridge', executable)
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
    ...getUpdatePackageSizes(
      asset,
      availableUpdateInfo?.TargetFullRelease.Version === asset.Version
        ? availableUpdateInfo
        : undefined,
    ),
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

function runVelopackBridge(
  command: 'check' | 'download',
  channel: AppUpdateChannel,
  update?: UpdateInfo,
  onProgress?: (percent: number) => void,
) {
  return new Promise<UpdateInfo | null>((resolve, reject) => {
    const child = spawn(getVelopackBridgePath(), [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let stdoutBuffer = ''
    let stderr = ''
    let result: UpdateInfo | null = null

    const consumeLine = (line: string) => {
      if (!line.trim()) return
      const event = JSON.parse(line) as VelopackBridgeEvent
      if (event.event === 'progress') onProgress?.(event.percent)
      if (event.event === 'result') result = event.update ?? null
    }

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdoutBuffer += chunk
      const lines = stdoutBuffer.split(/\r?\n/)
      stdoutBuffer = lines.pop() ?? ''
      try {
        lines.forEach(consumeLine)
      } catch (error) {
        child.kill()
        reject(error)
      }
    })

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.once('error', reject)
    child.once('close', (code) => {
      try {
        consumeLine(stdoutBuffer)
      } catch (error) {
        reject(error)
        return
      }

      if (code !== 0) {
        reject(new Error(stderr.trim() || `Velopack bridge exited with code ${code}`))
        return
      }
      resolve(result)
    })

    child.stdin.end(
      JSON.stringify({
        command,
        sourceUrl: getUpdateSourceUrl(),
        prerelease: channel === 'beta',
        options: {
          ExplicitChannel: getVelopackChannel(channel),
          AllowVersionDowngrade: false,
          MaximumDeltasBeforeFallback: 10,
        },
        locator: getVelopackLocatorConfig(),
        update,
      }),
    )
  })
}

async function checkGitHubForUpdates(channel = readUpdateChannel()): Promise<ResolvedUpdateCheck> {
  // The Rust bridge exposes GithubSource's prerelease flag that the Node SDK currently hides.
  // The returned UpdateInfo retains BaseRelease and DeltasToTarget, unlike the previous manual
  // GitHub feed parser which deliberately produced a full-package-only update plan.
  return {
    updateInfo: await runVelopackBridge('check', channel),
    sourceUrl: getUpdateSourceUrl(),
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

  const sourceUrl = availableUpdateSourceUrl ?? (await resolveUpdateSourceUrl())
  const progress = (percent: number) => {
    setState({
      ...getUpdateStateFromAsset('downloading', updateInfo.TargetFullRelease, channel),
      percent,
    })
  }

  downloadPromise = (
    parseGitHubRepoUrl(sourceUrl)
      ? runVelopackBridge('download', channel, updateInfo, progress).then(() => undefined)
      : createUpdateManager(sourceUrl, channel).downloadUpdateAsync(updateInfo, progress)
  )
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
    downloadedUpdateSourceUrl ?? availableUpdateSourceUrl ?? (await resolveUpdateSourceUrl())

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
