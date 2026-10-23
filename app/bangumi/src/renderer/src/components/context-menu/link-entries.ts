import { CONTEXT_MENU_SEPARATOR } from '@renderer/components/context-menu/use-context-menu'
import { getSiteUrl, openInBrowser } from '@renderer/lib/site-url'
import type { ContextMenuEntry, ContextMenuTitle } from '@renderer/state/context-menu'
import { toast } from 'sonner'

export function copyText(text: string, message = '已复制') {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(message),
    () => toast.error('复制失败'),
  )
}

/** 有中文名且和原名不同时分别提供复制中文标题 / 原标题，否则只有一项复制标题 */
function getCopyTitleEntries(title?: ContextMenuTitle): ContextMenuEntry[] {
  if (!title) return []
  const { name, nameCN } = typeof title === 'string' ? { name: title, nameCN: undefined } : title
  if (nameCN && name && nameCN !== name) {
    return [
      {
        label: '复制中文标题',
        icon: 'i-mingcute-text-line',
        shortcut: 't',
        onSelect: () => copyText(nameCN, '已复制中文标题'),
      },
      {
        label: '复制原标题',
        icon: 'i-mingcute-translate-2-line',
        shortcut: 'n',
        onSelect: () => copyText(name, '已复制原标题'),
      },
    ]
  }
  const text = nameCN || name
  if (!text) return []
  return [
    {
      label: '复制标题',
      icon: 'i-mingcute-text-line',
      shortcut: 't',
      onSelect: () => copyText(text, '已复制标题'),
    },
  ]
}

/** 应用内链接通用的右键菜单：打开 / 复制标题 / 复制网页版链接 / 在浏览器中打开 */
export function getLinkContextMenuEntries({
  path,
  state,
  title,
}: {
  path: string
  state?: unknown
  title?: ContextMenuTitle
}): ContextMenuEntry[] {
  const siteUrl = getSiteUrl(path)
  const entries: (ContextMenuEntry | false)[] = [
    {
      label: '打开',
      icon: 'i-mingcute-arrow-right-up-line',
      shortcut: 'o',
      onSelect: ({ navigate }) => navigate(path, { state }),
    },
    CONTEXT_MENU_SEPARATOR,
    ...getCopyTitleEntries(title),
    !!siteUrl && {
      label: '复制链接',
      icon: 'i-mingcute-link-line',
      shortcut: 'l',
      onSelect: () => copyText(siteUrl, '已复制链接'),
    },
    !!siteUrl && {
      label: '在浏览器中打开网页版',
      icon: 'i-mingcute-world-2-line',
      shortcut: 'b',
      onSelect: () => openInBrowser(siteUrl),
    },
  ]
  return entries.filter((entry): entry is ContextMenuEntry => !!entry)
}
