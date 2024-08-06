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
import { useLogoutMutation } from '@renderer/data/hooks/session'
import { useQueryUserInfo } from '@renderer/data/hooks/api/user'
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
import { cn } from '@renderer/lib/utils'
import { useSession } from '@renderer/components/wrapper/session-wrapper'

export default function ProfileMenu({ type }: { type: 'expend' | 'small' }) {
  const logoutMutation = useLogoutMutation()
  const userInfo = useQueryUserInfo()
  const { theme, setTheme } = useTheme()
  const { isLogin } = useSession()
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropDownOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
        <DropdownMenuTrigger
          className={cn(
            'flex w-full flex-row items-center gap-3 rounded-full text-muted-foreground shadow-sm hover:text-primary',
            type === 'expend' && 'group border p-2 shadow-none hover:bg-accent',
            dropdownOpen && 'bg-accent text-primary',
          )}
        >
          {isLogin ? (
            <Image
              className="aspect-square w-8 shrink-0 overflow-hidden rounded-full"
              imageSrc={userInfo.data?.avatar.small}
            />
          ) : (
            <div className="aspect-square w-8 overflow-hidden rounded-full bg-accent"></div>
          )}
          {type === 'expend' && (
            <span className="shrink-0 font-semibold">{isLogin && userInfo.data?.nickname}</span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={type === 'expend' ? 'end' : 'center'}
          side={'top'}
          collisionPadding={{
            right: 8,
            left: 8,
            bottom: 8,
            top: 8,
          }}
        >
          {isLogin && (
            <DropdownMenuLabel>
              {userInfo.data?.nickname ? (
                <span>Hi! {userInfo.data?.nickname}</span>
              ) : (
                <Skeleton className="h-5" />
              )}
            </DropdownMenuLabel>
          )}
          {!isLogin && (
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
          {isLogin && (
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
