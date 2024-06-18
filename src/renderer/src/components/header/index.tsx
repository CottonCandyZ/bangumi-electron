import ProfileMenu from '@renderer/components/user/avatarMenu'
import Login from '@renderer/components/user/login'
import { useSession } from '@renderer/components/wrapper/session'

export default function Header() {
  const { isLogin } = useSession()
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

      <div className="pr-40 justify-end">
        <div className="no-drag-region">{isLogin ? <ProfileMenu /> : <Login />}</div>
      </div>
    </header>
  )
}
