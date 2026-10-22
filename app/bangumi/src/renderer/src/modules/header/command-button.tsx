import { Button } from '@renderer/components/ui/button'
import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { HotkeyKbd } from '@renderer/components/ui/kbd'
import { appConfigAtom } from '@renderer/state/app-config'
import { commandPanelAtom } from '@renderer/state/command'
import { useAtomValue, useSetAtom } from 'jotai'
import { Search } from 'lucide-react'

export function CommandButton() {
  const setCommandPanel = useSetAtom(commandPanelAtom)
  const hotkey = useAtomValue(appConfigAtom).shortcuts.openSubjectSearch

  return (
    <HeaderButton
      Button={
        <Button
          variant="outline"
          aria-label="搜索条目"
          className="no-drag-region text-muted-foreground hover:text-foreground bg-muted/30 h-7 w-44 max-w-[36cqw] shrink-0 justify-between px-2.5 font-normal shadow-none @max-[900px]/header:size-7 @max-[900px]/header:max-w-7 @max-[900px]/header:justify-center @max-[900px]/header:px-0"
          onClick={() => setCommandPanel({ open: true, mode: 'subject-search' })}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search className="size-4 shrink-0" />
            <span className="truncate text-xs @max-[900px]/header:hidden">搜索条目</span>
          </span>
          <HotkeyKbd
            className="@max-[900px]/header:hidden"
            hotkey={hotkey}
            keyClassName="h-4 min-w-4 text-[10px]"
          />
        </Button>
      }
      Content="搜索条目"
      hotkey={hotkey}
    />
  )
}
