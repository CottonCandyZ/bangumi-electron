import type { UserTimelineSlimUser } from '@renderer/data/types/user'

export type Notification = {
  id: number
  type: number
  sender: UserTimelineSlimUser
  title: string
  mainID: number
  relatedID: number
  createdAt: number
  unread: boolean
}

export type NotificationPage = {
  data: Notification[]
  /** 未读通知总数，不是当前页长度。 */
  total: number
}
