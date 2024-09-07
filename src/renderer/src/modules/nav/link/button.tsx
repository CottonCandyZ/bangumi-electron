import { MyLink } from '@renderer/components/my-link'
import { route } from '@renderer/modules/nav/link/nav'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { navOpenAtom } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { useMatch } from 'react-router-dom'

type Props = (typeof route)[number]

export default function NavButton({ name, path, icon, active }: Props) {
  const isActive = useMatch(path)
  const [open, setOpen] = useAtom(navOpenAtom)

  return (
    <Button
      variant="ghost"
      className={cn(
        'relative aspect-square h-full w-fit p-2 text-primary/65 hover:text-primary active:scale-95',
        isActive && 'bg-accent text-primary',
        open && 'aspect-auto w-full justify-start gap-2',
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
        <div className="flex">{isActive ? active : icon}</div>
        {open && <span>{name}</span>}
      </MyLink>
    </Button>
  )
}
