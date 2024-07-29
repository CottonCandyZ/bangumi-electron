import ProfileMenu from '@renderer/components/user/avatarMenu'

export default function NavProfile() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full p-1.5">
        <ProfileMenu />
      </div>
    </div>
  )
}
