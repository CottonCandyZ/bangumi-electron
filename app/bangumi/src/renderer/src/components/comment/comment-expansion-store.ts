/** Owned by a mounted comment list, never persisted across pages. */
export function createCommentExpansionStore() {
  const values = new Map<string, { revision: string; expanded: boolean }>()
  const listeners = new Set<() => void>()
  return {
    get(key: string, revision: string) {
      const value = values.get(key)
      return value?.revision === revision && value.expanded
    },
    set(key: string, revision: string, expanded: boolean) {
      values.set(key, { revision, expanded })
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
