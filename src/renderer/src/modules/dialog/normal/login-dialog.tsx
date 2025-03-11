import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { TEXT_CONFIG } from '@renderer/config/text'
import { LoginForm } from '@renderer/modules/common/user/login/form'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useAtom } from 'jotai'
import { CircleHelp } from 'lucide-react'

const { LOGIN_DIALOG } = TEXT_CONFIG

export function LoginDialog() {
  const [open, setOpen] = useAtom(loginDialogAtom)
  return (
    <Dialog open={open.open} onOpenChange={(open) => setOpen({ open })}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {LOGIN_DIALOG.TITLE}{' '}
            <HoverCard>
              <HoverCardTrigger asChild>
                <CircleHelp className="-mt-1 inline size-4" />
              </HoverCardTrigger>
              <HoverCardContent className="text-sm font-normal">
                <p>{LOGIN_DIALOG.STEP_EXPLAIN.TITLE}</p>
                <ol className="list-decimal px-3">
                  {LOGIN_DIALOG.STEP_EXPLAIN.STEP.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ol>
              </HoverCardContent>
            </HoverCard>
          </DialogTitle>
        </DialogHeader>
        <LoginForm success={() => setOpen({ open: false })} />
      </DialogContent>
    </Dialog>
  )
}
