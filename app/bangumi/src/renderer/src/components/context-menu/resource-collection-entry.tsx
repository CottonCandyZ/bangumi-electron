import { DropdownMenuItem, DropdownMenuShortcut } from '@renderer/components/ui/dropdown-menu'
import {
  useCharacterCollectionQuery,
  usePersonCollectionQuery,
  useResourceCollectionMutation,
} from '@renderer/data/hooks/api/collection'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { useEffect, type RefObject } from 'react'
import { toast } from 'sonner'

export const RESOURCE_COLLECTION_SHORTCUT = 'f'

const RESOURCE_LABEL = { character: '角色', person: '人物' } as const

/** 右键菜单里角色 / 人物的收藏开关，打开菜单时才去读当前是否已收藏 */
export function ResourceCollectionMenuEntry({
  onDone,
  resourceId,
  resourceType,
  toggleRef,
}: {
  onDone: () => void
  resourceId: number
  resourceType: 'character' | 'person'
  /** 交给菜单的单键快捷键调用 */
  toggleRef: RefObject<(() => void) | null>
}) {
  const username = useSessionUsername()
  const characterQuery = useCharacterCollectionQuery({
    characterId: resourceId.toString(),
    enabled: resourceType === 'character',
    username,
  })
  const personQuery = usePersonCollectionQuery({
    enabled: resourceType === 'person',
    personId: resourceId.toString(),
    username,
  })
  const query = resourceType === 'character' ? characterQuery : personQuery
  const mutation = useResourceCollectionMutation()
  const collected = !!query.data
  const disabled = query.isPending || query.isError

  const toggle = () => {
    onDone()
    if (disabled) return
    mutation.mutateAsync({ collected: !collected, resourceId, resourceType }).then(
      () => toast.success(collected ? '已取消收藏' : '已收藏'),
      (error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : collected ? '取消收藏失败' : '收藏失败',
        ),
    )
  }

  useEffect(() => {
    toggleRef.current = toggle
    return () => {
      toggleRef.current = null
    }
  })

  return (
    <DropdownMenuItem disabled={disabled} onClick={toggle}>
      <span
        aria-hidden
        className={
          collected
            ? 'i-mingcute-bookmark-remove-line size-4 shrink-0 text-base'
            : 'i-mingcute-bookmark-add-line size-4 shrink-0 text-base'
        }
      />
      {query.isPending
        ? '读取收藏状态…'
        : collected
          ? `取消收藏${RESOURCE_LABEL[resourceType]}`
          : `收藏${RESOURCE_LABEL[resourceType]}`}
      <DropdownMenuShortcut className="pl-4 tracking-normal">
        {RESOURCE_COLLECTION_SHORTCUT.toUpperCase()}
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  )
}
