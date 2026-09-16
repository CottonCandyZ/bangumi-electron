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
