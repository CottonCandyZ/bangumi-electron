import { Button } from '@renderer/components/ui/button'
import ProfileMenu from '@renderer/components/user/avatarMenu'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  const { key } = useLocation()
  const [backDisable, setBackDisable] = useState(true)
  const [forwardDisable, setForwardDisable] = useState(true)
  useEffect(() => {
    setBackDisable(history.state.idx === 0)
    setForwardDisable(history.state.idx === history.length - 1)
  }, [key])
  return (
    <header
      className="drag-region flex h-16 flex-row items-center gap-10 bg-card"
      style={{ viewTransitionName: 'header' }}
    >
      <div className="flex flex-row justify-start gap-1">
        <div className="ml-[72px] flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            className="no-drag-region aspect-square p-0.5 shadow-none"
            onClick={() => navigate(-1)}
            disabled={backDisable}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            className="no-drag-region aspect-square p-0.5 shadow-none"
            onClick={() => navigate(1)}
            disabled={forwardDisable}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="flex w-full items-center justify-end">
        <div className="no-drag-region basis-72">
          <Button
            variant="outline"
            className="relative w-full justify-between rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none"
          >
            <div className="flex items-center gap-2">
              <span className="i-mingcute-search-line mt-0.5"></span>
              <span>搜索</span>
            </div>
            <kbd className="pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘/ctrl</span>k
            </kbd>
          </Button>
        </div>
      </div>
      <div className="pr-40">
        <div className="no-drag-region flex items-center">
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
