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
  check = () => {},
}: {
  ids: number[]
  data: Map<number, T>
  fetch: (id: number) => Promise<T>
  save: (items: T[]) => Promise<void>
  remove?: (ids: number[]) => Promise<void>
  evict?: (id: number) => void | Promise<void>
  publish: (item: T) => void
  check?: () => void
}) {
  const fresh: T[] = []
  const missing: number[] = []
  let failure: unknown
  for (const id of ids) {
    check()
    try {
      fresh.push(await fetch(id))
    } catch (error) {
      check()
      if (isNotFoundError(error)) missing.push(id)
      else failure ??= error
    }
  }
  check()
  if (fresh.length) await save(fresh)
  check()
  if (missing.length) await remove?.(missing)
  for (const id of missing) {
    check()
    data.delete(id)
    await evict?.(id)
  }
  for (const item of fresh) {
    check()
    data.set(item.id, item)
    publish(item)
  }
  if (failure && data.size === 0) throw failure
}
