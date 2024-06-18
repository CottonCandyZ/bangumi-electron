import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import MyAvatar from '@renderer/components/user/avatarMenu/avatar'
import { logout } from '@renderer/constants/api/session'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function ProfileMenu() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
      toast.success('登出成功！')
    },
  })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MyAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Hi 棉花糖</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => mutation.mutate()}>登出</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
