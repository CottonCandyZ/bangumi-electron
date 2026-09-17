type RpcError = { message: string; name: string; kind?: string }
type Message =
  | { rpc: 'request'; id: number; method: string; args: unknown[] }
  | { rpc: 'result'; id: number; value?: unknown; error?: RpcError }
type Port = {
  postMessage(message: unknown): void
  on(event: 'message', callback: (message: Message) => void): unknown
}
type Args<T> = T extends (...args: infer A) => unknown ? A : never
type Result<T> = T extends (...args: never[]) => infer R ? Awaited<R> : never

/** Bidirectional RPC: SQLite stays in the worker; Electron's authenticated transport stays in main. */
export class CollectionRpc<Remote> {
  private nextId = 0
  private failure?: Error
  private pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >()

  constructor(
    private port: Port,
    handlers: object,
  ) {
    port.on('message', async (message) => {
      if (message.rpc === 'result') {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error)
          pending.reject(Object.assign(new Error(message.error.message), message.error))
        else pending.resolve(message.value)
      } else if (message.rpc === 'request') {
        try {
          if (!Object.hasOwn(handlers, message.method))
            throw new Error('Unknown collection operation')
          const handler = handlers[message.method as keyof typeof handlers] as (
            ...args: unknown[]
          ) => unknown
          const value = await handler(...message.args)
          port.postMessage({ rpc: 'result', id: message.id, value })
        } catch (error) {
          const failure = error as Error & { kind?: string }
          port.postMessage({
            rpc: 'result',
            id: message.id,
            error: {
              message: failure.message ?? String(error),
              name: failure.name ?? 'Error',
              kind: failure.kind,
            },
          })
        }
      }
    })
  }

  call<K extends keyof Remote & string>(
    method: K,
    ...args: Args<Remote[K]>
  ): Promise<Result<Remote[K]>> {
    if (this.failure) return Promise.reject(this.failure)
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
      try {
        this.port.postMessage({ rpc: 'request', id, method, args })
      } catch (error) {
        this.pending.delete(id)
        reject(error)
      }
    })
  }

  fail(error: Error) {
    this.failure = error
    for (const pending of this.pending.values()) pending.reject(error)
    this.pending.clear()
  }
}
