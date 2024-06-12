import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog'

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
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  your data from our servers.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </header>
  )
}
