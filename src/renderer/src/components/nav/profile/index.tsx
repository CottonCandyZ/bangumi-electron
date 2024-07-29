import { Button } from '@renderer/components/ui/button'
import ProfileMenu from '@renderer/components/user/avatarMenu'
import { cn } from '@renderer/lib/utils'
import { useNavCollapsed } from '@renderer/state/panel'

export default function NavProfile() {
  const navCollapsed = useNavCollapsed((state) => state.collapsed)
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full p-1.5">
        <ProfileMenu />
      </div>
      <Button
        variant="ghost"
        className={cn(
          'relative aspect-square h-full w-fit p-2 text-primary/65 hover:text-primary',
          !navCollapsed && 'aspect-auto w-full justify-start gap-2',
        )}
      >
        <span className="i-mingcute-menu-line flex text-[1.4rem]" />
        {!navCollapsed && <span>更多</span>}
      </Button>
    </div>
  )
}
