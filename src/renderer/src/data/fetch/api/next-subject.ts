import { nextFetch, NEXT_COLLECTIONS } from '@renderer/data/fetch/config'
import { Subject } from '@renderer/data/types/subject'

export async function getSubject({ limit, offset }: { limit: number; offset: number }) {
  const info = await nextFetch<Subject>(NEXT_COLLECTIONS.LIST(limit, offset))
  return info
}
