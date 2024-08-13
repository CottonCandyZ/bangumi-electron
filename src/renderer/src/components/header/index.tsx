import NavButton from '@renderer/components/header/nav-button'
import OriginalLink from '@renderer/components/header/o-link'
import RightPanelButton from '@renderer/components/header/right-panel-button'
import HeaderTitle from '@renderer/components/header/subject-title'
import WindowsButton from '@renderer/components/header/windows-button'
import { cn } from '@renderer/lib/utils'

export default function Header() {
  return (
    <header
      className={cn(
        'drag-region relative z-10 flex h-16 shrink-0 flex-row items-center justify-between gap-10 border-b pl-2 backdrop-blur-2xl',
      )}
    >
      <div className="flex h-full flex-row items-center gap-3">
        <NavButton />
        <HeaderTitle />
      </div>
      <div className="flex h-full flex-row items-center gap-2">
        <OriginalLink />
        <RightPanelButton />
        <WindowsButton />
      </div>
    </header>
  )
}
