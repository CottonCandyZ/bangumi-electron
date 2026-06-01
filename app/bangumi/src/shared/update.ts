import type { AppUpdateChannel } from '@shared/config'

export type AppUpdateStatus =
  | 'unsupported'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type AppUpdateState = {
  status: AppUpdateStatus
  currentVersion: string
  channel: AppUpdateChannel
  packageChannel: string
  sourceUrl?: string
  downloadDir?: string
  downloadPath?: string
  downloadTempPath?: string
  version?: string
  packageName?: string
  packageSha256?: string
  releaseNotes?: string
  releaseName?: string | null
  releaseDate?: string
  percent?: number
  error?: string
  ignored?: boolean
  lastCheckedAt?: string
}

export type AppBuildInfo = {
  version: string
  buildTime: string
  hash: string
}
