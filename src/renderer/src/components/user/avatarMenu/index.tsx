import { Image } from '@renderer/components/base/Image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useLogoutMutation } from '@renderer/constants/hooks/session'
import { useQueryUserInfo } from '@renderer/constants/hooks/api/user'
import { toast } from 'sonner'

export default function ProfileMenu() {
  const logoutMutation = useLogoutMutation()
  const userInfo = useQueryUserInfo()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="overflow-hidden rounded-full">
        <Image className="aspect-square size-9 object-cover" src={userInfo.data?.avatar.small} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {userInfo.data?.nickname ? (
            <span>Hi! {userInfo.data?.nickname}</span>
          ) : (
            <Skeleton className="h-5" />
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            toast.success('退出登录')
            logoutMutation.mutate()
          }}
        >
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
