import { HOST } from '@renderer/data/fetch/config'
import type { Notification } from '@renderer/data/types/notification'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { cn } from '@renderer/lib/utils'
import { useNavigate } from 'react-router-dom'

const GROUP_TOPIC_TYPES = new Set([1, 2, 23])
const SUBJECT_TOPIC_TYPES = new Set([3, 4, 24])
const CHARACTER_TYPES = new Set([5, 6, 25])
const BLOG_TYPES = new Set([7, 8, 29])
const EPISODE_TYPES = new Set([9, 10, 30])
const INDEX_TYPES = new Set([11, 12, 27])
const PERSON_TYPES = new Set([13, 26])
const FRIEND_TYPES = new Set([14, 15])
const TIMELINE_TYPES = new Set([22, 28])

function getNotificationAction(type: number) {
  if (type === 14) return '请求与你成为好友'
  if (type === 15) return '通过了你的好友请求'
  if (type >= 23 && type <= 34) return '在相关内容中提到了你'
  if (type >= 35 && type <= 46) return '更新了你参与的 Wiki 修订'
  if (type >= 47 && type <= 50) return '回复了你参与的 Wiki 修订'
  if (type === 22) return '回复了你的时间线状态'
  if (type % 2 === 0) return '在相关讨论中回复了你'
  return '在你参与的内容中发表了新回复'
}

function getInternalRoute(notification: Notification) {
  if (GROUP_TOPIC_TYPES.has(notification.type)) return `/group/topic/${notification.mainID}`
  if (SUBJECT_TOPIC_TYPES.has(notification.type)) return `/subject/topic/${notification.mainID}`
  if (CHARACTER_TYPES.has(notification.type)) return `/character/${notification.mainID}`
  if (EPISODE_TYPES.has(notification.type)) return `/episode/${notification.mainID}`
  if (INDEX_TYPES.has(notification.type)) return `/index/${notification.mainID}`
  if (PERSON_TYPES.has(notification.type)) return `/person/${notification.mainID}`
  if (FRIEND_TYPES.has(notification.type)) return `/user/${notification.sender.username}`
  return undefined
}

function getExternalHref(notification: Notification, sessionUsername: string) {
  if (BLOG_TYPES.has(notification.type)) return `${HOST}/blog/${notification.mainID}`
  if (TIMELINE_TYPES.has(notification.type)) {
    return `${HOST}/user/${sessionUsername}/timeline/status/${notification.mainID}`
  }
  return undefined
}

export function NotificationItem({
  notification,
  onRead,
  sessionUsername,
}: {
  notification: Notification
  onRead: (notificationId: number) => void
  sessionUsername: string
}) {
  const navigate = useNavigate()
  const internalRoute = getInternalRoute(notification)
  const externalHref = getExternalHref(notification, sessionUsername)
  const senderName = notification.sender.nickname || notification.sender.username
  const content = (
    <>
      <img
        alt=""
        className="bg-muted size-9 shrink-0 rounded-full object-cover"
        loading="lazy"
        src={notification.sender.avatar.small}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-5">
          <span className="font-medium">{senderName}</span>{' '}
          {getNotificationAction(notification.type)}
        </span>
        {notification.title && (
          <span className="text-muted-foreground block truncate text-xs">{notification.title}</span>
        )}
        <time className="text-muted-foreground block text-xs">
          {formatRecentUnixTime(notification.createdAt)}
        </time>
      </span>
      {notification.unread && (
        <span className="bg-primary mt-2 size-2 shrink-0 rounded-full" aria-label="未读" />
      )}
    </>
  )
  const className = cn(
    'hover:bg-muted/70 flex w-full gap-3 rounded-md px-3 py-2 text-left transition-colors',
    notification.unread && 'bg-muted/35',
  )
  const markRead = () => {
    if (notification.unread) onRead(notification.id)
  }

  if (internalRoute) {
    return (
      <button
        className={className}
        type="button"
        onClick={() => {
          markRead()
          navigate(internalRoute)
        }}
      >
        {content}
      </button>
    )
  }

  if (externalHref) {
    return (
      <a
        className={className}
        href={externalHref}
        target="_blank"
        rel="noreferrer"
        onClick={markRead}
      >
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}
