import { Image } from '@renderer/components/base/Image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useLogoutMutation } from '@renderer/constants/hooks/session'
import { useQueryUserInfo } from '@renderer/constants/hooks/api/user'
import { toast } from 'sonner'
import { useTheme } from '@renderer/components/wrapper/theme-wrapper'
import { CheckIcon } from 'lucide-react'

export default function ProfileMenu() {
  const logoutMutation = useLogoutMutation()
  const userInfo = useQueryUserInfo()
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="overflow-hidden rounded-full shadow-sm">
        <Image className="aspect-square size-9" imageSrc={userInfo.data?.avatar.small} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {userInfo.data?.nickname ? (
            <span>Hi! {userInfo.data?.nickname}</span>
          ) : (
            <Skeleton className="h-5" />
          )}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>主题</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')} className="justify-between">
                  浅色
                  {theme === 'light' && <CheckIcon className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="justify-between">
                  深色
                  {theme === 'dark' && <CheckIcon className="size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="justify-between">
                  跟随系统
                  {theme === 'system' && <CheckIcon className="size-4" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              toast.success('退出登录')
              logoutMutation.mutate()
            }}
          >
            登出
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
