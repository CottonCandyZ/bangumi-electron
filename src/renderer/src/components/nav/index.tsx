import { LinkNav } from '@renderer/components/nav/link/nav'
import { PanelNav } from '@renderer/components/nav/panel/nav'
import NavProfile from '@renderer/components/nav/profile'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { useNavCollapsed } from '@renderer/state/panel'

const platform = await client.platform({})

export default function NavBar() {
  const { collapsed: navCollapsed, setCollapsed: setNavCollapsed } = useNavCollapsed(
    (state) => state,
  )
  return (
    <nav className="flex h-dvh w-full flex-col">
      <div
        className={cn(
          'flex h-16 w-full shrink-0 items-center justify-center border-b p-2',
          platform === 'darwin' && 'pt-6',
          !navCollapsed && 'justify-start pl-3',
        )}
      >
        <Button
          variant="ghost"
          className={cn(
            'relative aspect-square h-fit w-fit p-2 text-primary/65 hover:text-primary',
          )}
          onClick={() => setNavCollapsed(!navCollapsed)}
        >
          <span className="i-mingcute-menu-line flex text-[1.4rem]" />
        </Button>
      </div>
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
