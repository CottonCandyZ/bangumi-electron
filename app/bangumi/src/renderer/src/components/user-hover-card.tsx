import { Image } from '@renderer/components/image/image'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import {
  useAddBlockMutation,
  useAddFriendMutation,
  useBlocklistQuery,
  useFriendlistQuery,
  useRemoveBlockMutation,
  useRemoveFriendMutation,
} from '@renderer/data/hooks/api/relationship'
import { useUserProfileQuery } from '@renderer/data/hooks/api/user'
import { useSession } from '@renderer/data/hooks/session'
import type { CommentUser } from '@renderer/data/types/comment'
import type { UserProfile } from '@renderer/data/types/user'
import { cn } from '@renderer/lib/utils'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { formatRecentUnixTime } from '@renderer/lib/utils/date'
import { Ban, Loader2, UserMinus, UserPlus } from 'lucide-react'
import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate, type LinkProps } from 'react-router-dom'
import { toast } from 'sonner'

type HoverUser = Pick<CommentUser, 'avatar' | 'id' | 'joinedAt' | 'nickname' | 'sign' | 'username'>

type UserHoverCardLinkProps = Omit<LinkProps, 'to'> & {
  children: ReactNode
  user: HoverUser
  to?: string
}

export function UserHoverCardLink({
  children,
  className,
  to,
  user,
  ...linkProps
}: UserHoverCardLinkProps) {
  return (
    <HoverCard closeDelay={120} openDelay={250}>
      <HoverCardTrigger asChild>
        <Link
          className={className}
          draggable={false}
          to={to ?? `/user/${encodeURIComponent(user.username)}`}
          {...linkProps}
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 p-0" sideOffset={8}>
        <UserHoverCardContent fallback={user} />
      </HoverCardContent>
    </HoverCard>
  )
}

