import { NEXT_TIMELINE, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { TimelineMode } from '@renderer/data/types/timeline'
import type { UserTimelineItem } from '@renderer/data/types/user'

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
