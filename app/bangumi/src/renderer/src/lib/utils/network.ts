import { FetchError } from 'ofetch'

export class OfflineResourceError extends Error {
  constructor() {
    super('这部分内容尚未缓存，请联网后重试')
    this.name = 'OfflineResourceError'
  }
}

/** Cancellation can cross fetch and Electron IPC boundaries before reaching Query. */
export function isRequestCancelledError(error: unknown) {
  const seen = new Set<unknown>()
  let current = error
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const failure = current as { name?: unknown; message?: unknown; cause?: unknown }
    if (failure.name === 'AbortError') return true
    if (
      typeof failure.message === 'string' &&
      /\bAbortError:\s|(?:^|:\s)(?:signal is aborted without reason|this operation was aborted|the operation was aborted|the user aborted a request)\.?$/i.test(
        failure.message,
      )
    )
      return true
    current = failure.cause
  }
  return false
}

export function isNetworkUnavailableError(error: unknown) {
  if (error instanceof OfflineResourceError) return true
  if (error instanceof FetchError) return !error.response && !error.statusCode
  if (
    error instanceof Error &&
    /暂时无法连接 Bangumi|暂时无法读取 Bangumi 响应/.test(error.message)
  )
    return true
  return (
    error instanceof TypeError &&
    /failed to fetch|fetch failed|networkerror|load failed/i.test(error.message)
  )
}

export function isNotFoundError(error: unknown) {
  return (
    error instanceof ResourceNotFoundError ||
    (error instanceof FetchError && error.statusCode === 404)
  )
}

export class ResourceNotFoundError extends Error {
  constructor() {
    super('此条目不存在或暂时无法访问')
    this.name = 'ResourceNotFoundError'
  }
}

export class CollectionPendingError extends Error {
  constructor() {
    super('收藏状态正在同步')
    this.name = 'CollectionPendingError'
  }
}
