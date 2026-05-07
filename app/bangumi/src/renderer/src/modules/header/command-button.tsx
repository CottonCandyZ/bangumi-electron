import { Button } from '@renderer/components/ui/button'
import { commandPanelAtom } from '@renderer/state/command'
import { useSetAtom } from 'jotai'
import { Search } from 'lucide-react'

const isMac =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

export function CommandButton() {
  const setCommandPanel = useSetAtom(commandPanelAtom)
  const shortcutKeys = isMac ? ['⌘', 'K'] : ['Ctrl', 'K']

  return (
    <Button
      variant="outline"
      aria-label="搜索条目"
      className="no-drag-region text-muted-foreground hover:text-foreground bg-muted/30 h-8 w-56 max-w-[36vw] justify-between px-2.5 font-normal shadow-none"
      onClick={() => setCommandPanel({ open: true, mode: 'subject-search' })}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Search className="size-4" />
        <span className="truncate text-sm">搜索条目</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {shortcutKeys.map((key) => (
          <kbd
            key={key}
            className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 font-sans text-[11px] leading-none"
          >
            {key}
          </kbd>
        ))}
      </span>
    </Button>
  )
}
