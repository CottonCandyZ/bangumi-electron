import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Skeleton } from '@renderer/components/ui/skeleton'
import MyAvatar from '@renderer/components/user/avatarMenu/avatar'
import { getUserInfo } from '@renderer/constants/api/user'
import { useAccessTokenQuery, useLogoutMutation } from '@renderer/hooks/session'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function ProfileMenu() {
  const logoutMutation = useLogoutMutation()
  const { data: accessToken } = useAccessTokenQuery()
  const { data, isLoading } = useQuery({
    queryKey: ['userInfo', accessToken],
    queryFn: () => getUserInfo(accessToken!.access_token),
    enabled: !!accessToken,
  })
  if (data && 'title' in data) {
    toast.error('登陆状态过期了哦')
    logoutMutation.mutate()
    return
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MyAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {isLoading ? <Skeleton className="h-5" /> : <span>Hi! {data?.nickname}</span>}
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
