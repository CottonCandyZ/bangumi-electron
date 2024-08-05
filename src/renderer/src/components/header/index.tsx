import NavButton from '@renderer/components/header/nav-button'
import RightPanelButton from '@renderer/components/header/right-panel-button'
import HeaderTitle from '@renderer/components/header/subject-title'
import WindowsButton from '@renderer/components/header/windows-button'
import { cn } from '@renderer/lib/utils'

export default function Header() {
  return (
    <header
      className={cn(
        'drag-region flex h-16 flex-row items-center justify-between gap-10 overflow-hidden border-b pl-2 backdrop-blur-2xl',
      )}
    >
      <div className="flex flex-row justify-start gap-3">
        <NavButton />
        <HeaderTitle />
      </div>
      <div className="flex h-full flex-row items-center justify-end gap-2">
        <RightPanelButton />
        <WindowsButton />
      </div>
    </header>
  )
}
