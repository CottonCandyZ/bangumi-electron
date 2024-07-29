import { LinkNav } from '@renderer/components/nav/link/nav'
import { PanelNav } from '@renderer/components/nav/panel/nav'
import NavProfile from '@renderer/components/nav/profile'
import { Separator } from '@renderer/components/ui/separator'

export default function NavBar() {
  return (
    <nav className="flex h-dvh w-full flex-col bg-background">
      <div className="drag-region h-16 w-full shrink-0 border-b">{/* icon 就放在这里吧！ */}</div>
      <div className="flex h-full w-full flex-col justify-between overflow-x-scroll px-2.5 pb-2 pt-2">
        <div className="flex w-full flex-col gap-2">
          <LinkNav />
          <Separator />
          <PanelNav />
        </div>
        <NavProfile />
      </div>
    </nav>
  )
}
