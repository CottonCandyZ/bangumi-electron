import { LinkNav } from '@renderer/modules/nav/link/nav'
import { PanelNav } from '@renderer/modules/nav/panel/nav'
import { NavProfile } from '@renderer/modules/nav/profile'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom } from '@renderer/state/panel'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { UI_CONFIG } from '@renderer/config'

const platform = await client.platform({})

export function NavBar() {
  const [open, setOpen] = useAtom(navOpenAtom)
  return (
    <div>
      <nav
        className={cn(
          'fixed z-10 flex h-dvh flex-col border-r bg-background transition-[width]',
          open && 'z-50',
        )}
        style={{
          width: open ? '15rem' : UI_CONFIG.NAV_WIDTH,
          maxWidth: open ? undefined : '4rem',
        }}
      >
        <div
          className={cn(
            'flex h-14 w-full shrink-0 items-center justify-center border-b p-2',
            platform === 'darwin' && 'pt-6',
            open && 'justify-start pl-3',
          )}
        >
          <Button
            variant="ghost"
            className={cn(
              'relative aspect-square h-fit w-fit p-2 text-primary/65 hover:text-primary',
              platform === 'darwin' && 'm-1 p-1',
            )}
            onClick={() => setOpen(!open)}
          >
            <span className="i-mingcute-menu-line flex text-[1.4rem]" />
          </Button>
        </div>
        <div className="flex h-full w-full flex-col justify-between overflow-x-hidden px-2.5 pb-2 pt-2">
          <div className="flex w-full flex-col gap-2">
            <LinkNav />
            <Separator />
            <PanelNav />
          </div>
          <NavProfile />
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 left-16 z-40 bg-black"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
