import { ProfileMenu } from '@renderer/modules/common/user/avatarMenu'
import { navOpenAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function NavProfile() {
  const open = useAtomValue(navOpenAtom)
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full p-1.5">
        <ProfileMenu type={open ? 'expend' : 'small'} />
      </div>
    </div>
  )
}
