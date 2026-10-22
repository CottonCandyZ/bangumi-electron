import { CONTEXT_MENU_SEPARATOR } from '@renderer/components/context-menu/use-context-menu'
import { getSiteUrl, openInBrowser } from '@renderer/lib/site-url'
import type { ContextMenuEntry } from '@renderer/state/context-menu'
import { toast } from 'sonner'

export function copyText(text: string, message = '已复制') {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(message),
    () => toast.error('复制失败'),
  )
}

/** 应用内链接通用的右键菜单：打开 / 复制标题 / 复制网页版链接 / 在浏览器中打开 */
export function getLinkContextMenuEntries({
  path,
  state,
  title,
}: {
  path: string
  state?: unknown
  title?: string
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
    !!title && {
      label: '复制标题',
      icon: 'i-mingcute-text-line',
      shortcut: 't',
      onSelect: () => copyText(title, '已复制标题'),
    },
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
