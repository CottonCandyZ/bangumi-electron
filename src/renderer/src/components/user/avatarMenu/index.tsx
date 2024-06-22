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
import { useQueryUserInfo } from '@renderer/constants/hooks/userInfo'
import { toast } from 'sonner'

export default function ProfileMenu() {
  const logoutMutation = useLogoutMutation()
  const { data, isError } = useQueryUserInfo()
  if (isError) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full overflow-hidden">
        <Image className="size-9 aspect-square object-cover" src={data?.avatar.small} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {data?.nickname ? <span>Hi! {data?.nickname}</span> : <Skeleton className="h-5" />}
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
