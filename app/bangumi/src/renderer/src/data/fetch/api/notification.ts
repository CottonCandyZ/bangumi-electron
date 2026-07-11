import { NEXT_NOTIFY, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type { NotificationPage } from '@renderer/data/types/notification'

export function getNotifications({ limit = 20 }: { limit?: number }) {
  return nextFetchWithOptionalAuth<NotificationPage>(NEXT_NOTIFY.LIST, {
    query: { limit },
  })
}

export function clearNotifications({ notificationIds }: { notificationIds?: number[] }) {
  return nextFetchWithOptionalAuth<Record<string, never>>(NEXT_NOTIFY.CLEAR, {
    method: 'POST',
    body: notificationIds ? { id: notificationIds } : {},
  })
}
