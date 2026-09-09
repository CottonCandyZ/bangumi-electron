import type { AppUpdateChannel } from '@shared/config'

export type AppUpdateStatus =
  | 'unsupported'
  | 'idle'
  | 'unavailable'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type AppUpdateActivity = {
  phase: 'prepare' | 'delta' | 'full' | 'verify' | 'reconstruct'
  fileName?: string
  filePath?: string
  bytes: number
  totalBytes: number
  index?: number | null
  count: number
  fallback: boolean
}

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
  fullPackageSize?: number
  deltaPackageSize?: number
  releaseNotes?: string
  releaseName?: string | null
  releaseDate?: string
  percent?: number
  activity?: AppUpdateActivity
  error?: string
  unavailableReason?: string
  ignored?: boolean
  lastCheckedAt?: string
}

export type AppBuildInfo = {
  version: string
  buildTime: string
  hash: string
}
