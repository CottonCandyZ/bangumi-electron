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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@renderer/components/ui/dropdown-menu'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useIsLoginQuery, useLogoutMutation } from '@renderer/constants/hooks/session'
import { useQueryUserInfo } from '@renderer/constants/hooks/api/user'
import { toast } from 'sonner'
import { useTheme } from '@renderer/components/wrapper/theme-wrapper'
import { CircleHelp } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import LoginForm from '@renderer/components/user/login/form'

export default function ProfileMenu() {
  const logoutMutation = useLogoutMutation()
  const userInfo = useQueryUserInfo()
  const { theme, setTheme } = useTheme()
  const isLogin = useIsLoginQuery()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger className="overflow-hidden rounded-full shadow-sm">
          {isLogin.data ? (
            <Image className="aspect-square size-9" imageSrc={userInfo.data?.avatar.small} />
          ) : (
            <div className="aspect-square size-9 bg-accent"></div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isLogin.data && (
            <DropdownMenuLabel>
              {userInfo.data?.nickname ? (
                <span>Hi! {userInfo.data?.nickname}</span>
              ) : (
                <Skeleton className="h-5" />
              )}
            </DropdownMenuLabel>
          )}
          {!isLogin.data && (
            <DialogTrigger asChild>
              <DropdownMenuItem>登录</DropdownMenuItem>
            </DialogTrigger>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>主题</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme as (value: string) => void}
                  >
                    <DropdownMenuRadioItem value="light">浅色</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">深色</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">跟随系统</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          {isLogin.data && (
            <>
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
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            登录{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <CircleHelp className="-mt-1 inline size-4" />
              </HoverCardTrigger>
              <HoverCardContent className="text-sm font-normal">
                <p>登录将模拟网页版来实现，会执行五个步骤：</p>
                <ol className="list-decimal px-3">
                  <li>模拟网页完成登录获得 cookie</li>
                  <li>获取授权码的表单</li>
                  <li>授权</li>
                  <li>获取 token</li>
                  <li>保存信息</li>
                </ol>
              </HoverCardContent>
            </HoverCard>
          </DialogTitle>
        </DialogHeader>
        <LoginForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  )
}
