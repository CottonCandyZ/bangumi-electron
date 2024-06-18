import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'

export default function MyAvatar() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
