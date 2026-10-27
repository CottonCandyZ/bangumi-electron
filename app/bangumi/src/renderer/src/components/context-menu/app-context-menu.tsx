import {
  copySelectionEntry,
  CONTEXT_MENU_SEPARATOR,
} from '@renderer/components/context-menu/use-context-menu'
import {
  getSubjectCollectionTypeByKey,
  markSubjectCollection,
  SubjectCollectionMenuEntry,
} from '@renderer/components/context-menu/subject-collection-entry'
import { CommentReactionMenuEntry } from '@renderer/components/context-menu/comment-reaction-entry'
import {
  RESOURCE_COLLECTION_SHORTCUT,
  ResourceCollectionMenuEntry,
} from '@renderer/components/context-menu/resource-collection-entry'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '@renderer/components/ui/dropdown-menu'
import { cn } from '@renderer/lib/utils'
import { windowCollisionPadding } from '@renderer/lib/window-safe-area'
import {
  contextMenuAtom,
  type ContextMenuActionHelpers,
  type ContextMenuEntry,
} from '@renderer/state/context-menu'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { useAtom } from 'jotai'
import { useEffect, useMemo, useRef, type KeyboardEvent, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * 全局唯一的右键菜单：各处用 useContextMenu 传入菜单项，这里在鼠标位置弹出。
 * 菜单项可以带单键快捷键，菜单打开时直接按对应字母执行。
 * 没有组件接管的右键：有选中文字时提供复制，输入框里提供剪切 / 复制 / 粘贴 / 全选。
 */
export function AppContextMenu() {
  const [state, setState] = useAtom(contextMenuAtom)
  const navigate = useNavigate()
  const helpers = useMemo<ContextMenuActionHelpers>(() => ({ navigate }), [navigate])

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      const items = getFallbackEntries(event.target)
      if (items.length === 0) return
      event.preventDefault()
      setState({ id: Date.now(), items, x: event.clientX, y: event.clientY })
    }
    window.addEventListener('contextmenu', onContextMenu)
    return () => window.removeEventListener('contextmenu', onContextMenu)
  }, [setState])

  const close = () => setState(null)
  const run = (entry: ContextMenuItemEntry) => {
    close()
    entry.onSelect(helpers)
  }
  // 收藏开关的状态在菜单项组件里，单键快捷键通过它来触发
  const resourceToggleRef = useRef<(() => void) | null>(null)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!state || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return
    const key = event.key.toLowerCase()
    const action = getShortcutAction(state.items, key)
    if (!action) return
    event.preventDefault()
    event.stopPropagation()
    if (action.kind === 'item') return run(action.entry)
    if (action.kind === 'subject-collection') {
      close()
      return markSubjectCollection(action.subjectId, action.collectionType)
    }
    resourceToggleRef.current?.()
  }

  const anchor = useMemo(
    () =>
      state
        ? {
            getBoundingClientRect: () =>
              DOMRect.fromRect({ x: state.x, y: state.y, width: 0, height: 0 }),
          }
        : null,
    [state],
  )

  return (
    <MenuPrimitive.Root
      key={state?.id}
      modal={false}
      open={!!state}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner
          align="start"
          anchor={anchor}
          className="isolate z-50 outline-none"
          collisionPadding={windowCollisionPadding()}
          side="bottom"
          sideOffset={2}
        >
          <MenuPrimitive.Popup
            className="bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 z-50 max-h-(--available-height) min-w-44 origin-(--transform-origin) overflow-y-auto rounded-md border p-1 shadow-md duration-100 outline-none"
            onKeyDownCapture={onKeyDown}
          >
            {state?.items.map((entry, index) => (
              <ContextMenuEntryView
                entry={entry}
                key={index}
                onClose={close}
                onRun={run}
                resourceToggleRef={resourceToggleRef}
              />
            ))}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  )
}

