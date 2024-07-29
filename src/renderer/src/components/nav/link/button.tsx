import { MyLink } from '@renderer/components/base/my-link'
import { route } from '@renderer/components/nav/link/nav'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { useNavCollapsed } from '@renderer/state/panel'
import { useMatch } from 'react-router-dom'

type Props = (typeof route)[number]

export default function NavButton({ name, path, icon, active }: Props) {
  const isActive = useMatch(path)
  const navCollapsed = useNavCollapsed((state) => state.collapsed)

  return (
    <Button
      variant="ghost"
      className={cn(
        'relative aspect-square h-full w-fit p-2 text-primary/65 hover:text-primary',
        isActive && 'bg-accent text-primary',
        !navCollapsed && 'aspect-auto w-full justify-start gap-2',
      )}
      asChild
    >
      <MyLink to={path} unstable_viewTransition>
        <div className="flex">{isActive ? active : icon}</div>
        {!navCollapsed && <span>{name}</span>}
      </MyLink>
    </Button>
  )
}
