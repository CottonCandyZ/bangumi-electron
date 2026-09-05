import { isNotFoundError } from '../../lib/utils/network'

/** Retain cached values on transport failure; only a confirmed 404 hides an item. */
export async function refreshResourceBatch<T extends { id: number }>({
  ids,
  data,
  fetch,
  save,
  remove,
  evict,
  publish,
}: {
  ids: number[]
  data: Map<number, T>
  fetch: (id: number) => Promise<T>
  save: (items: T[]) => Promise<void>
  remove?: (ids: number[]) => Promise<void>
  evict?: (id: number) => void | Promise<void>
  publish: (item: T) => void
}) {
  const fresh: T[] = []
  const missing: number[] = []
  let failure: unknown
  for (const id of ids) {
    try {
      fresh.push(await fetch(id))
    } catch (error) {
      if (isNotFoundError(error)) missing.push(id)
      else failure ??= error
    }
  }
  if (fresh.length) await save(fresh)
  if (missing.length) await remove?.(missing)
  for (const id of missing) {
    data.delete(id)
    await evict?.(id)
  }
  for (const item of fresh) {
    data.set(item.id, item)
    publish(item)
  }
  if (failure && data.size === 0) throw failure
}
