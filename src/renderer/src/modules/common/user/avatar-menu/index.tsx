import { Image } from '@renderer/components/image/image'
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
import { toast } from 'sonner'
import { useTheme } from '@renderer/modules/wrapper/theme-wrapper'
import { useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useSetAtom } from 'jotai'
import { loginDialogAtom } from '@renderer/state/dialog/normal'

export function ProfileMenu({ type }: { type: 'expend' | 'small' }) {
  const logoutMutation = useLogoutMutation()
  const { userInfo } = useSession()
  const isLogin = !!userInfo
  const { theme, setTheme } = useTheme()

  const [dropdownOpen, setDropDownOpen] = useState(false)
  const openDialog = useSetAtom(loginDialogAtom)

  return (
    <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
      <DropdownMenuTrigger
        data-expend={type}
        className={cn(
          'flex w-fit flex-row items-center gap-3 rounded-full text-muted-foreground shadow-sm hover:text-primary',
          type === 'expend' && 'group w-full border p-2 shadow-none',
          dropdownOpen && 'bg-accent text-primary',
        )}
      >
        {isLogin ? (
          <Image
            className="aspect-square w-8 shrink-0 overflow-hidden rounded-full"
            imageSrc={userInfo.avatar.small}
          />
        ) : (
          <div
            data-expend={type}
            className="aspect-square w-8 shrink-0 overflow-hidden rounded-full bg-accent"
          />
        )}
        {type === 'expend' && (
          <span className="shrink-0 font-semibold">{isLogin && userInfo.nickname}</span>
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
            {userInfo?.nickname ? (
              <span>Hi! {userInfo?.nickname}</span>
            ) : (
              <Skeleton className="h-5" />
            )}
          </DropdownMenuLabel>
        )}
        {!isLogin && (
          <DropdownMenuItem onClick={() => openDialog({ open: true })}>登录</DropdownMenuItem>
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
  )
}
