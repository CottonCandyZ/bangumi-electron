import { AsyncStorage, PersistedQuery } from '@tanstack/react-query-persist-client'
import { get, set, del, type UseStore } from 'idb-keyval'

/**
 * Creates an Indexed DB persister
 * @see https://github.com/TanStack/query/discussions/6213#discussioncomment-7715299
 */

export function newIdbStorage(idbStore: UseStore): AsyncStorage<PersistedQuery> {
  return {
    getItem: async (key) => await get(key, idbStore),
    setItem: async (key, value) => await set(key, value, idbStore),
    removeItem: async (key) => await del(key, idbStore),
  }
}
