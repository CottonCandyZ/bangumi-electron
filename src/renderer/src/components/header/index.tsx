import ProfileMenu from '@renderer/components/user/avatarMenu'
import Login from '@renderer/components/user/login'
import { useIsLoginQuery } from '@renderer/constants/hooks/session'

export default function Header() {
  const isLogin = useIsLoginQuery()
  return (
    <header className="drag-region flex h-12 flex-row items-center py-1">
      <div className="flex flex-row justify-start">
        <div className="w-[72px]"></div>
        <div className="text no-drag-region w-max p-2">发现</div>
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
