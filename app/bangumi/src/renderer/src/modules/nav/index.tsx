import { LinkNav } from '@renderer/modules/nav/link/nav'
import { PanelNav } from '@renderer/modules/nav/panel/nav'
import { NavProfile } from '@renderer/modules/nav/profile'
import { Separator } from '@renderer/components/ui/separator'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom } from '@renderer/state/panel'
import { AnimatePresence, motion } from 'motion/react'
import { useAtom } from 'jotai'
import { UI_CONFIG } from '@renderer/config'

export function NavBar() {
  const [open, setOpen] = useAtom(navOpenAtom)
  return (
    <div>
      <nav
        className={cn(
          'app-sidebar bg-background fixed z-50 flex cursor-default flex-col border-r transition-[width] select-none',
          open && 'z-50',
        )}
        style={{
          width: open ? '13rem' : UI_CONFIG.NAV_WIDTH,
          viewTransitionName: 'app-nav',
        }}
      >
        <div className="flex h-full w-full flex-col justify-between overflow-x-hidden p-1.5">
          <div className="flex w-full flex-col gap-1.5">
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
            className="app-sidebar-backdrop fixed inset-0 z-40 bg-black"
            style={{ left: UI_CONFIG.NAV_WIDTH }}
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
