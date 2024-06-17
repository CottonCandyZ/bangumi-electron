import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogTrigger } from '@renderer/components/ui/dialog'
import Login from '@renderer/components/user/login'

export default function Header() {
  const isLogin = false
  return (
    <header className="flex flex-row items-center py-1 h-12 drag-region">
      <div className="flex flex-row justify-start">
        <div className="w-[72px]"></div>
        <div className="p-2 text w-max no-drag-region">发现</div>
      </div>
      <div className="w-full justify-stretch ">
        <div className="mx-auto w-min ">
          <div className="no-drag-region">Search</div>
        </div>
      </div>

      <div className="pr-10 justify-end">
        <div className="no-drag-region">
          {isLogin ? (
            <div></div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-3xl">
                  登录
                </Button>
              </DialogTrigger>
              <Login />
            </Dialog>
          )}
        </div>
      </div>
    </header>
  )
}
