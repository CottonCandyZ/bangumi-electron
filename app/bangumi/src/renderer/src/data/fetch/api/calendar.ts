import { NEXT_CALENDAR, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { Calendar } from '@renderer/data/types/calendar'

export async function getCalendar() {
  return nextFetchWithOptionalAuth<Calendar>(NEXT_CALENDAR.ROOT)
}