function ContextMenuEntryView({
  entry,
  onClose,
  onRun,
  resourceToggleRef,
}: {
  entry: ContextMenuEntry
  onClose: () => void
  onRun: (entry: ContextMenuItemEntry) => void
  resourceToggleRef: RefObject<(() => void) | null>
}) {
  if (entry.type === 'separator') return <DropdownMenuSeparator />
  if (entry.type === 'subject-collection') {
    return <SubjectCollectionMenuEntry onDone={onClose} subjectId={entry.subjectId} />
  }
  if (entry.type === 'comment-reaction') {
    return (
      <CommentReactionMenuEntry comment={entry.comment} onDone={onClose} target={entry.target} />
    )
  }
  if (entry.type === 'resource-collection') {
    return (
      <ResourceCollectionMenuEntry
        onDone={onClose}
        resourceId={entry.resourceId}
        resourceType={entry.resourceType}
        toggleRef={resourceToggleRef}
      />
    )
  }

  return (
    <DropdownMenuItem
      disabled={entry.disabled}
      onClick={() => onRun(entry)}
      variant={entry.variant}
    >
      <MenuIcon icon={entry.icon} />
      {entry.label}
      {entry.shortcut && (
        <DropdownMenuShortcut className="pl-4 tracking-normal">
          {entry.shortcut.toUpperCase()}
        </DropdownMenuShortcut>
      )}
    </DropdownMenuItem>
  )
}

type ContextMenuItemEntry = Extract<ContextMenuEntry, { onSelect: unknown }>

/** 菜单打开时按下单键对应的动作：普通菜单项、1~5 标记条目收藏、F 切换角色 / 人物收藏 */
function getShortcutAction(items: ContextMenuEntry[], key: string) {
  for (const item of items) {
    if (item.type === 'subject-collection') {
      const collectionType = getSubjectCollectionTypeByKey(key)
      if (collectionType !== undefined) {
        return {
          kind: 'subject-collection' as const,
          subjectId: item.subjectId,
          collectionType,
        }
      }
    } else if (item.type === 'resource-collection') {
      if (key === RESOURCE_COLLECTION_SHORTCUT) return { kind: 'resource-collection' as const }
    } else if (
      item.type !== 'separator' &&
      item.type !== 'comment-reaction' &&
      item.shortcut === key &&
      !item.disabled
    ) {
      return { kind: 'item' as const, entry: item }
    }
  }
  return null
}

function MenuIcon({ icon }: { icon?: string }) {
  return <span aria-hidden className={cn('size-4 shrink-0 text-base', icon)} />
}

function getFallbackEntries(target: EventTarget | null): ContextMenuEntry[] {
  const editable =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target
      : target instanceof HTMLElement && target.closest('[contenteditable="true"]')
        ? (target.closest('[contenteditable="true"]') as HTMLElement)
        : null

  if (editable) {
    if (editable instanceof HTMLInputElement && editable.type === 'password') return []
    const focus = () => editable.focus()
    return [
      {
        label: '剪切',
        icon: 'i-mingcute-scissors-line',
        shortcut: 'x',
        onSelect: () => {
          focus()
          document.execCommand('cut')
        },
      },
      {
        label: '复制',
        icon: 'i-mingcute-copy-2-line',
        shortcut: 'c',
        onSelect: () => {
          focus()
          document.execCommand('copy')
        },
      },
      {
        label: '粘贴',
        icon: 'i-mingcute-clipboard-line',
        shortcut: 'v',
        onSelect: () => {
          focus()
          void navigator.clipboard.readText().then((text) => {
            document.execCommand('insertText', false, text)
          })
        },
      },
      CONTEXT_MENU_SEPARATOR,
      {
        label: '全选',
        icon: 'i-mingcute-select-line',
        shortcut: 'a',
        onSelect: () => {
          focus()
          document.execCommand('selectAll')
        },
      },
    ]
  }

  const selection = window.getSelection()?.toString().trim()
  return selection ? [copySelectionEntry(selection)] : []
}
