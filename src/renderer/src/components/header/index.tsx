import { MaximizeIcon } from '@renderer/assets/svg-icons'
import HeaderTitle from '@renderer/components/header/subject-title'
import { Button } from '@renderer/components/ui/button'
import ProfileMenu from '@renderer/components/user/avatarMenu'
import { client, handlers } from '@renderer/lib/client'
import { AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const platform = await client.platform({})

export default function Header() {
  const navigate = useNavigate()
  const { key } = useLocation()
  const [backDisable, setBackDisable] = useState(true)
  const [forwardDisable, setForwardDisable] = useState(true)
  const [isMaximize, setIsMaximize] = useState(false)
  useEffect(() => {
    setBackDisable(history.state.idx === 0)
    setForwardDisable(history.state.idx === history.length - 1)
  }, [key])
  useEffect(() => {
    const unlisten = handlers.isMaximize.listen((maximize) => {
      setIsMaximize(maximize)
    })
    return unlisten
  }, [])

  return (
    <header
      className="drag-region flex h-16 flex-row items-center justify-between gap-10 overflow-hidden bg-background"
      style={{ viewTransitionName: 'header' }}
    >
      <div className="flex flex-row justify-start gap-3">
        <div className="flex items-center justify-center gap-0.5">
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
        <AnimatePresence>
          <HeaderTitle />
        </AnimatePresence>
      </div>
      <div className="flex h-full basis-[30rem] flex-row justify-end">
        <div className="mr-5 flex h-full w-full max-w-[20rem] gap-5">
          <div className="flex grow items-center">
            <div className="no-drag-region w-full">
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
          <div className="no-drag-region flex items-center">
            <ProfileMenu />
          </div>
        </div>
        {platform === 'win32' && (
          <div className="no-drag-region flex flex-row items-center">
            <Button
              className="h-full w-fit rounded-none px-3"
              variant="ghost"
              onClick={() => client.minimizeCurrentWindow({})}
            >
              <Minus strokeWidth={0.6} className="w-4" />
            </Button>
            <Button
              className="relative h-full w-fit rounded-none px-3"
              variant="ghost"
              onClick={() => client.toggleMaximizeCurrentWindow({})}
            >
              {isMaximize ? (
                <MaximizeIcon className="w-[15px]" />
              ) : (
                <Square strokeWidth={1} className="w-[15px]" />
              )}
            </Button>
            <Button
              className="h-full w-fit rounded-none px-3 pr-4 hover:bg-red-600 hover:text-white"
              variant="ghost"
              onClick={() => client.closeCurrentWindow({})}
            >
              <X strokeWidth={1} className="w-[20px]" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
