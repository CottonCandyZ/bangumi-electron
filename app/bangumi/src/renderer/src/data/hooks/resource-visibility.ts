import { createStore, get, set, del } from 'idb-keyval'
import type { QueryKey } from '@tanstack/react-query'

const key = (query: QueryKey, user: string | null, id: number) =>
  `resource-visibility-${JSON.stringify([query, user, id])}`
let storage: ReturnType<typeof createStore> | undefined
const memory = new Map<string, boolean>()

function remember(key: string, hidden: boolean) {
  memory.set(key, hidden)
  try {
    localStorage.setItem(key, JSON.stringify(hidden))
  } catch {
    // Memory still protects this session if persistent storage is unavailable.
  }
}
function readMirror(key: string): boolean | undefined {
  try {
    const value = localStorage.getItem(key)
    if (value === 'true' || value === 'false') return value === 'true'
  } catch {
    // Unknown visibility is not permission to show cached content.
  }
  return undefined
}
export async function isResourceHidden(query: QueryKey, user: string | null, id: number) {
  const name = key(query, user, id)
  // A failed 404 write must take precedence over older persistent metadata.
  if (memory.has(name)) return memory.get(name)!
  try {
    storage ??= createStore('cache', 'query_persister')
    const hidden = (await get(name, storage)) === true || readMirror(name) === true
    remember(name, hidden)
    return hidden
  } catch {
    storage = undefined
    return readMirror(name) ?? true
  }
}
export async function setResourceHidden(
  query: QueryKey,
  user: string | null,
  id: number,
  hidden: boolean,
) {
  const name = key(query, user, id)
  remember(name, hidden)
  try {
    storage ??= createStore('cache', 'query_persister')
    if (hidden) await set(name, true, storage)
    else await del(name, storage)
  } catch {
    storage = undefined
    // The mirror and memory remain authoritative until the next successful fetch.
  }
}
