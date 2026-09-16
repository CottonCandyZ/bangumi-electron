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
  DropdownMenuShortcut,
} from '@renderer/components/ui/dropdown-menu'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useLogoutMutation, useSession } from '@renderer/data/hooks/session'
import { toast } from 'sonner'
import { useTheme } from '@renderer/modules/wrapper/theme-wrapper'
import { useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { useAtomValue, useSetAtom } from 'jotai'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useNavigate } from 'react-router-dom'
import { appConfigAtom } from '@renderer/state/app-config'
import { formatHotkeyForDisplay, isHotkeyEnabled } from '@renderer/lib/shortcut'
import { useBangumiWebVerification } from '@renderer/modules/common/bangumi-web-verification'

export function ProfileMenu({ type }: { type: 'expend' | 'small' }) {
  const logoutMutation = useLogoutMutation()
  const userInfo = useSession()
  const isLogin = !!userInfo
  const { theme, setTheme } = useTheme()
  const shortcuts = useAtomValue(appConfigAtom).shortcuts
  const navigate = useNavigate()
  const webVerification = useBangumiWebVerification()

  const [dropdownOpen, setDropDownOpen] = useState(false)
  const openDialog = useSetAtom(loginDialogAtom)

  return (
    <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
      <DropdownMenuTrigger
        data-expend={type}
        aria-label="账号菜单"
        className={cn(
          'text-muted-foreground hover:text-primary relative flex w-fit flex-row items-center gap-2 rounded-full shadow-xs',
          type === 'expend' && 'group w-full min-w-0 border p-1.5 shadow-none',
          dropdownOpen && 'bg-accent text-primary',
        )}
      >
        {isLogin ? (
          <Image
            className="aspect-square w-7 shrink-0 overflow-hidden rounded-full"
            imageSrc={userInfo.avatar.small}
          />
        ) : (
          <div className="bg-accent aspect-square w-7 shrink-0 overflow-hidden rounded-full" />
        )}
        {type === 'expend' && (
          <span className="min-w-0 truncate text-xs font-medium">
            {isLogin && userInfo.nickname}
          </span>
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
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {userInfo?.nickname ? (
                <span>Hi! {userInfo?.nickname}</span>
              ) : (
                <Skeleton className="h-5" />
              )}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/profile')}>个人主页</DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        {!isLogin && (
          <DropdownMenuItem onClick={() => openDialog({ open: true })}>登录</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            设置
            {isHotkeyEnabled(shortcuts.openSettings) && (
              <DropdownMenuShortcut>
                {formatHotkeyForDisplay(shortcuts.openSettings)}
              </DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={webVerification.isPending}
            onClick={() => webVerification.mutate()}
          >
            {webVerification.isPending ? '正在进行网页验证…' : '网页验证'}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>主题</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                collisionPadding={{
                  right: 8,
                  left: 8,
                  bottom: 8,
                  top: 8,
                }}
              >
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
