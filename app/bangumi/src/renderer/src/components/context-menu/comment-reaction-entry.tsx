import {
  BangumiSmile,
  REACTION_VALUE_TO_BANGUMI_SMILE,
} from '@renderer/components/comment/bangumi-smile'
import { hasCurrentUser, type ReactionItem } from '@renderer/components/comment/comment-reactions'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@renderer/components/ui/dropdown-menu'
import { getAvailableReactionValues, type ReactionTarget } from '@renderer/data/fetch/api/reaction'
import { useToggleReactionMutation } from '@renderer/data/hooks/api/reaction'
import { useSession } from '@renderer/data/hooks/session'
import { toast } from 'sonner'

/** 右键菜单里的一排贴贴表情，点一下直接贴上 / 取消 */
export function CommentReactionMenuEntry({
  comment,
  onDone,
  target,
}: {
  comment: ReactionItem
  onDone: () => void
  target: ReactionTarget
}) {
  const session = useSession()
  const mutation = useToggleReactionMutation()
  const values = getAvailableReactionValues(target)
  const currentValue = comment.reactions?.find((reaction) =>
    hasCurrentUser(reaction, session),
  )?.value

  if (values.length === 0) return null

  const toggle = (value: number) => {
    onDone()
    // 菜单关闭后组件会卸载，用 mutateAsync 保证失败提示还能弹出
    mutation
      .mutateAsync({
        active: currentValue === value,
        commentId: comment.id,
        target,
        user: session
          ? { id: session.id, nickname: session.nickname, username: session.username }
          : undefined,
        value,
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : '贴贴失败'))
  }

  // 和收藏状态一样平铺而不是子菜单：没有 Trigger 的根菜单会把自己的子菜单当成兄弟菜单而关闭
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>贴贴</DropdownMenuLabel>
      <div className="grid grid-cols-6 gap-0.5 px-1 pb-1">
        {values.map((value) => {
          const smileCode = REACTION_VALUE_TO_BANGUMI_SMILE[value]
          const active = currentValue === value

          return (
            <DropdownMenuItem
              aria-label={active ? '取消贴贴' : `贴贴 ${smileCode ?? value}`}
              className="data-[current=true]:bg-primary/10 data-[current=true]:ring-primary/35 size-8 justify-center p-0 data-[current=true]:ring-1"
              data-current={active}
              key={value}
              onClick={() => toggle(value)}
            >
              {smileCode ? (
                <BangumiSmile code={smileCode} variant="reaction" />
              ) : (
                <span className="text-xs tabular-nums">{value}</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </div>
    </DropdownMenuGroup>
  )
}
