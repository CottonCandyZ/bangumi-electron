import { Button } from '@renderer/components/ui/button'
import ProfileMenu from '@renderer/components/user/avatarMenu'
import Login from '@renderer/components/user/login'
import { useIsLoginQuery } from '@renderer/constants/hooks/session'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Header() {
  const isLogin = useIsLoginQuery()
  return (
    <header className="drag-region flex h-12 flex-row items-center">
      <div className="flex flex-row justify-start gap-1">
        <div className="w-[72px]"></div>
        <Button
          variant="outline"
          className="no-drag-region aspect-square rounded-full p-0.5 shadow-none"
          disabled
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          className="no-drag-region aspect-square rounded-full p-1 shadow-none"
          disabled
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="w-full justify-stretch">
        <div className="mx-auto w-min">
          <div className="no-drag-region">Search</div>
        </div>
      </div>
      <div className="justify-end pr-40">
        <div className="no-drag-region flex items-center">
          {isLogin.data ? <ProfileMenu /> : <Login />}
        </div>
      </div>
    </header>
  )
}
