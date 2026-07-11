import { NEXT_TIMELINE, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { TimelineMode } from '@renderer/data/types/timeline'
import type { UserTimelineItem } from '@renderer/data/types/user'
import type { Comment } from '@renderer/data/types/comment'

export type CreateTimelineInput = {
  content: string
  turnstileToken: string
}

export async function getTimeline({
  limit,
  mode,
  until,
}: {
  limit?: number
  mode?: TimelineMode
  until?: number
}) {
  return nextFetchWithOptionalAuth<UserTimelineItem[]>(NEXT_TIMELINE.ROOT({ mode, limit, until }))
}

export async function createTimeline(input: CreateTimelineInput) {
  return nextFetchWithOptionalAuth<{ id: number }>(NEXT_TIMELINE.ROOT({}), {
    method: 'POST',
    body: input,
  })
}

export async function deleteTimeline({ timelineId }: { timelineId: number }) {
  return nextFetchWithOptionalAuth<Record<string, never>>(NEXT_TIMELINE.BY_ID(timelineId), {
    method: 'DELETE',
  })
}

export async function getTimelineReplies({ timelineId }: { timelineId: number }) {
  return nextFetchWithOptionalAuth<Comment[]>(NEXT_TIMELINE.REPLIES_BY_ID(timelineId))
}
