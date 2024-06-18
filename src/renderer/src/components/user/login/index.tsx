import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import LoginForm from '@renderer/components/user/login/form'
import { CircleHelp } from 'lucide-react'
import { useState } from 'react'

export default function Login() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-3xl">
          登录
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            登录{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <CircleHelp className="size-4 inline -mt-1" />
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
