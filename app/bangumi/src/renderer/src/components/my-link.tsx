import { getLinkContextMenuEntries } from '@renderer/components/context-menu/link-entries'
import { useContextMenu } from '@renderer/components/context-menu/use-context-menu'
import type { ContextMenuEntry } from '@renderer/state/context-menu'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import { createPath, Link, LinkProps } from 'react-router-dom'

const COLLECTABLE_PATH = /^\/(subject|character|person)\/(\d+)\/?$/

/** 指向条目 / 角色 / 人物的链接在登录后可以直接改收藏 */
function getCollectionEntry(path: string): ContextMenuEntry | null {
  const match = path.match(COLLECTABLE_PATH)
  if (!match) return null
  const id = Number(match[2])
  if (match[1] === 'subject') return { type: 'subject-collection', subjectId: id }
  return {
    type: 'resource-collection',
    resourceType: match[1] as 'character' | 'person',
    resourceId: id,
  }
}

/**
 * 应用内链接。右键时弹出通用的链接菜单（打开 / 复制链接 / 在浏览器中打开），
 * `contextMenuTitle` 额外提供「复制标题」，`contextMenuItems` 会放在通用菜单项前面。
 * 不订阅路由，避免列表里大量链接在切换页面时重渲染。
 */
export const MyLink = ({
  contextMenuItems,
  contextMenuTitle,
  onContextMenu,
  ...props
}: LinkProps & {
  contextMenuItems?: ContextMenuEntry[]
  contextMenuTitle?: string
}) => {
  const openContextMenu = useContextMenu()

  return (
    <Link
      draggable={false}
      onContextMenu={(event) => {
        onContextMenu?.(event)
        if (event.defaultPrevented) return
        const path = typeof props.to === 'string' ? props.to : createPath(props.to)
        const collectionEntry = store.get(userIdAtom) ? getCollectionEntry(path) : null
        openContextMenu(event, [
          ...(contextMenuItems ?? []),
          ...(contextMenuItems?.length ? [{ type: 'separator' as const }] : []),
          ...(collectionEntry ? [collectionEntry, { type: 'separator' as const }] : []),
          ...getLinkContextMenuEntries({ path, state: props.state, title: contextMenuTitle }),
        ])
      }}
      {...props}
    />
  )
}
