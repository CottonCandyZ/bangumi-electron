import { ProfileMenu } from '@renderer/modules/common/user/avatar-menu'

export function NavProfile() {
  return (
    <div className="flex w-full shrink-0 justify-center pt-1.5">
      <ProfileMenu sidebar type="small" />
    </div>
  )
}
