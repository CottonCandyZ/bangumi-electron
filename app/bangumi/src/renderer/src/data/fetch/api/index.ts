import { NEXT_INDEXES, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { Index, IndexRelated } from '@renderer/data/types/index'
import type { Comment } from '@renderer/data/types/comment'
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

export type IndexWriteInput = { title: string; desc: string; private?: boolean }

export function createIndex(input: IndexWriteInput) {
  return nextFetchWithOptionalAuth<{ id: number }>(NEXT_INDEXES.ROOT, {
    method: 'POST',
    body: input,
  })
}

export function updateIndex({ indexId, ...input }: IndexWriteInput & { indexId: number }) {
  return nextFetchWithOptionalAuth<Record<string, never>>(NEXT_INDEXES.BY_ID(indexId), {
    method: 'PATCH',
    body: input,
  })
}

export function deleteIndex({ indexId }: { indexId: number }) {
  return nextFetchWithOptionalAuth<Record<string, never>>(NEXT_INDEXES.BY_ID(indexId), {
    method: 'DELETE',
  })
}

export function getIndexComments({ indexId }: { indexId: number }) {
  return nextFetchWithOptionalAuth<Comment[]>(NEXT_INDEXES.COMMENTS_BY_ID(indexId))
}

export type CreateIndexRelatedInput = {
  indexId: number
  cat: number
  sid: number
  order?: number
  comment?: string
  award?: string
}

export function createIndexRelated({ indexId, ...input }: CreateIndexRelatedInput) {
  return nextFetchWithOptionalAuth<Record<string, never>>(NEXT_INDEXES.RELATED_BY_ID(indexId), {
    method: 'PUT',
    body: input,
  })
}

export function updateIndexRelated({
  comment,
  indexId,
  order,
  relatedId,
}: {
  comment: string
  indexId: number
  order: number
  relatedId: number
}) {
  return nextFetchWithOptionalAuth<Record<string, never>>(
    NEXT_INDEXES.RELATED_ITEM_BY_ID(indexId, relatedId),
    { method: 'PATCH', body: { comment, order } },
  )
}

export function deleteIndexRelated({ indexId, relatedId }: { indexId: number; relatedId: number }) {
  return nextFetchWithOptionalAuth<Record<string, never>>(
    NEXT_INDEXES.RELATED_ITEM_BY_ID(indexId, relatedId),
    { method: 'DELETE' },
  )
}
