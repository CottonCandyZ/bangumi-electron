import { nextFetch, NEXT_COLLECTIONS } from '@renderer/data/fetch/config'
import type { P1CollectionPage } from '@renderer/data/types/collection'

export async function getSubject({ limit, offset }: { limit: number; offset: number }) {
  const info = await nextFetch<P1CollectionPage<'subject'>>(NEXT_COLLECTIONS.SUBJECTS, {
    query: {
      limit,
      offset,
    },
  })
  return info
}
