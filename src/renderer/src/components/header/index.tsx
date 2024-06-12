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

export default function Header() {
  const isLogin = false
  return (
    <header className="flex flex-row items-center py-1 h-12">
      <div className="flex flex-row justify-start">
        <div className="w-[72px]"></div>
        <div className="p-2 text w-max">发现</div>
      </div>
      <div className="w-full justify-stretch">
        <div className="mx-auto w-min">Search</div>
      </div>

      <div className="pr-10 justify-end">
        {isLogin ? (
          <div></div>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-3xl">
                登录
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  登录{' '}
                  <span>
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
                  </span>
                </DialogTitle>
              </DialogHeader>
              <LoginForm />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  )
}
