import { ViewTransitionImage } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import type { CommentBase } from '@renderer/data/types/comment'
import type { ReactNode } from 'react'
import { useLocation, useViewTransitionState } from 'react-router-dom'

export function CommentUserUsername({ username }: { username?: string }) {
  if (!username) return null

  return <span className="text-muted-foreground line-clamp-1 text-xs">@{username}</span>
}

export function CommentUserSignature({ sign }: { sign?: string }) {
  const normalizedSign = sign?.trim()
  if (!normalizedSign) return null

  return (
    <span className="text-muted-foreground min-w-0 text-xs font-normal break-words whitespace-normal">
      ({normalizedSign})
    </span>
  )
}

export function UserProfileLink({
  children,
  className,
  user,
  viewTransitionName,
}: {
  children: ReactNode
  className?: string
  user: NonNullable<CommentBase['user']>
  viewTransitionName?: string
}) {
  return (
    <MyLink
      className={className}
      state={viewTransitionName ? { viewTransitionName } : undefined}
      to={`/user/${encodeURIComponent(user.username)}`}
      viewTransition={!!viewTransitionName}
    >
      {children}
    </MyLink>
  )
}

export function CommentUserAvatarLink({
  className,
  imageClassName,
  transitionKey,
  user,
  viewTransition,
}: {
  className?: string
  imageClassName?: string
  transitionKey: string
  user: NonNullable<CommentBase['user']>
  viewTransition: boolean
}) {
  const { key } = useLocation()
  const to = `/user/${encodeURIComponent(user.username)}`
  const isTransitioning = useViewTransitionState(to)
  const viewTransitionName = `user-avatar-${user.id}-${transitionKey}-${key}`

  return (
    <UserProfileLink
      className={className}
      user={user}
      viewTransitionName={viewTransition ? viewTransitionName : undefined}
    >
      <ViewTransitionImage
        active={viewTransition && isTransitioning}
        cacheKey={`commentUserAvatar-${transitionKey}`}
        className={imageClassName}
        imageSrc={user.avatar.medium}
        viewTransitionName={viewTransitionName}
      />
    </UserProfileLink>
  )
}
