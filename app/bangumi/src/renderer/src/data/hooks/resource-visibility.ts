import { createStore, get, set, del } from 'idb-keyval'
import type { QueryKey } from '@tanstack/react-query'

const key = (query: QueryKey, user: string | null, id: number) =>
  `resource-visibility-${JSON.stringify([query, user, id])}`
const storage = () => createStore('cache', 'query_persister')

export async function isResourceHidden(query: QueryKey, user: string | null, id: number) {
  return (await get(key(query, user, id), storage())) === true
}
export async function setResourceHidden(
  query: QueryKey,
  user: string | null,
  id: number,
  hidden: boolean,
) {
  if (hidden) await set(key(query, user, id), true, storage())
  else await del(key(query, user, id), storage())
}
