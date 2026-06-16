import { NEXT_INDEXES, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { Index, IndexRelated } from '@renderer/data/types/index'
import type { P1Page } from '@renderer/data/types/subject'
import { FetchParamError } from '@renderer/lib/utils/error'

export async function getIndexById({ indexId }: { indexId: number | undefined }) {
  if (!indexId) throw new FetchParamError('未获得目录 id')

  return nextFetchWithOptionalAuth<Index>(NEXT_INDEXES.BY_ID(indexId))
}

export async function getIndexRelated({
  cat,
  indexId,
  limit,
  offset,
  type,
}: {
  cat?: number
  indexId: number | undefined
  limit?: number
  offset: number
  type?: number
}) {
  if (!indexId) throw new FetchParamError('未获得目录 id')

  return nextFetchWithOptionalAuth<P1Page<IndexRelated>>(NEXT_INDEXES.RELATED_BY_ID(indexId), {
    query: {
      cat,
      limit,
      offset,
      type,
    },
  })
}
