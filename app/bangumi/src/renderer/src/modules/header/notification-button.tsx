import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@renderer/components/ui/popover'
import { Button } from '@renderer/components/ui/button'
import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  useClearNotificationsMutation,
  useNotificationsQuery,
} from '@renderer/data/hooks/api/notification'
import { useSession } from '@renderer/data/hooks/session'
import { NotificationItem } from '@renderer/modules/header/notification-item'

export function NotificationButton() {
  const session = useSession()
  const notificationsQuery = useNotificationsQuery({ enabled: !!session })
  const clearMutation = useClearNotificationsMutation()

  if (!session) return null

  const unreadCount = notificationsQuery.data?.total ?? 0
  const notifications = notificationsQuery.data?.data ?? []
  const markRead = (notificationId: number) => {
    clearMutation.mutate({ notificationIds: [notificationId] })
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && notificationsQuery.isStale) void notificationsQuery.refetch()
      }}
    >
      <HeaderButton
        Button={
          <PopoverTrigger asChild>
            <Button
              aria-label={unreadCount > 0 ? `通知，${unreadCount} 条未读` : '通知'}
              className="no-drag-region text-muted-foreground relative size-8 cursor-auto p-1 text-[1.4rem]"
              variant="ghost"
            >
              <span className="i-mingcute-notification-line" />
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold tabular-nums">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        }
        Content={<p>通知</p>}
      />
      <PopoverContent align="end" className="no-drag-region w-96 p-0" sideOffset={8}>
        <PopoverHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <PopoverTitle>通知</PopoverTitle>
            {unreadCount > 0 && (
              <Button
                className="h-7 px-2 text-xs"
                disabled={clearMutation.isPending}
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => clearMutation.mutate({})}
              >
                全部已读
              </Button>
            )}
          </div>
          <PopoverDescription>
            {unreadCount > 0 ? `${unreadCount} 条未读` : '没有未读通知'}
          </PopoverDescription>
        </PopoverHeader>
        <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-1">
          {notificationsQuery.isPending ? (
            <NotificationSkeleton />
          ) : notificationsQuery.isError ? (
            <NotificationMessage>暂时无法读取通知。</NotificationMessage>
          ) : notifications.length === 0 ? (
            <NotificationMessage>暂无通知。</NotificationMessage>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                sessionUsername={session.username}
                onRead={markRead}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationMessage({ children }: { children: string }) {
  return <p className="text-muted-foreground px-4 py-10 text-center text-sm">{children}</p>
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2 p-2" aria-label="正在读取通知">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="flex gap-3 p-2" key={index}>
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
