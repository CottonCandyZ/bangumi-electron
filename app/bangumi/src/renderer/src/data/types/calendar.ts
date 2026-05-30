import type { UserTimelineSlimSubject } from './user'

export type CalendarItem = {
  subject: UserTimelineSlimSubject
  watchers: number
}

export type Calendar = Record<string, CalendarItem[]>
