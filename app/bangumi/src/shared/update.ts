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
  version?: string
  releaseName?: string | null
  releaseDate?: string
  percent?: number
  error?: string
  ignored?: boolean
  lastCheckedAt?: string
}
