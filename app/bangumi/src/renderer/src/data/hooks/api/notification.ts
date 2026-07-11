import { clearNotifications, getNotifications } from '@renderer/data/fetch/api/notification'
import { useAuthQuery, useMutationMustAuth } from '@renderer/data/hooks/factory'
import type { NotificationPage } from '@renderer/data/types/notification'
import { useQueryClient } from '@tanstack/react-query'

const NOTIFICATION_QUERY_KEY: [string] = ['notifications']

export function useNotificationsQuery({ enabled }: { enabled: boolean }) {
  return useAuthQuery({
    queryFn: getNotifications,
    queryKey: NOTIFICATION_QUERY_KEY,
    queryProps: { limit: 20 },
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    staleTime: 30_000,
  })
}

export function useClearNotificationsMutation() {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: clearNotifications,
    mutationKey: ['clear-notifications'],
    onSuccess: (_, { notificationIds }) => {
      queryClient.setQueriesData<NotificationPage>({ queryKey: NOTIFICATION_QUERY_KEY }, (page) => {
        if (!page) return page
        if (!notificationIds) {
          return {
            data: page.data.map((notification) => ({ ...notification, unread: false })),
            total: 0,
          }
        }

        const idSet = new Set(notificationIds)
        const clearedCount = page.data.reduce(
          (count, notification) =>
            count + (notification.unread && idSet.has(notification.id) ? 1 : 0),
          0,
        )
        return {
          data: page.data.map((notification) =>
            idSet.has(notification.id) ? { ...notification, unread: false } : notification,
          ),
          total: Math.max(0, page.total - clearedCount),
        }
      })
    },
  })
}
