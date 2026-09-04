import { FetchError } from 'ofetch'

export class OfflineResourceError extends Error {
  constructor() {
    super('这部分内容尚未缓存，请联网后重试')
    this.name = 'OfflineResourceError'
  }
}

export function isNetworkUnavailableError(error: unknown) {
  if (error instanceof OfflineResourceError) return true
  if (error instanceof FetchError) return !error.response && !error.statusCode
  return (
    error instanceof TypeError &&
    /failed to fetch|fetch failed|networkerror|load failed/i.test(error.message)
  )
}

export function isNotFoundError(error: unknown) {
  return error instanceof FetchError && error.statusCode === 404
}
