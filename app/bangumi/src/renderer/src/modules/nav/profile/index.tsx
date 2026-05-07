import { ProfileMenu } from '@renderer/modules/common/user/avatar-menu'
import { navOpenAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'

export function NavProfile() {
  const open = useAtomValue(navOpenAtom)
  return (
    <div className="flex w-full p-1">
      <ProfileMenu type={open ? 'expend' : 'small'} />
    </div>
  )
}
