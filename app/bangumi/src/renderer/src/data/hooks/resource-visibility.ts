import { createStore, get, set } from 'idb-keyval'
import type { QueryKey } from '@tanstack/react-query'

type Visibility = { hidden: boolean; updatedAt: number }
const key = (query: QueryKey, user: string | null, id: number) =>
  `resource-visibility-${JSON.stringify([query, user, id])}`
let storage: ReturnType<typeof createStore> | undefined
let lastUpdate = 0
const memory = new Map<string, Visibility>()

function decode(value: unknown): Visibility | undefined {
  if (typeof value === 'boolean') return { hidden: value, updatedAt: 0 }
  if (
    value &&
    typeof value === 'object' &&
    'hidden' in value &&
    typeof value.hidden === 'boolean' &&
    'updatedAt' in value &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt)
  ) {
    return { hidden: value.hidden, updatedAt: value.updatedAt }
  }
  return undefined
}
function readMirror(key: string): Visibility | undefined {
  try {
    return decode(JSON.parse(localStorage.getItem(key) ?? 'null'))
  } catch {
    return undefined
  }
}
function remember(key: string, value: Visibility) {
  memory.set(key, value)
  lastUpdate = Math.max(lastUpdate, value.updatedAt)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The IndexedDB write and memory can still preserve this decision.
  }
}
export async function isResourceHidden(query: QueryKey, user: string | null, id: number) {
  const name = key(query, user, id)
  if (memory.has(name)) return memory.get(name)!.hidden
  try {
    storage ??= createStore('cache', 'query_persister')
    const persisted = decode(await get(name, storage))
    // A fetch may have updated visibility while this read was pending.
    if (memory.has(name)) return memory.get(name)!.hidden
    const mirror = readMirror(name)
    const latest =
      mirror && (!persisted || mirror.updatedAt >= persisted.updatedAt) ? mirror : persisted
    const value = latest ?? { hidden: false, updatedAt: 0 }
    remember(name, value)
    return value.hidden
  } catch {
    storage = undefined
    return memory.get(name)?.hidden ?? readMirror(name)?.hidden ?? true
  }
}
export async function setResourceHidden(
  query: QueryKey,
  user: string | null,
  id: number,
  hidden: boolean,
) {
  const name = key(query, user, id)
  const updatedAt = Math.max(Date.now(), lastUpdate + 1, (readMirror(name)?.updatedAt ?? 0) + 1)
  const value = { hidden, updatedAt }
  remember(name, value)
  try {
    storage ??= createStore('cache', 'query_persister')
    // Persist visible decisions too: absence cannot distinguish old data from a failed write.
    await set(name, value, storage)
  } catch {
    storage = undefined
    // The newer mirror wins over a stale IndexedDB decision after restart.
  }
}
