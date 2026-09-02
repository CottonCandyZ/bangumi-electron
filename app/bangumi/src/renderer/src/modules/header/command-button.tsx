import { Button } from '@renderer/components/ui/button'
import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { isHotkeyEnabled, splitHotkeyForDisplay } from '@renderer/lib/shortcut'
import { appConfigAtom } from '@renderer/state/app-config'
import { commandPanelAtom } from '@renderer/state/command'
import { useAtomValue, useSetAtom } from 'jotai'
import { Search } from 'lucide-react'

export function CommandButton() {
  const setCommandPanel = useSetAtom(commandPanelAtom)
  const hotkey = useAtomValue(appConfigAtom).shortcuts.openSubjectSearch
  const shortcutKeys = splitHotkeyForDisplay(hotkey)

  return (
    <HeaderButton
      Button={
        <Button
          variant="outline"
          aria-label="搜索条目"
          className="no-drag-region text-muted-foreground hover:text-foreground bg-muted/30 h-8 w-56 max-w-[36cqw] shrink-0 justify-between px-2.5 font-normal shadow-none @max-[900px]/header:size-8 @max-[900px]/header:max-w-8 @max-[900px]/header:justify-center @max-[900px]/header:px-0"
          onClick={() => setCommandPanel({ open: true, mode: 'subject-search' })}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search className="size-4 shrink-0" />
            <span className="truncate text-sm @max-[900px]/header:hidden">搜索条目</span>
          </span>
          {isHotkeyEnabled(hotkey) && (
            <span className="flex shrink-0 items-center gap-1 @max-[900px]/header:hidden">
              {shortcutKeys.map((key) => (
                <kbd
                  key={key}
                  className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 font-sans text-[11px] leading-none"
                >
                  {key}
                </kbd>
              ))}
            </span>
          )}
        </Button>
      }
      Content={<p>搜索条目</p>}
    />
  )
}
