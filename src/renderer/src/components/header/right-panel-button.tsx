import { Button } from '@renderer/components/ui/button'
import { rightPanelButtonAtomAction } from '@renderer/state/panel'
import { useAtom } from 'jotai'
import { useLocation } from 'react-router-dom'

export default function RightPanelButton() {
  const [openState, panelAction] = useAtom(rightPanelButtonAtomAction)
  const { pathname } = useLocation()
  const showSubjectId = pathname.includes('subject')
  return (
    <Button
      variant="ghost"
      className="no-drag-region mr-3 p-2 text-[1.4rem]"
      onClick={() => panelAction(showSubjectId ? 'subjectInfo' : null, !openState)}
    >
      {openState ? (
        <span className="i-tabler-layout-sidebar-right-filled" />
      ) : (
        <span className="i-tabler-layout-sidebar-right" />
      )}
    </Button>
  )
}
