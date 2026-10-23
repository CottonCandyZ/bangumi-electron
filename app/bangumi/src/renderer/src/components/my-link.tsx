import { getLinkContextMenuEntries } from '@renderer/components/context-menu/link-entries'
import { useContextMenu } from '@renderer/components/context-menu/use-context-menu'
import type { ContextMenuEntry, ContextMenuTitle } from '@renderer/state/context-menu'
import { userIdAtom } from '@renderer/state/session'
import { store } from '@renderer/state/utils'
import type { MouseEvent } from 'react'
import { useCallback } from 'react'
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
 * 打开应用内链接的通用右键菜单：额外菜单项 / 收藏 / 打开、复制标题、复制链接等。
 * 不是 <a> 但点击会跳转的元素（例如侧栏的按钮项）也用它，保持和 MyLink 一致。
 */
export function useLinkContextMenu() {
  const openContextMenu = useContextMenu()

  return useCallback(
    (
      event: MouseEvent,
      {
        items,
        path,
        state,
        title,
      }: {
        items?: ContextMenuEntry[]
        path: string
        state?: unknown
        title?: ContextMenuTitle
      },
    ) => {
      const collectionEntry = store.get(userIdAtom) ? getCollectionEntry(path) : null
      openContextMenu(event, [
        ...(items ?? []),
        ...(items?.length ? [{ type: 'separator' as const }] : []),
        ...(collectionEntry ? [collectionEntry, { type: 'separator' as const }] : []),
        ...getLinkContextMenuEntries({ path, state, title }),
      ])
    },
    [openContextMenu],
  )
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
  contextMenuTitle?: ContextMenuTitle
}) => {
  const openLinkContextMenu = useLinkContextMenu()

  return (
    <Link
      draggable={false}
      onContextMenu={(event) => {
        onContextMenu?.(event)
        if (event.defaultPrevented) return
        const path = typeof props.to === 'string' ? props.to : createPath(props.to)
        openLinkContextMenu(event, {
          items: contextMenuItems,
          path,
          state: props.state,
          title: contextMenuTitle,
        })
      }}
      {...props}
    />
  )
}
