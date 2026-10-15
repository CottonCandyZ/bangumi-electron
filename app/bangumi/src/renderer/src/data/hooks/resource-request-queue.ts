export type ResourceRequestPriority = 'foreground' | 'background'
type Request = {
  promise: Promise<unknown>
  controller: AbortController
  users: number
  priority: ResourceRequestPriority
  started: boolean
  fetch: (signal: AbortSignal) => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}

/** One request per lane; detail reads can proceed while a background batch is busy. */
export class ResourceRequestQueue {
  private pending = new Map<string, Request>()
  private waiting: Request[] = []
  private active = { foreground: false, background: false }

  async run<T>(
    key: string,
    signal: AbortSignal,
    fetch: (signal: AbortSignal) => Promise<T>,
    priority: ResourceRequestPriority = 'foreground',
  ): Promise<T> {
    signal.throwIfAborted()
    let entry = this.pending.get(key)
    if (!entry || entry.controller.signal.aborted) {
      const controller = new AbortController()
      let resolve!: Request['resolve']
      let reject!: Request['reject']
      const promise = new Promise<unknown>((done, fail) => {
        resolve = done
        reject = fail
      })
      entry = { promise, controller, users: 0, priority, started: false, fetch, resolve, reject }
      this.pending.set(key, entry)
      this.waiting.push(entry)
      const current = entry
      void promise
        .finally(() => {
          if (this.pending.get(key) === current) this.pending.delete(key)
        })
        .catch(() => {})
    } else if (priority === 'foreground' && !entry.started) {
      // A detail view reuses and promotes work that was queued by a batch.
      entry.priority = 'foreground'
    }
    const current = entry
    current.users++
    let released = false
    const release = () => {
      if (released) return
      released = true
      if (--current.users === 0) {
        current.controller.abort()
        if (!current.started) {
          this.waiting = this.waiting.filter((request) => request !== current)
          current.reject(current.controller.signal.reason)
        }
      }
    }
    signal.addEventListener('abort', release, { once: true })
    this.drain()
    try {
      const value = await current.promise
      signal.throwIfAborted()
      return value as T
    } finally {
      signal.removeEventListener('abort', release)
      release()
    }
  }

  private drain() {
    for (const priority of ['foreground', 'background'] as const) {
      if (this.active[priority]) continue
      const index = this.waiting.findIndex((request) => request.priority === priority)
      if (index < 0) continue
      const [request] = this.waiting.splice(index, 1)
      request.started = true
      this.active[priority] = true
      const finish = () => {
        this.active[priority] = false
        this.drain()
      }
      void Promise.resolve()
        .then(() => {
          request.controller.signal.throwIfAborted()
          return request.fetch(request.controller.signal)
        })
        .then(request.resolve, request.reject)
        .finally(finish)
    }
  }
}

export const resourceRequests = new ResourceRequestQueue()
