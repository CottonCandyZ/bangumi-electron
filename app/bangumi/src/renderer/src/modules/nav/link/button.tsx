import { NavItemContent } from '@renderer/modules/nav/item-content'
import { MyLink } from '@renderer/components/my-link'
import { route } from '@renderer/modules/nav/link/nav'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { useMatch } from 'react-router-dom'

type Props = (typeof route)[number]

export function NavButton({ name, path, icon, active }: Props) {
  const isActive = useMatch(path)
  const [open, setOpen] = useAtom(navOpenAtom)

  return (
    <Button
      variant="ghost"
      aria-label={name}
      className={cn(
        'text-primary/65 hover:text-primary relative h-8 w-full shrink-0 cursor-default justify-start gap-0 overflow-hidden px-0 py-1.5 text-xs select-none',
        isActive && 'bg-accent text-primary',
      )}
      asChild
    >
      <MyLink
        to={path}
        // unstable_viewTransition
        onClick={() => {
          if (open) setOpen(false)
        }}
      >
        <NavItemContent icon={isActive ? active : icon} label={name} open={open} />
      </MyLink>
    </Button>
  )
}
