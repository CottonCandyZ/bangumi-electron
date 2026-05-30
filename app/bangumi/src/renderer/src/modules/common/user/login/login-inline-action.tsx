import { Button } from '@renderer/components/ui/button'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSetAtom } from 'jotai'

export function LoginInlineAction({ className }: { className?: string }) {
  const openLoginDialog = useSetAtom(loginDialogAtom)

  return (
    <Button
      className={className ?? 'h-auto p-0 text-sm underline underline-offset-4'}
      onClick={() => openLoginDialog({ open: true })}
      size="sm"
      variant="link"
    >
      登录
    </Button>
  )
}
