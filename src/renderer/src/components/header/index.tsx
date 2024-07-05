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
    <header className="drag-region flex h-16 flex-row items-center">
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
