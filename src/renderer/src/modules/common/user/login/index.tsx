import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { LoginForm } from '@renderer/modules/common/user/login/form'
import { CircleHelp } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'

export function Login({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