function UserHoverCardContent({ fallback }: { fallback: HoverUser }) {
  const navigate = useNavigate()
  const session = useSession()
  const profileQuery = useUserProfileQuery({ username: fallback.username, enabled: true })
  const profile = profileQuery.data
  const user = toHoverUser(profile, fallback)
  const canManageRelationship = !!session && session.username !== user.username
  const friendlistQuery = useFriendlistQuery({ enabled: canManageRelationship })
  const blocklistQuery = useBlocklistQuery({ enabled: canManageRelationship })
  const addFriendMutation = useAddFriendMutation()
  const removeFriendMutation = useRemoveFriendMutation()
  const addBlockMutation = useAddBlockMutation()
  const removeBlockMutation = useRemoveBlockMutation()
  const fallbackFriendState =
    friendlistQuery.data?.friendlist.includes(user.id) ??
    friendlistQuery.data?.friendlist.includes(fallback.id)
  const fallbackBlockState =
    blocklistQuery.data?.blocklist.includes(user.id) ??
    blocklistQuery.data?.blocklist.includes(fallback.id)
  const isFriend = fallbackFriendState === true
  const isBlocked = fallbackBlockState === true
  const submitting =
    addFriendMutation.isPending ||
    removeFriendMutation.isPending ||
    addBlockMutation.isPending ||
    removeBlockMutation.isPending
  const avatar = user.avatar.medium || user.avatar.large || user.avatar.small
  const profileTo = `/user/${encodeURIComponent(user.username)}`
  const sign = user.sign.trim()
  const bio = profile?.bio.trim()
  const renderedSign = useMemo(() => (sign ? renderBBCode(sign) : null), [sign])
  const renderedBio = useMemo(() => (bio ? renderBBCode(bio) : null), [bio])

  const openProfile = () => {
    navigate(profileTo)
  }

  const toggleFriend = async () => {
    try {
      if (isFriend) {
        await removeFriendMutation.mutateAsync({ username: user.username })
        toast.success('已取消好友')
      } else {
        await addFriendMutation.mutateAsync({ username: user.username })
        toast.success('已添加好友')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : isFriend ? '取消好友失败' : '添加好友失败',
      )
    }
  }

  const blockUser = async () => {
    try {
      await addBlockMutation.mutateAsync({ username: user.username })
      toast.success('已拉黑用户')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '拉黑失败')
    }
  }

  const unblockUser = async () => {
    try {
      await removeBlockMutation.mutateAsync({ username: user.username })
      toast.success('已取消拉黑')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消拉黑失败')
    }
  }

  return (
    <div className="flex cursor-default flex-col overflow-hidden rounded-md" onClick={openProfile}>
      <div className="flex flex-row items-start gap-3 p-4">
        {avatar ? (
          <Image
            className="size-14 shrink-0 overflow-hidden rounded-full border"
            imageSrc={avatar}
            loading="eager"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-full border">
            <span className="i-mingcute-user-3-line text-xl" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-sm font-semibold">{user.nickname || user.username}</div>
          <div className="text-muted-foreground line-clamp-1 text-xs">@{user.username}</div>
          {renderedSign && (
            <div
              className="bbcode text-muted-foreground mt-1 line-clamp-2 text-xs leading-5 whitespace-pre-line"
              onClick={stopProfileNavigationForNestedLink}
            >
              {renderedSign}
            </div>
          )}
        </div>
        {canManageRelationship && (
          <div
            className="flex shrink-0 cursor-default flex-row items-center gap-1 select-auto"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {isBlocked ? (
              <Button
                aria-label="取消拉黑"
                className="size-8"
                disabled={submitting || blocklistQuery.isLoading}
                onClick={unblockUser}
                size="icon"
                title="取消拉黑"
                variant="outline"
              >
                {removeBlockMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Ban className="size-3.5" />
                )}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    aria-label="拉黑"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 size-8"
                    disabled={submitting || blocklistQuery.isLoading}
                    onMouseDown={(event) => event.preventDefault()}
                    size="icon"
                    title="拉黑"
                    variant="ghost"
                  >
                    {addBlockMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Ban className="size-3.5" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确定要拉黑这个用户吗？</AlertDialogTitle>
                    <AlertDialogDescription>
                      拉黑后会把 {user.nickname || user.username} 加入黑名单。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={addBlockMutation.isPending}
                      onClick={blockUser}
                      variant="destructive"
                    >
                      拉黑
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              aria-label={isFriend ? '取消好友' : '加好友'}
              className={cn(
                'size-8',
                isFriend ? 'text-muted-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              disabled={submitting || friendlistQuery.isLoading}
              onClick={toggleFriend}
              size="icon"
              title={isFriend ? '取消好友' : '加好友'}
              variant={isFriend ? 'outline' : 'ghost'}
            >
              {addFriendMutation.isPending || removeFriendMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isFriend ? (
                <UserMinus className="size-3.5" />
              ) : (
                <UserPlus className="size-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
      {renderedBio && (
        <div className="border-t px-4 py-3">
          <div
            className="bbcode text-muted-foreground line-clamp-3 text-xs leading-5 whitespace-pre-line"
            onClick={stopProfileNavigationForNestedLink}
          >
            {renderedBio}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 border-t px-4 py-3 text-center">
        <UserProfileStat label="条目" value={sumSubjectStats(profile)} />
        <UserProfileStat label="好友" value={profile?.stats.friend} />
        <UserProfileStat label="目录" value={profile?.stats.index.create} />
      </div>
      <div className="border-t px-4 py-3">
        <div className="text-muted-foreground min-w-0 truncate text-xs">
          加入于 {formatRecentUnixTime(user.joinedAt)}
        </div>
      </div>
    </div>
  )
}

function stopProfileNavigationForNestedLink(event: MouseEvent<HTMLElement>) {
  if ((event.target as HTMLElement).closest('a')) event.stopPropagation()
}

function UserProfileStat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold tabular-nums">{value ?? '-'}</div>
      <div className="text-muted-foreground text-[0.65rem]">{label}</div>
    </div>
  )
}

function toHoverUser(profile: UserProfile | null | undefined, fallback: HoverUser): HoverUser {
  if (!profile) return fallback

  return {
    avatar: profile.avatar,
    id: profile.id,
    joinedAt: profile.joinedAt,
    nickname: profile.nickname,
    sign: profile.sign,
    username: profile.username,
  }
}

function sumSubjectStats(profile: UserProfile | null | undefined) {
  if (!profile) return undefined

  return Object.values(profile.stats.subject).reduce((sum, subjectStats) => {
    return sum + Object.values(subjectStats ?? {}).reduce((innerSum, value) => innerSum + value, 0)
  }, 0)
}
