import { Button } from '@renderer/components/ui/button'
import ProfileMenu from '@renderer/components/user/avatarMenu'
import Login from '@renderer/components/user/login'
import { SateContext } from '@renderer/components/wrapper/state-warpper'
import { useIsLoginQuery } from '@renderer/constants/hooks/session'
import { ChevronLeft } from 'lucide-react'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const isLogin = useIsLoginQuery()
  const navigate = useNavigate()
  const initState = useContext(SateContext)
  return (
    <header className="drag-region flex h-16 flex-row items-center gap-10">
      <div className="flex flex-row justify-start gap-1">
        <div className="flex w-[72px] items-center justify-center">
          <Button
            variant="ghost"
            className="no-drag-region aspect-square p-0.5 shadow-none"
            disabled={initState?.stateStack.length === 0}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft />
          </Button>
        </div>
      </div>
      <div className="flex w-full items-center justify-end">
        <div className="no-drag-region basis-72">
          <Button
            variant="outline"
            className="relative w-full justify-between rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none"
          >
            <div className="flex items-center gap-2">
              <span className="i-mingcute-search-line mt-0.5"></span>
              <span>搜索</span>
            </div>
            <kbd className="pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘/ctrl</span>k
            </kbd>
          </Button>
        </div>
      </div>
      <div className="pr-40">
        <div className="no-drag-region flex items-center">
          {isLogin.data ? <ProfileMenu /> : <Login />}
        </div>
      </div>
    </header>
  )
}
