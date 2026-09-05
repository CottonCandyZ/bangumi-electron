/** One public-resource request at a time, shared by overlapping single and batch reads. */
export class ResourceRequestQueue {
  private tail: Promise<unknown> = Promise.resolve()
  private pending = new Map<
    string,
    { promise: Promise<unknown>; controller: AbortController; users: number }
  >()

  async run<T>(
    key: string,
    signal: AbortSignal,
    fetch: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    signal.throwIfAborted()
    let entry = this.pending.get(key)
    if (!entry || entry.controller.signal.aborted) {
      const controller = new AbortController()
      const promise = this.tail
        .catch(() => {})
        .then(() => {
          controller.signal.throwIfAborted()
          return fetch(controller.signal)
        })
      entry = { promise, controller, users: 0 }
      this.pending.set(key, entry)
      this.tail = promise.catch(() => {})
      const current = entry
      void promise
        .finally(() => {
          if (this.pending.get(key) === current) this.pending.delete(key)
        })
        .catch(() => {})
    }
    const current = entry
    current.users++
    let released = false
    const release = () => {
      if (released) return
      released = true
      if (--current.users === 0) current.controller.abort()
    }
    signal.addEventListener('abort', release, { once: true })
    try {
      const value = await current.promise
      signal.throwIfAborted()
      return value as T
    } finally {
      signal.removeEventListener('abort', release)
      release()
    }
  }
}

export const resourceRequests = new ResourceRequestQueue()
